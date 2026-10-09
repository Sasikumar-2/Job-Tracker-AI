import os
import json
import io
import pathlib
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pypdf import PdfReader
from models import db, User, Application, ApplicationAnalysis
from ai_service import analyze_job_match
from auth_service import (
    generate_jwt_token,
    jwt_required,
    set_auth_cookie,
    clear_auth_cookie
)

load_dotenv()

app = Flask(__name__)
os.makedirs(app.instance_path, exist_ok=True)
default_db_uri = f"sqlite:///{(pathlib.Path(app.instance_path) / 'job_tracker.db').as_posix()}"
database_url = os.getenv('DATABASE_URL')
# Normalize postgres:// to postgresql:// for modern SQLAlchemy compatibility
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or default_db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Allowed CORS origins (supports local development, Vercel/Netlify/Render live URLs, and FRONTEND_URL env var)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    r"^https://.*\.vercel\.app$",
    r"^https://.*\.netlify\.app$",
    r"^https://.*\.onrender\.com$"
]
custom_origins = os.getenv('FRONTEND_URL') or os.getenv('CORS_ORIGINS')
if custom_origins:
    if custom_origins.strip() == '*':
        allowed_origins = [r"^https?://.*$"]
    else:
        for origin in custom_origins.split(','):
            origin_clean = origin.strip()
            if origin_clean and origin_clean not in allowed_origins:
                allowed_origins.append(origin_clean)

