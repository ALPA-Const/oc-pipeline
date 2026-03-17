"""Submittal workflow endpoints."""

import uuid as _uuid

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.project import Project
from app.models.submittal import Submittal
from app.utils.pagination import paginate
from app.utils.response import api_error, api_response


def _try_uuid(value):
    """Convert string to uuid.UUID object, returning value as-is if it already is one."""
    if isinstance(value, _uuid.UUID):
        return value
    try:
        return _uuid.UUID(str(value))
    except (ValueError, AttributeError):
        return value


submittals_bp = Blueprint("submittals", __name__)

VALID_STATUSES = {
    "pending", "submitted", "under_review", "approved", "rejected", "resubmit_required"
}


@submittals_bp.get("")
@jwt_required()
def list_submittals():
    """List submittals with optional filters."""
    query = Submittal.query.order_by(Submittal.created_at.desc())
    if project_id := request.args.get("project_id"):
        query = query.filter(Submittal.project_id == project_id)
    if status := request.args.get("status"):
        query = query.filter(Submittal.status == status)
    if submittal_type := request.args.get("type"):
        query = query.filter(Submittal.submittal_type == submittal_type)
    if spec := request.args.get("spec_section"):
        query = query.filter(Submittal.spec_section == spec)
    return api_response(paginate(query))


@submittals_bp.post("")
@jwt_required()
def create_submittal():
    """Create a new submittal."""
    body = request.get_json(silent=True) or {}
    user_id = _uuid.UUID(get_jwt_identity())

    project_id = body.get("project_id")
    submittal_number = (body.get("submittal_number") or "").strip()
    title = (body.get("title") or "").strip()

    if not project_id or not submittal_number or not title:
        return api_error("project_id, submittal_number, and title are required", 400)

    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    submittal = Submittal(
        project_id=project_id,
        submittal_number=submittal_number,
        title=title,
        description=body.get("description"),
        status=body.get("status", "pending"),
        submittal_type=body.get("submittal_type"),
        spec_section=body.get("spec_section"),
        spec_section_title=body.get("spec_section_title"),
        required_date=body.get("required_date"),
        priority=body.get("priority", 3),
        company_id=body.get("company_id"),
        created_by=user_id,
    )
    db.session.add(submittal)
    db.session.commit()
    return api_response({"submittal": submittal.to_dict()}, "Submittal created", 201)


@submittals_bp.get("/<submittal_id>")
@jwt_required()
def get_submittal(submittal_id: str):
    """Retrieve a single submittal."""
    s = db.session.get(Submittal, _try_uuid(submittal_id))
    if not s:
        return api_error("Submittal not found", 404)
    return api_response({"submittal": s.to_dict()})


@submittals_bp.put("/<submittal_id>")
@jwt_required()
def update_submittal(submittal_id: str):
    """Update a submittal (including workflow status transitions)."""
    s = db.session.get(Submittal, _try_uuid(submittal_id))
    if not s:
        return api_error("Submittal not found", 404)

    body = request.get_json(silent=True) or {}

    if "status" in body:
        if body["status"] not in VALID_STATUSES:
            return api_error(f"status must be one of {sorted(VALID_STATUSES)}", 400)
        s.status = body["status"]

    updatable = [
        "title", "description", "submittal_type", "spec_section",
        "spec_section_title", "required_date", "submitted_date",
        "review_deadline", "approved_date", "priority", "reviewer_id",
        "review_notes", "revision",
    ]
    for field in updatable:
        if field in body:
            setattr(s, field, body[field])

    db.session.commit()
    return api_response({"submittal": s.to_dict()}, "Submittal updated")


@submittals_bp.delete("/<submittal_id>")
@jwt_required()
def delete_submittal(submittal_id: str):
    """Delete a submittal."""
    s = db.session.get(Submittal, _try_uuid(submittal_id))
    if not s:
        return api_error("Submittal not found", 404)
    db.session.delete(s)
    db.session.commit()
    return api_response(None, "Submittal deleted")
