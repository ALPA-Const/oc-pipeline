"""Dashboard – aggregate KPI and summary endpoints."""

from flask import Blueprint
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.cost import CostItem
from app.models.pipeline import PipelineProject
from app.models.project import Project
from app.models.submittal import Submittal
from app.models.task import Task
from app.utils.response import api_response

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("")
@jwt_required()
def overview():
    """Return high-level KPIs for the executive dashboard."""

    # Project counts by status
    project_counts = (
        db.session.query(Project.status, func.count(Project.id))
        .group_by(Project.status)
        .all()
    )
    project_by_status = {row[0]: row[1] for row in project_counts}

    # Project counts by phase
    phase_counts = (
        db.session.query(Project.phase, func.count(Project.id))
        .group_by(Project.phase)
        .all()
    )
    project_by_phase = {row[0]: row[1] for row in phase_counts}

    # Total contract value
    total_contract_value = (
        db.session.query(func.coalesce(func.sum(Project.contract_value), 0))
        .filter(Project.status == "active")
        .scalar()
    )

    # Pipeline weighted value
    all_pipeline = PipelineProject.query.all()
    pipeline_weighted_value = sum(
        (p.value or 0) * ((p.win_probability or 0) / 100) for p in all_pipeline
    )

    # Open tasks
    open_tasks = Task.query.filter(Task.status.in_(["open", "in_progress"])).count()

    # Pending submittals
    pending_submittals = Submittal.query.filter(
        Submittal.status.in_(["pending", "submitted", "under_review"])
    ).count()

    # Cost summary
    cost_summary = db.session.query(
        func.coalesce(func.sum(CostItem.budgeted_amount), 0),
        func.coalesce(func.sum(CostItem.actual_amount), 0),
        func.coalesce(func.sum(CostItem.forecast_amount), 0),
    ).first()

    total_budgeted, total_actual, total_forecast = cost_summary

    return api_response(
        {
            "projects": {
                "total": sum(project_by_status.values()),
                "by_status": project_by_status,
                "by_phase": project_by_phase,
                "total_contract_value": float(total_contract_value),
            },
            "pipeline": {
                "total_cards": len(all_pipeline),
                "weighted_value": round(pipeline_weighted_value, 2),
                "stalled_count": sum(1 for p in all_pipeline if p.is_stalled),
            },
            "tasks": {
                "open": open_tasks,
            },
            "submittals": {
                "pending": pending_submittals,
            },
            "cost": {
                "total_budgeted": float(total_budgeted),
                "total_actual": float(total_actual),
                "total_forecast": float(total_forecast),
                "variance": round(float(total_budgeted) - float(total_actual), 2),
            },
        }
    )


@dashboard_bp.get("/pipeline-velocity")
@jwt_required()
def pipeline_velocity():
    """Return project counts per pipeline type and stage."""
    rows = (
        db.session.query(
            PipelineProject.pipeline_type,
            PipelineProject.stage_id,
            func.count(PipelineProject.id),
            func.coalesce(func.sum(PipelineProject.value), 0),
        )
        .group_by(PipelineProject.pipeline_type, PipelineProject.stage_id)
        .all()
    )

    result: dict = {}
    for pipeline_type, stage_id, count, value in rows:
        if pipeline_type not in result:
            result[pipeline_type] = []
        result[pipeline_type].append(
            {
                "stage_id": str(stage_id),
                "count": count,
                "total_value": float(value),
            }
        )

    return api_response({"velocity": result})
