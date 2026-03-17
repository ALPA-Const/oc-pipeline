"""Submittal tracking model for construction document workflow."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Uuid, DateTime, ForeignKey, Integer, String, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Submittal(db.Model):
    """Tracks construction submittals (shop drawings, material samples, etc.)."""

    __tablename__ = "submittals"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    submittal_number: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Workflow status
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )  # pending | submitted | under_review | approved | rejected | resubmit_required
    submittal_type: Mapped[str | None] = mapped_column(
        String(100)
    )  # shop_drawing | material_sample | product_data | mix_design | other

    # Spec reference
    spec_section: Mapped[str | None] = mapped_column(String(50))
    spec_section_title: Mapped[str | None] = mapped_column(String(255))

    # Dates
    required_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Priority (1=highest)
    priority: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Reviewer
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )
    review_notes: Mapped[str | None] = mapped_column(Text)

    # Metadata
    revision: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
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
    project = relationship("Project", back_populates="submittals")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "submittal_number": self.submittal_number,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "submittal_type": self.submittal_type,
            "spec_section": self.spec_section,
            "spec_section_title": self.spec_section_title,
            "required_date": (
                self.required_date.isoformat() if self.required_date else None
            ),
            "submitted_date": (
                self.submitted_date.isoformat() if self.submitted_date else None
            ),
            "review_deadline": (
                self.review_deadline.isoformat() if self.review_deadline else None
            ),
            "approved_date": (
                self.approved_date.isoformat() if self.approved_date else None
            ),
            "priority": self.priority,
            "reviewer_id": str(self.reviewer_id) if self.reviewer_id else None,
            "review_notes": self.review_notes,
            "revision": self.revision,
            "company_id": self.company_id,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Submittal {self.submittal_number} – {self.title[:40]}>"
