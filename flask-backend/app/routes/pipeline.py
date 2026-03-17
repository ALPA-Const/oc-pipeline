"""Pipeline stage and Kanban card management endpoints."""

import uuid as _uuid
from datetime import datetime, timezone

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.pipeline import PipelineProject, PipelineStage
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


pipeline_bp = Blueprint("pipeline", __name__)

PIPELINE_TYPES = {"opportunity", "preconstruction", "execution", "closeout"}

# ---------------------------------------------------------------------------
# Stage endpoints
# ---------------------------------------------------------------------------


@pipeline_bp.get("/stages")
@jwt_required()
def list_stages():
    """Return all pipeline stages, optionally filtered by pipeline_type."""
    query = PipelineStage.query.order_by(PipelineStage.pipeline_type, PipelineStage.order)
    if pipeline_type := request.args.get("pipeline_type"):
        query = query.filter(PipelineStage.pipeline_type == pipeline_type)
    stages = query.all()
    return api_response({"stages": [s.to_dict() for s in stages]})


@pipeline_bp.post("/stages")
@jwt_required()
def create_stage():
    """Create a new pipeline stage."""
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    pipeline_type = (body.get("pipeline_type") or "").strip()

    if not name or not pipeline_type:
        return api_error("name and pipeline_type are required", 400)
    if pipeline_type not in PIPELINE_TYPES:
        return api_error(f"pipeline_type must be one of {sorted(PIPELINE_TYPES)}", 400)

    stage = PipelineStage(
        name=name,
        pipeline_type=pipeline_type,
        order=body.get("order", 0),
        description=body.get("description"),
        color=body.get("color"),
        wip_limit=body.get("wip_limit"),
        company_id=body.get("company_id"),
    )
    db.session.add(stage)
    db.session.commit()
    return api_response({"stage": stage.to_dict()}, "Stage created", 201)


@pipeline_bp.put("/stages/<stage_id>")
@jwt_required()
def update_stage(stage_id: str):
    """Update a pipeline stage."""
    stage = db.session.get(PipelineStage, _try_uuid(stage_id))
    if not stage:
        return api_error("Stage not found", 404)

    body = request.get_json(silent=True) or {}
    for field in ("name", "order", "description", "color", "wip_limit"):
        if field in body:
            setattr(stage, field, body[field])
    db.session.commit()
    return api_response({"stage": stage.to_dict()}, "Stage updated")


@pipeline_bp.delete("/stages/<stage_id>")
@jwt_required()
def delete_stage(stage_id: str):
    """Delete a pipeline stage (only if empty)."""
    stage = db.session.get(PipelineStage, _try_uuid(stage_id))
    if not stage:
        return api_error("Stage not found", 404)
    if stage.pipeline_projects:
        return api_error("Cannot delete a stage that contains projects", 409)
    db.session.delete(stage)
    db.session.commit()
    return api_response(None, "Stage deleted")


# ---------------------------------------------------------------------------
# Pipeline project (Kanban card) endpoints
# ---------------------------------------------------------------------------


@pipeline_bp.get("/projects")
@jwt_required()
def list_pipeline_projects():
    """List pipeline projects with optional filters and pagination."""
    query = PipelineProject.query.order_by(PipelineProject.created_at.desc())
    if pipeline_type := request.args.get("pipeline_type"):
        query = query.filter(PipelineProject.pipeline_type == pipeline_type)
    if stage_id := request.args.get("stage_id"):
        query = query.filter(PipelineProject.stage_id == stage_id)
    if stalled := request.args.get("stalled"):
        query = query.filter(PipelineProject.is_stalled == (stalled.lower() == "true"))
    if priority := request.args.get("priority"):
        query = query.filter(PipelineProject.priority == priority)
    return api_response(paginate(query))


