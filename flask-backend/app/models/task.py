"""Task / action-item model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Uuid, DateTime, ForeignKey, String, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Task(db.Model):
    """An action item or task associated with a project."""

    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="open"
    )  # open | in_progress | resolved | closed
    priority: Mapped[str] = mapped_column(
        String(50), nullable=False, default="medium"
    )  # low | medium | high | critical
    category: Mapped[str | None] = mapped_column(
        String(100)
    )  # rfi | submittal | safety | quality | general
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    company_id: Mapped[str | None] = mapped_column(String(100))
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ORM relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "category": self.category,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "company_id": self.company_id,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Task {self.title[:40]}>"
