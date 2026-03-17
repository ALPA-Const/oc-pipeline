"""Project CRUD endpoints."""

import uuid as _uuid

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.project import Project
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


projects_bp = Blueprint("projects", __name__)

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

ALLOWED_PHASES = {"opportunity", "preconstruction", "execution", "closeout"}
ALLOWED_STATUSES = {"active", "completed", "on_hold", "cancelled"}


def _apply_filters(query, args: dict):
    """Apply optional query-string filters to a Project query."""
    if status := args.get("status"):
        query = query.filter(Project.status == status)
    if phase := args.get("phase"):
        query = query.filter(Project.phase == phase)
    if project_type := args.get("type"):
        query = query.filter(Project.project_type == project_type)
    if state := args.get("state"):
        query = query.filter(Project.state == state)
    if agency := args.get("agency"):
        query = query.filter(Project.agency.ilike(f"%{agency}%"))
    if q := args.get("q"):
        query = query.filter(Project.name.ilike(f"%{q}%"))
    return query


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@projects_bp.get("")
@jwt_required()
def list_projects():
    """List projects with optional filters and pagination."""
    query = Project.query.order_by(Project.created_at.desc())
    query = _apply_filters(query, request.args)
    return api_response(paginate(query))


@projects_bp.post("")
@jwt_required()
def create_project():
    """Create a new construction project."""
    body = request.get_json(silent=True) or {}
    user_id = _uuid.UUID(get_jwt_identity())

    name = (body.get("name") or "").strip()
    if not name:
        return api_error("name is required", 400)

    phase = body.get("phase", "opportunity")
    if phase not in ALLOWED_PHASES:
        return api_error(f"phase must be one of {sorted(ALLOWED_PHASES)}", 400)

    project = Project(
        name=name,
        description=body.get("description"),
        status=body.get("status", "active"),
        phase=phase,
        address=body.get("address"),
        city=body.get("city"),
        state=body.get("state"),
        zip_code=body.get("zip_code"),
        contract_value=body.get("contract_value"),
        estimated_value=body.get("estimated_value"),
        project_type=body.get("project_type"),
        set_aside=body.get("set_aside"),
        magnitude=body.get("magnitude"),
        contract_number=body.get("contract_number"),
        agency=body.get("agency"),
        win_probability=body.get("win_probability"),
        company_id=body.get("company_id"),
        created_by=user_id,
    )

    db.session.add(project)
    db.session.commit()
    return api_response({"project": project.to_dict()}, "Project created", 201)


@projects_bp.get("/<project_id>")
@jwt_required()
def get_project(project_id: str):
    """Retrieve a single project by ID."""
    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)
    return api_response({"project": project.to_dict()})


@projects_bp.put("/<project_id>")
@jwt_required()
def update_project(project_id: str):
    """Update a project's fields."""
    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    body = request.get_json(silent=True) or {}

    updatable = [
        "name", "description", "status", "phase", "address", "city", "state",
        "zip_code", "contract_value", "estimated_value", "actual_cost",
        "project_type", "set_aside", "magnitude", "contract_number", "agency",
        "win_probability", "start_date", "end_date", "bid_due_date", "award_date",
    ]
    for field in updatable:
        if field in body:
            setattr(project, field, body[field])

    db.session.commit()
    return api_response({"project": project.to_dict()}, "Project updated")


@projects_bp.delete("/<project_id>")
@jwt_required()
def delete_project(project_id: str):
    """Soft-delete a project by setting its status to 'cancelled'."""
    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    project.status = "cancelled"
    db.session.commit()
    return api_response(None, "Project cancelled", 200)


@projects_bp.get("/<project_id>/summary")
@jwt_required()
def project_summary(project_id: str):
    """Return a project alongside its task and cost summary."""
    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    data = project.to_dict()
    data["task_count"] = len(project.tasks)
    data["open_task_count"] = sum(
        1 for t in project.tasks if t.status in {"open", "in_progress"}
    )
    data["submittal_count"] = len(project.submittals)
    data["pending_submittal_count"] = sum(
        1 for s in project.submittals if s.status == "pending"
    )
    total_budgeted = sum(b.total_amount for b in project.budgets)
    total_actual = sum(ci.actual_amount for ci in project.cost_items)
    data["total_budgeted"] = total_budgeted
    data["total_actual"] = total_actual
    data["cost_variance"] = round(total_budgeted - total_actual, 2)

    return api_response({"project": data})
