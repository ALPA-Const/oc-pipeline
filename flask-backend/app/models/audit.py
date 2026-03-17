"""Immutable audit log for tracking all data mutations."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Uuid, DateTime, ForeignKey, String, Text

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class AuditLog(db.Model):
    """Append-only record of every create / update / delete operation."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # INSERT | UPDATE | DELETE
    old_values: Mapped[str | None] = mapped_column(Text)  # JSON string
    new_values: Mapped[str | None] = mapped_column(Text)  # JSON string
    changed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )
    ip_address: Mapped[str | None] = mapped_column(String(50))
    user_agent: Mapped[str | None] = mapped_column(String(500))
    company_id: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "table_name": self.table_name,
            "record_id": self.record_id,
            "action": self.action,
            "old_values": self.old_values,
            "new_values": self.new_values,
            "changed_by": str(self.changed_by) if self.changed_by else None,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} {self.table_name}:{self.record_id}>"
