"""Shared pytest fixtures for the Flask backend test suite."""

import pytest

from app import create_app
from app import db as _db
from app.models.user import User


@pytest.fixture(scope="session")
def app():
    """Create a test Flask application using the 'testing' config (SQLite in-memory)."""
    application = create_app("testing")
    with application.app_context():
        _db.create_all()
        yield application
        _db.drop_all()


@pytest.fixture()
def client(app):
    """Return a test client for the application."""
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_db(app):
    """Wipe all table rows before every test to ensure isolation."""
    with app.app_context():
        yield
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture()
def db(app):
    """Provide the database bound to the current app context."""
    with app.app_context():
        yield _db


@pytest.fixture()
def test_user(client):
    """Create and return a test user via the registration endpoint."""
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "role": "admin",
        },
    )
    assert resp.status_code == 201, resp.get_data(as_text=True)
    return resp.get_json()["data"]["user"]


@pytest.fixture()
def auth_headers(client, test_user):
    """Return Authorization headers with a valid JWT access token."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    token = resp.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
