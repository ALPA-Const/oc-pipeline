"""Standardised JSON response helpers."""

from flask import jsonify
from typing import Any


def api_response(data: Any = None, message: str = "ok", status: int = 200):
    """Return a consistent success envelope."""
    payload: dict = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def api_error(message: str, status: int = 400, errors: Any = None):
    """Return a consistent error envelope."""
    payload: dict = {"success": False, "error": message}
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status
