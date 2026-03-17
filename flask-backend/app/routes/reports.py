"""Reports – aggregated analytics for the Construction ERP."""

import uuid as _uuid

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.pipeline import PipelineProject
from app.models.project import Project
from app.models.task import Task
from app.utils.response import api_error, api_response


def _try_uuid(value):
    """Convert string to uuid.UUID object, returning value as-is if it already is one."""
    if isinstance(value, _uuid.UUID):
        return value
    try:
        return _uuid.UUID(str(value))
    except (ValueError, AttributeError):
        return value


reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/pipeline-summary")
@jwt_required()
def pipeline_summary():
    """
    Return a cross-pipeline summary showing project counts, total value,
    and weighted value for each pipeline type.
    """
    rows = (
        db.session.query(
            PipelineProject.pipeline_type,
            func.count(PipelineProject.id),
            func.coalesce(func.sum(PipelineProject.value), 0),
        )
        .group_by(PipelineProject.pipeline_type)
        .all()
    )

    summary = []
    for pipeline_type, count, total_value in rows:
        projects = PipelineProject.query.filter_by(pipeline_type=pipeline_type).all()
        weighted_value = sum(
            (p.value or 0) * ((p.win_probability or 0) / 100) for p in projects
        )
        stalled = sum(1 for p in projects if p.is_stalled)
        summary.append(
            {
                "pipeline_type": pipeline_type,
                "project_count": count,
                "total_value": float(total_value),
                "weighted_value": round(weighted_value, 2),
                "stalled_count": stalled,
            }
        )

    return api_response({"summary": summary})


@reports_bp.get("/project-distribution")
@jwt_required()
def project_distribution():
    """
    Return project counts broken down by state, type, and set-aside.
    """
    by_state = (
        db.session.query(Project.state, func.count(Project.id))
        .filter(Project.state.isnot(None))
        .group_by(Project.state)
        .all()
    )
    by_type = (
        db.session.query(Project.project_type, func.count(Project.id))
        .filter(Project.project_type.isnot(None))
        .group_by(Project.project_type)
        .all()
    )
    by_set_aside = (
        db.session.query(Project.set_aside, func.count(Project.id))
        .filter(Project.set_aside.isnot(None))
        .group_by(Project.set_aside)
        .all()
    )

    return api_response(
        {
            "by_state": [{"state": row[0], "count": row[1]} for row in by_state],
            "by_type": [{"type": row[0], "count": row[1]} for row in by_type],
            "by_set_aside": [
                {"set_aside": row[0], "count": row[1]} for row in by_set_aside
            ],
        }
    )


@reports_bp.get("/win-rate")
@jwt_required()
def win_rate():
    """
    Calculate win-rate metrics based on pipeline probability data.

    Accepts optional ``pipeline_type`` query param.
    """
    pipeline_type = request.args.get("pipeline_type")
    query = PipelineProject.query
    if pipeline_type:
        query = query.filter(PipelineProject.pipeline_type == pipeline_type)

    projects = query.all()
    if not projects:
        return api_response(
            {
                "project_count": 0,
                "avg_win_probability": 0,
                "weighted_value": 0,
                "by_priority": {},
            }
        )

    avg_prob = sum(p.win_probability or 0 for p in projects) / len(projects)
    weighted_value = sum(
        (p.value or 0) * ((p.win_probability or 0) / 100) for p in projects
    )

    by_priority: dict = {}
    for p in projects:
        key = p.priority or "unset"
        entry = by_priority.setdefault(
            key,
            {"count": 0, "total_value": 0.0, "avg_win_prob": 0.0, "_prob_sum": 0.0},
        )
        entry["count"] += 1
        entry["total_value"] += p.value or 0
        entry["_prob_sum"] += p.win_probability or 0

    # Compute averages and clean up internal keys
    for entry in by_priority.values():
        if entry["count"]:
            entry["avg_win_prob"] = round(entry["_prob_sum"] / entry["count"], 2)
        del entry["_prob_sum"]

    return api_response(
        {
            "project_count": len(projects),
            "avg_win_probability": round(avg_prob, 2),
            "weighted_value": round(weighted_value, 2),
            "by_priority": by_priority,
        }
    )


@reports_bp.get("/task-summary")
@jwt_required()
def task_summary():
    """Return task counts broken down by status and priority."""
    project_id = request.args.get("project_id")

    base_query = Task.query
    status_query = db.session.query(Task.status, func.count(Task.id))
    priority_query = db.session.query(Task.priority, func.count(Task.id))

    if project_id:
        project_exists = db.session.get(Project, _try_uuid(project_id))
        if not project_exists:
            return api_error("Project not found", 404)
        base_query = base_query.filter(Task.project_id == project_id)
        status_query = status_query.filter(Task.project_id == project_id)
        priority_query = priority_query.filter(Task.project_id == project_id)

    by_status = status_query.group_by(Task.status).all()
    by_priority = priority_query.group_by(Task.priority).all()

    return api_response(
        {
            "by_status": {row[0]: row[1] for row in by_status},
            "by_priority": {row[0]: row[1] for row in by_priority},
            "total": base_query.count(),
        }
    )
