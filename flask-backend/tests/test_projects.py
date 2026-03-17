"""Tests for project CRUD endpoints."""


class TestProjects:
    def test_list_projects_unauthenticated(self, client):
        resp = client.get("/api/projects")
        assert resp.status_code == 401

    def test_list_projects_empty(self, client, auth_headers):
        resp = client.get("/api/projects", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert "items" in data["data"]

    def test_create_project_success(self, client, auth_headers):
        resp = client.post(
            "/api/projects",
            json={
                "name": "VA Medical Center Expansion",
                "phase": "preconstruction",
                "project_type": "healthcare",
                "estimated_value": 45_000_000,
                "state": "TX",
                "agency": "Department of Veterans Affairs",
                "win_probability": 65.0,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        project = resp.get_json()["data"]["project"]
        assert project["name"] == "VA Medical Center Expansion"
        assert project["phase"] == "preconstruction"

    def test_create_project_missing_name(self, client, auth_headers):
        resp = client.post(
            "/api/projects", json={"phase": "opportunity"}, headers=auth_headers
        )
        assert resp.status_code == 400

    def test_create_project_invalid_phase(self, client, auth_headers):
        resp = client.post(
            "/api/projects",
            json={"name": "Test", "phase": "invalid_phase"},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_get_project(self, client, auth_headers):
        # Create first
        create_resp = client.post(
            "/api/projects",
            json={"name": "Get Test Project", "phase": "opportunity"},
            headers=auth_headers,
        )
        project_id = create_resp.get_json()["data"]["project"]["id"]

        resp = client.get(f"/api/projects/{project_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["data"]["project"]["id"] == project_id

    def test_get_project_not_found(self, client, auth_headers):
        resp = client.get(
            "/api/projects/00000000-0000-0000-0000-000000000000", headers=auth_headers
        )
        assert resp.status_code == 404

    def test_update_project(self, client, auth_headers):
        create_resp = client.post(
            "/api/projects",
            json={"name": "Update Test", "phase": "opportunity"},
            headers=auth_headers,
        )
        project_id = create_resp.get_json()["data"]["project"]["id"]

        resp = client.put(
            f"/api/projects/{project_id}",
            json={"name": "Updated Name", "status": "on_hold"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        updated = resp.get_json()["data"]["project"]
        assert updated["name"] == "Updated Name"
        assert updated["status"] == "on_hold"

    def test_delete_project_soft(self, client, auth_headers):
        create_resp = client.post(
            "/api/projects",
            json={"name": "Delete Test", "phase": "opportunity"},
            headers=auth_headers,
        )
        project_id = create_resp.get_json()["data"]["project"]["id"]

        resp = client.delete(f"/api/projects/{project_id}", headers=auth_headers)
        assert resp.status_code == 200

        # Should still exist with cancelled status
        get_resp = client.get(f"/api/projects/{project_id}", headers=auth_headers)
        assert get_resp.get_json()["data"]["project"]["status"] == "cancelled"

    def test_project_summary(self, client, auth_headers):
        create_resp = client.post(
            "/api/projects",
            json={"name": "Summary Test", "phase": "execution"},
            headers=auth_headers,
        )
        project_id = create_resp.get_json()["data"]["project"]["id"]

        resp = client.get(f"/api/projects/{project_id}/summary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()["data"]["project"]
        assert "task_count" in data
        assert "submittal_count" in data
        assert "total_budgeted" in data

    def test_filter_projects_by_phase(self, client, auth_headers):
        client.post(
            "/api/projects",
            json={"name": "Phase Filter Test", "phase": "closeout"},
            headers=auth_headers,
        )
        resp = client.get("/api/projects?phase=closeout", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.get_json()["data"]["items"]
        assert all(p["phase"] == "closeout" for p in items)
