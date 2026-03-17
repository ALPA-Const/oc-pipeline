"""Tests for the dashboard and reports endpoints."""

import pytest


class TestDashboard:
    def test_overview_unauthenticated(self, client):
        resp = client.get("/api/dashboard")
        assert resp.status_code == 401

    def test_overview_returns_kpis(self, client, auth_headers):
        resp = client.get("/api/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert "projects" in data
        assert "pipeline" in data
        assert "tasks" in data
        assert "submittals" in data
        assert "cost" in data

    def test_pipeline_velocity(self, client, auth_headers):
        resp = client.get("/api/dashboard/pipeline-velocity", headers=auth_headers)
        assert resp.status_code == 200
        assert "velocity" in resp.get_json()["data"]


class TestReports:
    def test_pipeline_summary(self, client, auth_headers):
        resp = client.get("/api/reports/pipeline-summary", headers=auth_headers)
        assert resp.status_code == 200
        assert "summary" in resp.get_json()["data"]

    def test_project_distribution(self, client, auth_headers):
        resp = client.get("/api/reports/project-distribution", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert "by_state" in data
        assert "by_type" in data
        assert "by_set_aside" in data

    def test_win_rate(self, client, auth_headers):
        resp = client.get("/api/reports/win-rate", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert "avg_win_probability" in data
        assert "weighted_value" in data

    def test_task_summary_missing_project(self, client, auth_headers):
        resp = client.get(
            "/api/reports/task-summary?project_id=00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"
