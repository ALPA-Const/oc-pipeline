"""Global Flask error handlers."""

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app: Flask) -> None:
    """Attach standardised error handlers to *app*."""

    @app.errorhandler(400)
    def bad_request(exc):
        return jsonify({"success": False, "error": str(exc)}), 400

    @app.errorhandler(401)
    def unauthorized(exc):
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(exc):
        return jsonify({"success": False, "error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(exc):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    @app.errorhandler(409)
    def conflict(exc):
        return jsonify({"success": False, "error": str(exc)}), 409

    @app.errorhandler(422)
    def unprocessable(exc):
        return jsonify({"success": False, "error": str(exc)}), 422

    @app.errorhandler(500)
    def server_error(exc):
        app.logger.exception("Unhandled server error")
        return jsonify({"success": False, "error": "Internal server error"}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        return (
            jsonify({"success": False, "error": exc.description}),
            exc.code or 500,
        )

    @app.errorhandler(Exception)
    def handle_exception(exc: Exception):
        app.logger.exception("Unhandled exception: %s", exc)
        return jsonify({"success": False, "error": "Internal server error"}), 500
