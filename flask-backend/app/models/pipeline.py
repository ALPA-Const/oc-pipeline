"""Pipeline stage and project models for Kanban-style tracking."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class PipelineStage(db.Model):
    """A stage within a construction pipeline (e.g. 'Lead', 'Proposal', 'Award')."""

    __tablename__ = "pipeline_stages"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    pipeline_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # opportunity | preconstruction | execution | closeout
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(20))
    wip_limit: Mapped[int | None] = mapped_column(Integer)
    company_id: Mapped[str | None] = mapped_column(String(100))

    # ORM relationships
    pipeline_projects = relationship("PipelineProject", back_populates="stage")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "pipeline_type": self.pipeline_type,
            "order": self.order,
            "description": self.description,
            "color": self.color,
            "wip_limit": self.wip_limit,
            "company_id": self.company_id,
        }

    def __repr__(self) -> str:
        return f"<PipelineStage {self.pipeline_type}/{self.name}>"


class PipelineProject(db.Model):
    """Tracks a project's position and metadata within a pipeline stage."""

    __tablename__ = "pipeline_projects"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL")
    )
    stage_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("pipeline_stages.id"), nullable=False
    )
    pipeline_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Project snapshot data (denormalised for performance)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[float | None] = mapped_column(Float)
    win_probability: Mapped[float | None] = mapped_column(Float)
    agency: Mapped[str | None] = mapped_column(String(255))
    set_aside: Mapped[str | None] = mapped_column(String(100))
    pm: Mapped[str | None] = mapped_column(String(255))
    priority: Mapped[str | None] = mapped_column(
        String(50)
    )  # low | medium | high | critical

    # Stage health
    is_stalled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stalled_reason: Mapped[str | None] = mapped_column(Text)
    stalled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    entered_stage_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    days_in_stage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Metadata
    tags: Mapped[str | None] = mapped_column(String(500))
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
    stage = relationship("PipelineStage", back_populates="pipeline_projects")
    project = relationship("Project")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "project_id": str(self.project_id) if self.project_id else None,
            "stage_id": str(self.stage_id),
            "pipeline_type": self.pipeline_type,
            "name": self.name,
            "value": self.value,
            "win_probability": self.win_probability,
            "agency": self.agency,
            "set_aside": self.set_aside,
            "pm": self.pm,
            "priority": self.priority,
            "is_stalled": self.is_stalled,
            "stalled_reason": self.stalled_reason,
            "stalled_at": self.stalled_at.isoformat() if self.stalled_at else None,
            "entered_stage_at": self.entered_stage_at.isoformat(),
            "days_in_stage": self.days_in_stage,
            "tags": self.tags,
            "company_id": self.company_id,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<PipelineProject {self.name} stage={self.stage_id}>"
