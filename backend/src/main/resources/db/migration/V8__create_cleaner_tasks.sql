CREATE TABLE cleaner_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    assigned_user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    checklist_json JSONB,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cleaner_tasks_org ON cleaner_tasks(organization_id);
CREATE INDEX idx_cleaner_tasks_assignee ON cleaner_tasks(assigned_user_id, status);
CREATE INDEX idx_cleaner_tasks_scheduled ON cleaner_tasks(scheduled_at) WHERE status = 'PENDING';
