"""Configuration classes for the Flask application."""

import os
from datetime import timedelta


class BaseConfig:
    """Base configuration shared across all environments."""

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "jwt-change-me-in-production")
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(days=30)

    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = False

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/construction_erp",
    )

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:  # noqa: N802
        url = self.DATABASE_URL
        # SQLAlchemy 2.x requires 'postgresql://' not 'postgres://'
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ocpipeline.vercel.app",
    ]

    if extra := os.getenv("ALLOWED_ORIGINS"):
        ALLOWED_ORIGINS += [o.strip() for o in extra.split(",") if o.strip()]

    PAGINATION_DEFAULT_PAGE: int = 1
    PAGINATION_DEFAULT_PER_PAGE: int = 20
    PAGINATION_MAX_PER_PAGE: int = 100


class DevelopmentConfig(BaseConfig):
    """Development-specific configuration."""

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = bool(os.getenv("SQL_ECHO", ""))


class TestingConfig(BaseConfig):
    """Testing configuration using an in-memory SQLite database."""

    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(minutes=5)
    ALLOWED_ORIGINS: list[str] = ["*"]


class ProductionConfig(BaseConfig):
    """Production configuration."""

    DEBUG: bool = False
    SQLALCHEMY_ECHO: bool = False

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:  # noqa: N802
        url = os.environ["DATABASE_URL"]
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


config_by_name: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    # Aliases
    "dev": DevelopmentConfig,
    "test": TestingConfig,
    "prod": ProductionConfig,
}
