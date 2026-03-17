"""Flask application factory for the Construction ERP backend."""

import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Load configuration
    from .config import config_by_name

    cfg_name = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_by_name[cfg_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS
    allowed_origins = app.config.get("ALLOWED_ORIGINS", ["http://localhost:5173"])
    CORS(
        app,
        origins=allowed_origins,
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.projects import projects_bp
    from .routes.pipeline import pipeline_bp
    from .routes.dashboard import dashboard_bp
    from .routes.tasks import tasks_bp
    from .routes.submittals import submittals_bp
    from .routes.cost import cost_bp
    from .routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(pipeline_bp, url_prefix="/api/pipeline")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(submittals_bp, url_prefix="/api/submittals")
    app.register_blueprint(cost_bp, url_prefix="/api/cost")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    # Health check
    @app.get("/health")
    @app.get("/api/health")
    def health_check():
        from datetime import datetime, timezone
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment": cfg_name,
        }

    # Global error handlers
    from .utils.errors import register_error_handlers

    register_error_handlers(app)

    return app
