"""Pagination helper for SQLAlchemy queries."""

from flask import request
from sqlalchemy.orm import Query


def paginate(query: Query, schema=None) -> dict:
    """
    Execute *query* with page/per_page parameters taken from the request's
    query string and return a pagination envelope.

    Args:
        query: A SQLAlchemy ``Query`` object (not yet executed).
        schema: Optional Marshmallow schema instance used to serialise items.
                If ``None``, each item's ``.to_dict()`` method is called.

    Returns:
        A dict suitable for passing directly to ``api_response()``.
    """
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1

    try:
        per_page = max(1, min(100, int(request.args.get("per_page", 20))))
    except (TypeError, ValueError):
        per_page = 20

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    if schema is not None:
        items = schema.dump(paginated.items)
    else:
        items = [item.to_dict() for item in paginated.items]

    return {
        "items": items,
        "pagination": {
            "page": paginated.page,
            "per_page": paginated.per_page,
            "total": paginated.total,
            "pages": paginated.pages,
            "has_next": paginated.has_next,
            "has_prev": paginated.has_prev,
        },
    }
