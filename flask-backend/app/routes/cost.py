"""Cost management endpoints – budgets and cost line items."""

import uuid as _uuid

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app import db
from app.models.cost import Budget, CostItem
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


cost_bp = Blueprint("cost", __name__)

# ---------------------------------------------------------------------------
# Budget endpoints
# ---------------------------------------------------------------------------


@cost_bp.get("/budgets")
@jwt_required()
def list_budgets():
    """List budgets, optionally filtered by project."""
    query = Budget.query.order_by(Budget.created_at.desc())
    if project_id := request.args.get("project_id"):
        query = query.filter(Budget.project_id == project_id)
    return api_response(paginate(query))


@cost_bp.post("/budgets")
@jwt_required()
def create_budget():
    """Create a budget for a project."""
    body = request.get_json(silent=True) or {}
    user_id = _uuid.UUID(get_jwt_identity())

    project_id = body.get("project_id")
    if not project_id:
        return api_error("project_id is required", 400)

    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    budget = Budget(
        project_id=project_id,
        name=body.get("name", "Original Budget"),
        total_amount=body.get("total_amount", 0.0),
        contingency_pct=body.get("contingency_pct", 10.0),
        status=body.get("status", "draft"),
        notes=body.get("notes"),
        company_id=body.get("company_id"),
        created_by=user_id,
    )
    db.session.add(budget)
    db.session.commit()
    return api_response({"budget": budget.to_dict()}, "Budget created", 201)


@cost_bp.get("/budgets/<budget_id>")
@jwt_required()
def get_budget(budget_id: str):
    """Retrieve a single budget."""
    budget = db.session.get(Budget, _try_uuid(budget_id))
    if not budget:
        return api_error("Budget not found", 404)
    return api_response({"budget": budget.to_dict()})


@cost_bp.put("/budgets/<budget_id>")
@jwt_required()
def update_budget(budget_id: str):
    """Update a budget."""
    budget = db.session.get(Budget, _try_uuid(budget_id))
    if not budget:
        return api_error("Budget not found", 404)

    body = request.get_json(silent=True) or {}
    for field in ("name", "total_amount", "contingency_pct", "status", "notes"):
        if field in body:
            setattr(budget, field, body[field])
    db.session.commit()
    return api_response({"budget": budget.to_dict()}, "Budget updated")


@cost_bp.delete("/budgets/<budget_id>")
@jwt_required()
def delete_budget(budget_id: str):
    """Delete a budget."""
    budget = db.session.get(Budget, _try_uuid(budget_id))
    if not budget:
        return api_error("Budget not found", 404)
    db.session.delete(budget)
    db.session.commit()
    return api_response(None, "Budget deleted")


# ---------------------------------------------------------------------------
# Cost item endpoints
# ---------------------------------------------------------------------------


@cost_bp.get("/items")
@jwt_required()
def list_cost_items():
    """List cost items, optionally filtered by project or budget."""
    query = CostItem.query.order_by(CostItem.created_at.desc())
    if project_id := request.args.get("project_id"):
        query = query.filter(CostItem.project_id == project_id)
    if budget_id := request.args.get("budget_id"):
        query = query.filter(CostItem.budget_id == budget_id)
    if category := request.args.get("category"):
        query = query.filter(CostItem.category == category)
    return api_response(paginate(query))


@cost_bp.post("/items")
@jwt_required()
def create_cost_item():
    """Create a cost line item."""
    body = request.get_json(silent=True) or {}
    user_id = _uuid.UUID(get_jwt_identity())

    project_id = body.get("project_id")
    description = (body.get("description") or "").strip()
    if not project_id or not description:
        return api_error("project_id and description are required", 400)

    project = db.session.get(Project, _try_uuid(project_id))
    if not project:
        return api_error("Project not found", 404)

    item = CostItem(
        project_id=project_id,
        budget_id=body.get("budget_id"),
        cost_code=body.get("cost_code"),
        description=description,
        category=body.get("category"),
        budgeted_amount=body.get("budgeted_amount", 0.0),
        committed_amount=body.get("committed_amount", 0.0),
        actual_amount=body.get("actual_amount", 0.0),
        forecast_amount=body.get("forecast_amount", 0.0),
        notes=body.get("notes"),
        company_id=body.get("company_id"),
        created_by=user_id,
    )
    db.session.add(item)
    db.session.commit()
    return api_response({"cost_item": item.to_dict()}, "Cost item created", 201)


@cost_bp.get("/items/<item_id>")
@jwt_required()
def get_cost_item(item_id: str):
    """Retrieve a single cost item."""
    item = db.session.get(CostItem, _try_uuid(item_id))
    if not item:
        return api_error("Cost item not found", 404)
    return api_response({"cost_item": item.to_dict()})


@cost_bp.put("/items/<item_id>")
@jwt_required()
def update_cost_item(item_id: str):
    """Update a cost item."""
    item = db.session.get(CostItem, _try_uuid(item_id))
    if not item:
        return api_error("Cost item not found", 404)

    body = request.get_json(silent=True) or {}
    for field in (
        "cost_code", "description", "category",
        "budgeted_amount", "committed_amount", "actual_amount",
        "forecast_amount", "notes",
    ):
        if field in body:
            setattr(item, field, body[field])
    db.session.commit()
    return api_response({"cost_item": item.to_dict()}, "Cost item updated")


@cost_bp.delete("/items/<item_id>")
@jwt_required()
def delete_cost_item(item_id: str):
    """Delete a cost item."""
    item = db.session.get(CostItem, _try_uuid(item_id))
    if not item:
        return api_error("Cost item not found", 404)
    db.session.delete(item)
    db.session.commit()
    return api_response(None, "Cost item deleted")


# ---------------------------------------------------------------------------
# Summary endpoint
# ---------------------------------------------------------------------------


@cost_bp.get("/summary")
@jwt_required()
def cost_summary():
    """Return a cost summary grouped by category for a project."""
    project_id = request.args.get("project_id")
    if not project_id:
        return api_error("project_id query param is required", 400)

    rows = (
        db.session.query(
            CostItem.category,
            func.coalesce(func.sum(CostItem.budgeted_amount), 0),
            func.coalesce(func.sum(CostItem.actual_amount), 0),
            func.coalesce(func.sum(CostItem.forecast_amount), 0),
        )
        .filter(CostItem.project_id == project_id)
        .group_by(CostItem.category)
        .all()
    )

    categories = []
    for category, budgeted, actual, forecast in rows:
        categories.append(
            {
                "category": category or "uncategorized",
                "budgeted": float(budgeted),
                "actual": float(actual),
                "forecast": float(forecast),
                "variance": round(float(budgeted) - float(actual), 2),
            }
        )

    totals = (
        db.session.query(
            func.coalesce(func.sum(CostItem.budgeted_amount), 0),
            func.coalesce(func.sum(CostItem.actual_amount), 0),
            func.coalesce(func.sum(CostItem.forecast_amount), 0),
        )
        .filter(CostItem.project_id == project_id)
        .first()
    )

    return api_response(
        {
            "project_id": project_id,
            "categories": categories,
            "totals": {
                "budgeted": float(totals[0]),
                "actual": float(totals[1]),
                "forecast": float(totals[2]),
                "variance": round(float(totals[0]) - float(totals[1]), 2),
            },
        }
    )
