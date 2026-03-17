"""Project model – core entity for the Construction ERP."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Project(db.Model):
    """A construction project tracked through its lifecycle."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active"
    )  # active | completed | on_hold | cancelled
    phase: Mapped[str] = mapped_column(
        String(50), nullable=False, default="opportunity"
    )  # opportunity | preconstruction | execution | closeout

    # Location
    address: Mapped[str | None] = mapped_column(String(500))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(50))
    zip_code: Mapped[str | None] = mapped_column(String(20))

    # Financials
    contract_value: Mapped[float | None] = mapped_column(Float)
    estimated_value: Mapped[float | None] = mapped_column(Float)
    actual_cost: Mapped[float | None] = mapped_column(Float)

    # Classification
    project_type: Mapped[str | None] = mapped_column(
        String(50)
    )  # healthcare | government | commercial | residential
    set_aside: Mapped[str | None] = mapped_column(
        String(100)
    )  # small_business | 8a | hubzone | sdvosb | wosb | none
    magnitude: Mapped[str | None] = mapped_column(
        String(50)
    )  # small | medium | large | mega

    # Government contracting
    contract_number: Mapped[str | None] = mapped_column(String(100))
    agency: Mapped[str | None] = mapped_column(String(255))

    # Relationships
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )
    pm_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )

    # Dates
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bid_due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    award_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Win probability (0-100)
    win_probability: Mapped[float | None] = mapped_column(Float)

    # Metadata
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
    owner = relationship("User", foreign_keys=[owner_id])
    pm = relationship("User", foreign_keys=[pm_id])
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    submittals = relationship(
        "Submittal", back_populates="project", cascade="all, delete-orphan"
    )
    budgets = relationship(
        "Budget", back_populates="project", cascade="all, delete-orphan"
    )
    cost_items = relationship(
        "CostItem", back_populates="project", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "phase": self.phase,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "contract_value": self.contract_value,
            "estimated_value": self.estimated_value,
            "actual_cost": self.actual_cost,
            "project_type": self.project_type,
            "set_aside": self.set_aside,
            "magnitude": self.magnitude,
            "contract_number": self.contract_number,
            "agency": self.agency,
            "owner_id": str(self.owner_id) if self.owner_id else None,
            "pm_id": str(self.pm_id) if self.pm_id else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "bid_due_date": (
                self.bid_due_date.isoformat() if self.bid_due_date else None
            ),
            "award_date": self.award_date.isoformat() if self.award_date else None,
            "win_probability": self.win_probability,
            "company_id": self.company_id,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Project {self.name}>"
