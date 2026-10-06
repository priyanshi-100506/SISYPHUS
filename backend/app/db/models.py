import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, Numeric, DateTime, ForeignKey, Index, UniqueConstraint, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    language = Column(String, nullable=True)
    api_key_hash = Column(String, nullable=False)
    key_prefix = Column(String, nullable=False)
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "slug", name="uq_projects_user_slug"),
    )

    user = relationship("User", back_populates="projects")
    runs = relationship("Run", back_populates="project", cascade="all, delete-orphan")


class Run(Base):
    __tablename__ = "runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    status = Column(String, nullable=False, default="running")  # running | completed | failed | terminated | timeout
    input = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    total_steps = Column(Integer, nullable=False, default=0)
    total_tokens_in = Column(Integer, nullable=False, default=0)
    total_tokens_out = Column(Integer, nullable=False, default=0)
    estimated_cost = Column(Numeric(10, 6), nullable=False, default=0)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("runs_project_started", "project_id", started_at.desc()),
    )

    project = relationship("Project", back_populates="runs")
    events = relationship("Event", back_populates="run", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="run", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    parent_id = Column(UUID(as_uuid=True), nullable=True)
    event_type = Column(String, nullable=False)  # think | tool | error | end
    tool_name = Column(String, nullable=True)
    model = Column(String, nullable=True)
    input_hash = Column(String, nullable=True)
    output_hash = Column(String, nullable=True)
    state_hash = Column(String, nullable=True)
    input_preview = Column(String, nullable=True)
    output_preview = Column(String, nullable=True)
    status = Column(String, nullable=False, default="ok")  # ok | error
    error_code = Column(String, nullable=True)
    tokens_in = Column(Integer, nullable=False, default=0)
    tokens_out = Column(Integer, nullable=False, default=0)
    latency_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("run_id", "sequence_number", name="uq_events_run_sequence"),
    )

    run = relationship("Run", back_populates="events")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # REPEATED_TOOL | STATE_LOOP | etc.
    severity = Column(String, nullable=False)  # low | medium | high
    step_start = Column(Integer, nullable=False)
    step_end = Column(Integer, nullable=False)
    description = Column(String, nullable=False)
    evidence = Column(JSON, nullable=False)
    waste_tokens = Column(Integer, nullable=False, default=0)
    waste_ms = Column(Integer, nullable=False, default=0)
    waste_cost = Column(Numeric(10, 6), nullable=False, default=0)
    explanation = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        Index("findings_run", "run_id"),
    )

    run = relationship("Run", back_populates="findings")


class ModelPricing(Base):
    __tablename__ = "model_pricing"

    model = Column(String, primary_key=True)
    input_per_mtok = Column(Numeric(10, 4), nullable=False)
    output_per_mtok = Column(Numeric(10, 4), nullable=False)
