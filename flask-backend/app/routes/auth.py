"""Authentication routes – register, login, refresh, logout."""

import uuid

from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app import db
from app.models.user import User
from app.utils.response import api_error, api_response

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    """Create a new user account."""
    body = request.get_json(silent=True) or {}

    email: str = (body.get("email") or "").strip().lower()
    password: str = body.get("password") or ""
    full_name: str = (body.get("full_name") or "").strip()
    role: str = (body.get("role") or "viewer").strip()

    if not email or not password or not full_name:
        return api_error("email, password, and full_name are required", 400)

    if len(password) < 8:
        return api_error("Password must be at least 8 characters", 400)

    if User.query.filter_by(email=email).first():
        return api_error("A user with that email already exists", 409)

    user = User(email=email, full_name=full_name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return api_response(
        {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        "User created successfully",
        201,
    )


@auth_bp.post("/login")
def login():
    """Authenticate a user and return JWT tokens."""
    body = request.get_json(silent=True) or {}

    email: str = (body.get("email") or "").strip().lower()
    password: str = body.get("password") or ""

    if not email or not password:
        return api_error("email and password are required", 400)

    user = User.query.filter_by(email=email, is_active=True).first()
    if not user or not user.check_password(password):
        return api_error("Invalid email or password", 401)

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return api_response(
        {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token using the refresh token."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return api_response({"access_token": access_token})


@auth_bp.get("/me")
@jwt_required()
def me():
    """Return the currently authenticated user's profile."""
    user = db.session.get(User, uuid.UUID(get_jwt_identity()))
    if not user or not user.is_active:
        return api_error("User not found", 404)
    return api_response({"user": user.to_dict()})


@auth_bp.put("/me")
@jwt_required()
def update_me():
    """Update the current user's profile (name, password)."""
    user = db.session.get(User, uuid.UUID(get_jwt_identity()))
    if not user:
        return api_error("User not found", 404)

    body = request.get_json(silent=True) or {}

    if "full_name" in body:
        user.full_name = body["full_name"].strip()
    if "password" in body:
        if len(body["password"]) < 8:
            return api_error("Password must be at least 8 characters", 400)
        user.set_password(body["password"])

    db.session.commit()
    return api_response({"user": user.to_dict()}, "Profile updated")
