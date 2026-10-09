import os
import datetime
from functools import wraps
import jwt
from flask import request, jsonify
from models import User

# Load secret key from environment or use a cryptographically strong 64-char fallback
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or os.getenv('SECRET_KEY') or 'trackjob_sec_jwt_auth_key_enterprise_2026_9f8e7d6c5b4a3928170123456789abcdef'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DAYS = 7
COOKIE_NAME = 'auth_token'

def generate_jwt_token(user):
    """
    Generate a cryptographically signed JWT for the given user.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        'user_id': user.id,
        'email': user.email,
        'iat': now,
        'exp': now + datetime.timedelta(days=JWT_EXPIRATION_DAYS)
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def decode_jwt_token(token):
    """
    Decode and validate a JWT. Returns payload dict or raises an exception.
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

def extract_token_from_request():
    """
    Extract token securely.
    Prioritizes HttpOnly cookie; allows Authorization: Bearer <token> as fallback.
    """
    # 1. Primary: HttpOnly cookie
    token = request.cookies.get(COOKIE_NAME)
    if token:
        return token
    
    # 2. Secondary fallback: Authorization Header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()

    return None

def jwt_required(f):
    """
    Decorator that protects endpoints by verifying the JWT from the HttpOnly cookie.
    Attaches the authenticated User instance to request.current_user.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = extract_token_from_request()
        if not token:
            return jsonify({"error": "Authentication required. No session cookie found."}), 401

        try:
            payload = decode_jwt_token(token)
            user_id = payload.get('user_id')
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User account no longer exists."}), 401

            # Attach authenticated user to request context
            request.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Authentication session has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token."}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated_function

def _get_cookie_security_config():
    """
    Determines secure and SameSite cookie policies based on COOKIE_SECURE,
    COOKIE_SAMESITE, environment, and reverse-proxy HTTPS status.
    """
    env_secure = os.getenv('COOKIE_SECURE')
    if env_secure is not None:
        is_secure = env_secure.strip().lower() in ('true', '1', 'yes')
    else:
        is_secure = (
            os.getenv('FLASK_ENV') == 'production' or
            os.getenv('ENV') == 'production' or
            request.is_secure or
            request.headers.get('X-Forwarded-Proto', '').lower() == 'https'
        )

    env_samesite = os.getenv('COOKIE_SAMESITE')
    if env_samesite is not None and env_samesite.strip():
        samesite_policy = env_samesite.strip()
    else:
        samesite_policy = 'None' if is_secure else 'Lax'

    return is_secure, samesite_policy

def set_auth_cookie(response, token):
    """
    Attaches the JWT as a secure HttpOnly cookie to the HTTP response.
    This ensures JavaScript / DevTools storage (localStorage/sessionStorage)
    cannot access, read, or leak the token.
    """
    is_secure, samesite_policy = _get_cookie_security_config()

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60,
        httponly=True,            # CRITICAL: Blocks JavaScript access (XSS immune)
        samesite=samesite_policy, # Honors COOKIE_SAMESITE or defaults to None in prod
        secure=is_secure,         # Honors COOKIE_SECURE or defaults to True in prod
        path='/'                  # Valid for all API routes
    )
    return response

def clear_auth_cookie(response):
    """
    Clears the HttpOnly auth cookie upon logout.
    """
    is_secure, samesite_policy = _get_cookie_security_config()

    response.set_cookie(
        key=COOKIE_NAME,
        value='',
        max_age=0,
        expires=0,
        httponly=True,
        samesite=samesite_policy,
        secure=is_secure,
        path='/'
    )
    return response
