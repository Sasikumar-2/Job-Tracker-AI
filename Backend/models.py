from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    resume_text = db.Column(db.Text, nullable=True)
    
    applications = db.relationship('Application', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    job_title = db.Column(db.String(100), nullable=False)
    job_description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Saved')
    location = db.Column(db.String(100), nullable=True)
    salary_range = db.Column(db.String(50), nullable=True)
    job_url = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    applied_date = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    analysis = db.relationship('ApplicationAnalysis', backref='application', uselist=False, cascade="all, delete-orphan")

class ApplicationAnalysis(db.Model):
    __tablename__ = 'application_analyses'
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    match_score = db.Column(db.Integer)
    matching_skills = db.Column(db.Text)
    missing_skills = db.Column(db.Text)
    tailored_summary = db.Column(db.Text)
    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)