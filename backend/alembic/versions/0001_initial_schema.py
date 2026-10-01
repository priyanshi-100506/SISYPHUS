"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('email')
    )

    # 2. model_pricing
    op.create_table(
        'model_pricing',
        sa.Column('model', sa.Text(), primary_key=True),
        sa.Column('input_per_mtok', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('output_per_mtok', sa.Numeric(precision=10, scale=4), nullable=False)
    )

    # Seed model pricing initial rows
    op.execute("""
        INSERT INTO model_pricing (model, input_per_mtok, output_per_mtok) VALUES
        ('claude-sonnet-4-6', 3.0000, 15.0000),
        ('claude-haiku-3-5', 0.8000, 4.0000),
        ('gpt-4o', 2.5000, 10.0000),
        ('gpt-4o-mini', 0.1500, 0.6000)
    """)

    # 3. projects
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('slug', sa.Text(), nullable=False),
        sa.Column('language', sa.Text(), nullable=True),
        sa.Column('api_key_hash', sa.Text(), nullable=False),
        sa.Column('key_prefix', sa.Text(), nullable=False),
        sa.Column('is_demo', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id', 'slug', name='uq_projects_user_slug')
    )

    # 4. runs
    op.create_table(
        'runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('input', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_steps', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('total_tokens_in', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('total_tokens_out', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('estimated_cost', sa.Numeric(precision=10, scale=6), server_default=sa.text('0'), nullable=False),
        sa.Column('analyzed_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index('runs_project_started', 'runs', ['project_id', sa.text('started_at DESC')])

    # 5. events
    op.create_table(
        'events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.Text(), nullable=False),
        sa.Column('tool_name', sa.Text(), nullable=True),
        sa.Column('model', sa.Text(), nullable=True),
        sa.Column('input_hash', sa.Text(), nullable=True),
        sa.Column('output_hash', sa.Text(), nullable=True),
        sa.Column('state_hash', sa.Text(), nullable=True),
        sa.Column('input_preview', sa.Text(), nullable=True),
        sa.Column('output_preview', sa.Text(), nullable=True),
        sa.Column('status', sa.Text(), server_default=sa.text("'ok'"), nullable=False),
        sa.Column('error_code', sa.Text(), nullable=True),
        sa.Column('tokens_in', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('tokens_out', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('run_id', 'sequence_number', name='uq_events_run_sequence')
    )

    # 6. findings
    op.create_table(
        'findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.Text(), nullable=False),
        sa.Column('severity', sa.Text(), nullable=False),
        sa.Column('step_start', sa.Integer(), nullable=False),
        sa.Column('step_end', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('evidence', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('waste_tokens', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('waste_ms', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('waste_cost', sa.Numeric(precision=10, scale=6), server_default=sa.text('0'), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('findings_run', 'findings', ['run_id'])

def downgrade() -> None:
    op.drop_index('findings_run', table_name='findings')
    op.drop_table('findings')
    op.drop_table('events')
    op.drop_index('runs_project_started', table_name='runs')
    op.drop_table('runs')
    op.drop_table('projects')
    op.drop_table('model_pricing')
    op.drop_table('users')
