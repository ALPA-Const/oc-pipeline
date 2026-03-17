"""Tests for pipeline stages and project cards."""


class TestPipelineStages:
    def test_list_stages_empty(self, client, auth_headers):
        resp = client.get("/api/pipeline/stages", headers=auth_headers)
        assert resp.status_code == 200
        assert "stages" in resp.get_json()["data"]

    def test_create_stage(self, client, auth_headers):
        resp = client.post(
            "/api/pipeline/stages",
            json={
                "name": "Lead Generation",
                "pipeline_type": "opportunity",
                "order": 1,
                "color": "#3B82F6",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        stage = resp.get_json()["data"]["stage"]
        assert stage["name"] == "Lead Generation"
        assert stage["pipeline_type"] == "opportunity"

    def test_create_stage_invalid_type(self, client, auth_headers):
        resp = client.post(
            "/api/pipeline/stages",
            json={"name": "Bad Stage", "pipeline_type": "invalid"},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_create_stage_missing_fields(self, client, auth_headers):
        resp = client.post(
            "/api/pipeline/stages", json={"name": "No Type"}, headers=auth_headers
        )
        assert resp.status_code == 400

    def test_update_stage(self, client, auth_headers):
        create_resp = client.post(
            "/api/pipeline/stages",
            json={"name": "Old Name", "pipeline_type": "preconstruction", "order": 0},
            headers=auth_headers,
        )
        stage_id = create_resp.get_json()["data"]["stage"]["id"]

        resp = client.put(
            f"/api/pipeline/stages/{stage_id}",
            json={"name": "New Name", "order": 2},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json()["data"]["stage"]["name"] == "New Name"

    def test_delete_empty_stage(self, client, auth_headers):
        create_resp = client.post(
            "/api/pipeline/stages",
            json={"name": "Empty Stage", "pipeline_type": "closeout", "order": 99},
            headers=auth_headers,
        )
        stage_id = create_resp.get_json()["data"]["stage"]["id"]

        resp = client.delete(f"/api/pipeline/stages/{stage_id}", headers=auth_headers)
        assert resp.status_code == 200


class TestPipelineProjects:
    def _create_stage(self, client, auth_headers, pipeline_type="opportunity"):
        resp = client.post(
            "/api/pipeline/stages",
            json={"name": "Test Stage", "pipeline_type": pipeline_type, "order": 0},
            headers=auth_headers,
        )
        return resp.get_json()["data"]["stage"]["id"]

    def test_create_pipeline_project(self, client, auth_headers):
        stage_id = self._create_stage(client, auth_headers)
        resp = client.post(
            "/api/pipeline/projects",
            json={
                "name": "Federal Courthouse Renovation",
                "stage_id": stage_id,
                "pipeline_type": "opportunity",
                "value": 28_000_000,
                "win_probability": 55.0,
                "priority": "high",
                "set_aside": "small_business",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        pp = resp.get_json()["data"]["pipeline_project"]
        assert pp["name"] == "Federal Courthouse Renovation"
        assert pp["value"] == 28_000_000

    def test_create_pipeline_project_missing_fields(self, client, auth_headers):
        resp = client.post(
            "/api/pipeline/projects",
            json={"name": "No Stage"},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_move_project_to_new_stage(self, client, auth_headers):
        stage1_id = self._create_stage(client, auth_headers)
        stage2_id = self._create_stage(client, auth_headers, "preconstruction")

        create_resp = client.post(
            "/api/pipeline/projects",
            json={
                "name": "Move Me",
                "stage_id": stage1_id,
                "pipeline_type": "opportunity",
                "value": 5_000_000,
            },
            headers=auth_headers,
        )
        pp_id = create_resp.get_json()["data"]["pipeline_project"]["id"]

        resp = client.put(
            f"/api/pipeline/projects/{pp_id}",
            json={"stage_id": stage2_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert str(resp.get_json()["data"]["pipeline_project"]["stage_id"]) == stage2_id

    def test_mark_project_stalled(self, client, auth_headers):
        stage_id = self._create_stage(client, auth_headers)
        create_resp = client.post(
            "/api/pipeline/projects",
            json={
                "name": "Stalled Project",
                "stage_id": stage_id,
                "pipeline_type": "opportunity",
            },
            headers=auth_headers,
        )
        pp_id = create_resp.get_json()["data"]["pipeline_project"]["id"]

        resp = client.put(
            f"/api/pipeline/projects/{pp_id}",
            json={"is_stalled": True, "stalled_reason": "Awaiting funding approval"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        pp = resp.get_json()["data"]["pipeline_project"]
        assert pp["is_stalled"] is True
        assert pp["stalled_reason"] == "Awaiting funding approval"

    def test_pipeline_metrics(self, client, auth_headers):
        resp = client.get(
            "/api/pipeline/metrics?pipeline_type=opportunity", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert "project_count" in data
        assert "total_value" in data
        assert "weighted_value" in data
