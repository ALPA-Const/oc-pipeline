"""Tests for authentication endpoints."""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepass1",
                "full_name": "New User",
            },
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert data["data"]["user"]["email"] == "newuser@example.com"

    def test_register_missing_fields(self, client):
        resp = client.post("/api/auth/register", json={"email": "a@b.com"})
        assert resp.status_code == 400
        assert resp.get_json()["success"] is False

    def test_register_duplicate_email(self, client, test_user):
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Dupe",
            },
        )
        assert resp.status_code == 409

    def test_register_short_password(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "x@y.com", "password": "short", "full_name": "X"},
        )
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client, test_user):
        resp = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]

    def test_login_wrong_password(self, client, test_user):
        resp = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_login_unknown_user(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "whatever"},
        )
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post("/api/auth/login", json={})
        assert resp.status_code == 400


class TestMe:
    def test_get_me_authenticated(self, client, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["data"]["user"]["email"] == "test@example.com"

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_update_name(self, client, auth_headers):
        resp = client.put(
            "/api/auth/me",
            json={"full_name": "Updated Name"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json()["data"]["user"]["full_name"] == "Updated Name"