@pipeline_bp.post("/projects")
@jwt_required()
def create_pipeline_project():
    """Add a new project card to the pipeline."""
    body = request.get_json(silent=True) or {}
    user_id = _uuid.UUID(get_jwt_identity())

    name = (body.get("name") or "").strip()
    stage_id = body.get("stage_id")
    pipeline_type = (body.get("pipeline_type") or "").strip()

    if not name or not stage_id or not pipeline_type:
        return api_error("name, stage_id, and pipeline_type are required", 400)

    stage = db.session.get(PipelineStage, _try_uuid(stage_id))
    if not stage:
        return api_error("Stage not found", 404)

    pp = PipelineProject(
        stage_id=_try_uuid(stage_id),
        pipeline_type=pipeline_type,
        name=name,
        value=body.get("value"),
        win_probability=body.get("win_probability"),
        agency=body.get("agency"),
        set_aside=body.get("set_aside"),
        pm=body.get("pm"),
        priority=body.get("priority"),
        tags=body.get("tags"),
        company_id=body.get("company_id"),
        created_by=user_id,
    )
    db.session.add(pp)
    db.session.commit()
    return api_response({"pipeline_project": pp.to_dict()}, "Pipeline project created", 201)


@pipeline_bp.get("/projects/<pp_id>")
@jwt_required()
def get_pipeline_project(pp_id: str):
    """Retrieve a single pipeline project card."""
    pp = db.session.get(PipelineProject, _try_uuid(pp_id))
    if not pp:
        return api_error("Pipeline project not found", 404)
    return api_response({"pipeline_project": pp.to_dict()})


@pipeline_bp.put("/projects/<pp_id>")
@jwt_required()
def update_pipeline_project(pp_id: str):
    """Update a pipeline project card (including stage transitions)."""
    pp = db.session.get(PipelineProject, _try_uuid(pp_id))
    if not pp:
        return api_error("Pipeline project not found", 404)

    body = request.get_json(silent=True) or {}

    # Handle stage transition
    if "stage_id" in body and str(body["stage_id"]) != str(pp.stage_id):
        new_stage = db.session.get(PipelineStage, _try_uuid(body["stage_id"]))
        if not new_stage:
            return api_error("Target stage not found", 404)
        pp.stage_id = new_stage.id
        pp.entered_stage_at = datetime.now(timezone.utc)
        pp.days_in_stage = 0

    updatable = [
        "name", "value", "win_probability", "agency", "set_aside", "pm",
        "priority", "is_stalled", "stalled_reason", "tags",
    ]
    for field in updatable:
        if field in body:
            setattr(pp, field, body[field])

    if body.get("is_stalled") and not pp.stalled_at:
        pp.stalled_at = datetime.now(timezone.utc)
    elif not body.get("is_stalled", True):
        pp.stalled_at = None

    db.session.commit()
    return api_response({"pipeline_project": pp.to_dict()}, "Pipeline project updated")


@pipeline_bp.delete("/projects/<pp_id>")
@jwt_required()
def delete_pipeline_project(pp_id: str):
    """Remove a project from the pipeline."""
    pp = db.session.get(PipelineProject, _try_uuid(pp_id))
    if not pp:
        return api_error("Pipeline project not found", 404)
    db.session.delete(pp)
    db.session.commit()
    return api_response(None, "Pipeline project removed")


# ---------------------------------------------------------------------------
# Metrics endpoint
# ---------------------------------------------------------------------------


@pipeline_bp.get("/metrics")
@jwt_required()
def pipeline_metrics():
    """Return summary metrics for a given pipeline type."""
    pipeline_type = request.args.get("pipeline_type", "opportunity")

    projects = PipelineProject.query.filter_by(pipeline_type=pipeline_type).all()

    total_value = sum((p.value or 0) for p in projects)
    weighted_value = sum(
        (p.value or 0) * ((p.win_probability or 0) / 100) for p in projects
    )
    stalled_count = sum(1 for p in projects if p.is_stalled)
    avg_win_prob = (
        sum(p.win_probability or 0 for p in projects) / len(projects) if projects else 0
    )

    by_priority: dict = {}
    for p in projects:
        key = p.priority or "unset"
        by_priority[key] = by_priority.get(key, 0) + 1

    return api_response(
        {
            "pipeline_type": pipeline_type,
            "project_count": len(projects),
            "total_value": round(total_value, 2),
            "weighted_value": round(weighted_value, 2),
            "stalled_count": stalled_count,
            "avg_win_probability": round(avg_win_prob, 2),
            "by_priority": by_priority,
        }
    )