CORS(
    app,
    supports_credentials=True,
    origins=allowed_origins,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """Healthcheck endpoint for hosting providers (Render, Railway, etc.)"""
    return jsonify({
        "status": "healthy",
        "service": "Job-Tracker-AI Backend API",
        "version": "1.0.0"
    }), 200

# Default candidate resume fallback for ATS matching
DEFAULT_RESUME = """
Software Engineer with skills in Python, JavaScript, SQL, Flask, React.js, HTML5, CSS3, Bootstrap, 
MongoDB, SQLite, Git, GitHub, REST APIs, OOP, DBMS, Data Structures, Prompt Engineering, and LLMs.
"""

def is_valid_email(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

# ================= AUTHENTICATION ROUTES =================

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Please provide a valid email address"}), 400

        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "An account with this email already exists"}), 400

        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Generate JWT token and attach it as an HttpOnly cookie (and JSON token payload)
        token = generate_jwt_token(user)
        response = jsonify({
            "message": "User registered successfully",
            "token": token,
            "user_id": user.id,
            "email": user.email,
            "resume_text": ""
        })
        set_auth_cookie(response, token)
        return response, 201

    except Exception as e:
        print("SIGNUP ERROR:", str(e))
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Issue secure JWT in HttpOnly cookie (and JSON token payload)
    token = generate_jwt_token(user)
    response = jsonify({
        "message": "Login successful",
        "token": token,
        "user_id": user.id,
        "email": user.email,
        "resume_text": user.resume_text or ""
    })
    set_auth_cookie(response, token)
    return response, 200

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    Clears the HttpOnly authentication cookie to end session securely.
    """
    response = jsonify({"message": "Logged out successfully"})
    clear_auth_cookie(response)
    return response, 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required
def get_current_user():
    """
    Verifies HttpOnly JWT cookie and returns authenticated user identity.
    Enables client in-memory state rehydration without ANY tokens in localStorage.
    """
    user = request.current_user
    return jsonify({
        "user_id": user.id,
        "email": user.email,
        "resume_text": user.resume_text or ""
    }), 200

# ================= USER PROFILE & RESUME ROUTES =================

@app.route('/api/users/<int:user_id>/resume', methods=['PUT'])
@jwt_required
def update_resume(user_id):
    # IDOR Prevention: Ensure users can only modify their own profile
    if request.current_user.id != user_id:
        return jsonify({"error": "Forbidden: Cannot update another user's resume"}), 403

    data = request.json or {}
    user = request.current_user
    user.resume_text = data.get('resume_text', '')
    db.session.commit()
    return jsonify({"message": "Resume updated successfully"}), 200

@app.route('/api/users/<int:user_id>/upload-resume', methods=['POST'])
@jwt_required
def upload_resume(user_id):
    # IDOR Prevention: Ensure users can only upload for their own profile
    if request.current_user.id != user_id:
        return jsonify({"error": "Forbidden: Cannot upload for another user"}), 403

    if 'resume_file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['resume_file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read uploaded PDF file in memory
        pdf_reader = PdfReader(io.BytesIO(file.read()))
        extracted_text = ""
        
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"

        if not extracted_text.strip():
            return jsonify({"error": "Could not extract text from PDF file."}), 400

        user = request.current_user
        user.resume_text = extracted_text
        db.session.commit()

        return jsonify({
            "message": "Resume uploaded and parsed successfully!",
            "resume_text": user.resume_text
        }), 200

    except Exception as e:
        print("PDF UPLOAD ERROR:", str(e))
        return jsonify({"error": f"Failed to parse PDF file: {str(e)}"}), 500

# ================= APPLICATION MANAGEMENT ROUTES =================

@app.route('/api/applications', methods=['GET'])
@jwt_required
def get_applications():
    # Strictly scoped to current authenticated user
    apps = Application.query.filter_by(user_id=request.current_user.id).order_by(Application.created_at.desc()).all()

    result = []
    for a in apps:
        analysis_data = None
        if a.analysis:
            analysis_data = {
                "match_score": a.analysis.match_score,
                "matching_skills": json.loads(a.analysis.matching_skills or "[]"),
                "missing_skills": json.loads(a.analysis.missing_skills or "[]"),
                "tailored_summary": a.analysis.tailored_summary
            }
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "company_name": a.company_name,
            "job_title": a.job_title,
            "job_description": a.job_description,
            "status": a.status,
            "location": a.location or "",
            "salary_range": a.salary_range or "",
            "job_url": a.job_url or "",
            "notes": a.notes or "",
            "applied_date": a.applied_date or "",
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "analysis": analysis_data
        })
    return jsonify(result), 200

@app.route('/api/applications', methods=['POST'])
@jwt_required
def create_application():
    data = request.json or {}
    if not data.get('company_name') or not data.get('job_title'):
        return jsonify({"error": "Company name and job title are required"}), 400

    # User ID is enforced securely from JWT, ignoring any spoofed client parameter
    new_app = Application(
        user_id=request.current_user.id,
        company_name=data['company_name'],
        job_title=data['job_title'],
        job_description=data.get('job_description', ''),
        status=data.get('status', 'Saved'),
        location=data.get('location', ''),
        salary_range=data.get('salary_range', ''),
        job_url=data.get('job_url', ''),
        notes=data.get('notes', ''),
        applied_date=data.get('applied_date', '')
    )
    db.session.add(new_app)
    db.session.commit()
    return jsonify({"message": "Application created", "id": new_app.id}), 201

@app.route('/api/applications/<int:app_id>', methods=['PUT'])
@jwt_required
def update_application(app_id):
    app_obj = Application.query.get_or_404(app_id)
    if app_obj.user_id != request.current_user.id:
        return jsonify({"error": "Forbidden: You do not own this application record"}), 403

    data = request.json or {}
    if 'company_name' in data: app_obj.company_name = data['company_name']
    if 'job_title' in data: app_obj.job_title = data['job_title']
    if 'job_description' in data: app_obj.job_description = data['job_description']
    if 'status' in data: app_obj.status = data['status']
    if 'location' in data: app_obj.location = data['location']
    if 'salary_range' in data: app_obj.salary_range = data['salary_range']
    if 'job_url' in data: app_obj.job_url = data['job_url']
    if 'notes' in data: app_obj.notes = data['notes']
    if 'applied_date' in data: app_obj.applied_date = data['applied_date']
    db.session.commit()
    return jsonify({"message": "Application updated successfully"}), 200

@app.route('/api/applications/<int:app_id>/status', methods=['PATCH'])
@jwt_required
def update_status(app_id):
    app_obj = Application.query.get_or_404(app_id)
    if app_obj.user_id != request.current_user.id:
        return jsonify({"error": "Forbidden: You do not own this application record"}), 403

    data = request.json or {}
    app_obj.status = data.get('status', app_obj.status)
    db.session.commit()
    return jsonify({"message": "Status updated"}), 200

@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
@jwt_required
def delete_application(app_id):
    app_obj = Application.query.get_or_404(app_id)
    if app_obj.user_id != request.current_user.id:
        return jsonify({"error": "Forbidden: You do not own this application record"}), 403

    db.session.delete(app_obj)
    db.session.commit()
    return jsonify({"message": "Application deleted successfully"}), 200

# ================= AI ANALYSIS ROUTE =================

@app.route('/api/applications/<int:app_id>/analyze', methods=['POST'])
@jwt_required
def analyze_application(app_id):
    app_obj = Application.query.get_or_404(app_id)
    if app_obj.user_id != request.current_user.id:
        return jsonify({"error": "Forbidden: You do not own this application record"}), 403

    user = request.current_user
    resume_to_use = (user.resume_text if user and user.resume_text else DEFAULT_RESUME)
    
    try:
        analysis_result = analyze_job_match(resume_to_use, app_obj.job_description)
        
        existing_analysis = ApplicationAnalysis.query.filter_by(application_id=app_id).first()
        if not existing_analysis:
            existing_analysis = ApplicationAnalysis(application_id=app_id)
            db.session.add(existing_analysis)
            
        existing_analysis.match_score = analysis_result.get('match_score', 0)
        existing_analysis.matching_skills = json.dumps(analysis_result.get('matching_skills', []))
        existing_analysis.missing_skills = json.dumps(analysis_result.get('missing_skills', []))
        existing_analysis.tailored_summary = analysis_result.get('tailored_summary', '')
        
        db.session.commit()
        return jsonify({"message": "Analysis completed successfully", "analysis": analysis_result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1')
    app.run(host='0.0.0.0', port=port, debug=debug_mode)