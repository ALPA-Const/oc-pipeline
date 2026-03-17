"""Utility helpers for working with JWT identities."""

import uuid

from flask_jwt_extended import get_jwt_identity


def current_user_id() -> uuid.UUID:
    """Return the current JWT identity as a ``uuid.UUID`` object."""
    return uuid.UUID(get_jwt_identity())
