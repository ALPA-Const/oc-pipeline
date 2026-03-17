"""Route blueprints for the Construction ERP API."""

from .auth import auth_bp
from .projects import projects_bp
from .pipeline import pipeline_bp
from .dashboard import dashboard_bp
from .tasks import tasks_bp
from .submittals import submittals_bp
from .cost import cost_bp
from .reports import reports_bp

__all__ = [
    "auth_bp",
    "projects_bp",
    "pipeline_bp",
    "dashboard_bp",
    "tasks_bp",
    "submittals_bp",
    "cost_bp",
    "reports_bp",
]
