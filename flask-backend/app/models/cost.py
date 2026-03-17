"""Cost management models – budget and line-item tracking."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Uuid, DateTime, Float, ForeignKey, String, Text

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app import db


class Budget(db.Model):
    """High-level budget for a construction project."""

    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, default="Original Budget"
    )
    total_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    contingency_pct: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="draft"
    )  # draft | approved | locked
    notes: Mapped[str | None] = mapped_column(Text)
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
    project = relationship("Project", back_populates="budgets")
    cost_items = relationship(
        "CostItem", back_populates="budget", cascade="all, delete-orphan"
    )

    @property
    def contingency_amount(self) -> float:
        return round(self.total_amount * self.contingency_pct / 100, 2)

    @property
    def total_with_contingency(self) -> float:
        return round(self.total_amount + self.contingency_amount, 2)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "name": self.name,
            "total_amount": self.total_amount,
            "contingency_pct": self.contingency_pct,
            "contingency_amount": self.contingency_amount,
            "total_with_contingency": self.total_with_contingency,
            "status": self.status,
            "notes": self.notes,
            "company_id": self.company_id,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Budget {self.name} project={self.project_id}>"


class CostItem(db.Model):
    """A line item within a project's cost breakdown."""

    __tablename__ = "cost_items"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    budget_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("budgets.id", ondelete="SET NULL")
    )
    cost_code: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(
        String(100)
    )  # labor | material | equipment | subcontract | overhead | other
    budgeted_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    committed_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    actual_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    forecast_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
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
    project = relationship("Project", back_populates="cost_items")
    budget = relationship("Budget", back_populates="cost_items")

    @property
    def variance(self) -> float:
        return round(self.budgeted_amount - self.actual_amount, 2)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "budget_id": str(self.budget_id) if self.budget_id else None,
            "cost_code": self.cost_code,
            "description": self.description,
            "category": self.category,
            "budgeted_amount": self.budgeted_amount,
            "committed_amount": self.committed_amount,
            "actual_amount": self.actual_amount,
            "forecast_amount": self.forecast_amount,
            "variance": self.variance,
            "notes": self.notes,
            "company_id": self.company_id,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<CostItem {self.cost_code} – {self.description[:40]}>"
