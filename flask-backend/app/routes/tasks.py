"""Task / action-item CRUD endpoints."""

import uuid as _uuid
from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.project import Project
from app.models.task import Task
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


tasks_bp = Blueprint("tasks", __name__)

VALID_STATUSES = {"open", "in_progress", "resolved", "closed"}
VALID_PRIORITIES = {"low", "medium", "high", "critical"}


@tasks_bp.get("")
@jwt_required()
def list_tasks():
    """List all tasks with optional filters."""
    query = Task.query.order_by(Task.created_at.desc())
    if project_id := request.args.get("project_id"):
        query = query.filter(Task.project_id == project_id)
    if status := request.args.get("status"):
        query = query.filter(Task.status == status)
    if priority := request.args.get("priority"):
        query = query.filter(Task.priority == priority)
    if category := request.args.get("category"):
        query = query.filter(Task.category == category)
    if assigned_to := request.args.get("assigned_to"):
        query = query.filter(Task.assigned_to == assigned_to)
    return api_response(paginate(query))


@tasks_bp.post("")
@jwt_required()
def create_task():
    """Create a new task / action item."""
    body = request.get_json(silent=True) or {}
    user_id = _uuid.UUID(get_jwt_identity())

    title = (body.get("title") or "").strip()
    project_id = body.get("project_id")
    if not title or not project_id:
        return api_error("title and project_id are required", 400)

    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    priority = body.get("priority", "medium")
    if priority not in VALID_PRIORITIES:
        return api_error(f"priority must be one of {sorted(VALID_PRIORITIES)}", 400)

    task = Task(
        project_id=project_id,
        title=title,
        description=body.get("description"),
        status=body.get("status", "open"),
        priority=priority,
        category=body.get("category"),
        assigned_to=body.get("assigned_to"),
        due_date=body.get("due_date"),
        company_id=body.get("company_id"),
        created_by=user_id,
    )
    db.session.add(task)
    db.session.commit()
    return api_response({"task": task.to_dict()}, "Task created", 201)


@tasks_bp.get("/<task_id>")
@jwt_required()
def get_task(task_id: str):
    """Retrieve a single task."""
    task = db.session.get(Task, _try_uuid(task_id))
    if not task:
        return api_error("Task not found", 404)
    return api_response({"task": task.to_dict()})


@tasks_bp.put("/<task_id>")
@jwt_required()
def update_task(task_id: str):
    """Update a task."""
    task = db.session.get(Task, _try_uuid(task_id))
    if not task:
        return api_error("Task not found", 404)

    body = request.get_json(silent=True) or {}

    if "status" in body:
        if body["status"] not in VALID_STATUSES:
            return api_error(f"status must be one of {sorted(VALID_STATUSES)}", 400)
        if body["status"] == "resolved" and task.status != "resolved":
            task.resolved_at = datetime.now(timezone.utc)
        task.status = body["status"]

    for field in ("title", "description", "priority", "category", "assigned_to", "due_date"):
        if field in body:
            setattr(task, field, body[field])

    db.session.commit()
    return api_response({"task": task.to_dict()}, "Task updated")


@tasks_bp.delete("/<task_id>")
@jwt_required()
def delete_task(task_id: str):
    """Delete a task."""
    task = db.session.get(Task, _try_uuid(task_id))
    if not task:
        return api_error("Task not found", 404)
    db.session.delete(task)
    db.session.commit()
    return api_response(None, "Task deleted")
