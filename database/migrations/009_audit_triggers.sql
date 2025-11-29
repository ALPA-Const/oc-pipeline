-- ============================================================
-- OC PIPELINE - PHASE 0 FOUNDATION
-- Migration 009: Audit Triggers for All Tables
-- ============================================================

-- ============================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_org_id UUID;
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Get user ID from JWT or session
    BEGIN
        audit_user_id := auth.uid();
    EXCEPTION
        WHEN OTHERS THEN
            audit_user_id := NULL;
    END;

    -- Get org_id from the record or JWT
    BEGIN
        IF TG_OP = 'DELETE' THEN
            audit_org_id := COALESCE(OLD.org_id, auth.org_id());
        ELSE
            audit_org_id := COALESCE(NEW.org_id, auth.org_id());
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            audit_org_id := NULL;
    END;

    -- Prepare data
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSE -- INSERT
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Remove sensitive fields
    old_data := old_data - 'password_hash' - 'mfa_secret' - 'refresh_token_hash';
    new_data := new_data - 'password_hash' - 'mfa_secret' - 'refresh_token_hash';

    -- Insert audit log
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        user_id,
        org_id,
        old_values,
        new_values
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        audit_user_id,
        audit_org_id,
        old_data,
        new_data
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CREATE AUDIT TRIGGERS FOR ALL TABLES
-- ============================================================

-- Foundation Tables
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_projects
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_project_members
    AFTER INSERT OR UPDATE OR DELETE ON project_members
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Preconstruction
CREATE TRIGGER audit_pursuits
    AFTER INSERT OR UPDATE OR DELETE ON pursuits
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_estimates
    AFTER INSERT OR UPDATE OR DELETE ON estimates
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_bid_packages
    AFTER INSERT OR UPDATE OR DELETE ON bid_packages
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Cost
CREATE TRIGGER audit_budgets
    AFTER INSERT OR UPDATE OR DELETE ON budgets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_change_orders
    AFTER INSERT OR UPDATE OR DELETE ON change_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_commitments
    AFTER INSERT OR UPDATE OR DELETE ON commitments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Schedule
CREATE TRIGGER audit_schedules
    AFTER INSERT OR UPDATE OR DELETE ON schedules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_milestones
    AFTER INSERT OR UPDATE OR DELETE ON milestones
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Risk
CREATE TRIGGER audit_risks
    AFTER INSERT OR UPDATE OR DELETE ON risks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_risk_responses
    AFTER INSERT OR UPDATE OR DELETE ON risk_responses
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Quality
CREATE TRIGGER audit_deficiencies
    AFTER INSERT OR UPDATE OR DELETE ON deficiencies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_inspections
    AFTER INSERT OR UPDATE OR DELETE ON inspections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_punch_lists
    AFTER INSERT OR UPDATE OR DELETE ON punch_lists
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_ncrs
    AFTER INSERT OR UPDATE OR DELETE ON ncrs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Safety
CREATE TRIGGER audit_incidents
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_incident_investigations
    AFTER INSERT OR UPDATE OR DELETE ON incident_investigations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Procurement
CREATE TRIGGER audit_vendors
    AFTER INSERT OR UPDATE OR DELETE ON vendors
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contracts
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_subcontracts
    AFTER INSERT OR UPDATE OR DELETE ON subcontracts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_purchase_orders
    AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Communications
CREATE TRIGGER audit_rfis
    AFTER INSERT OR UPDATE OR DELETE ON rfis
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_submittals
    AFTER INSERT OR UPDATE OR DELETE ON submittals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_daily_reports
    AFTER INSERT OR UPDATE OR DELETE ON daily_reports
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Staffing
CREATE TRIGGER audit_resources
    AFTER INSERT OR UPDATE OR DELETE ON resources
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_timesheets
    AFTER INSERT OR UPDATE OR DELETE ON timesheets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Closeout
CREATE TRIGGER audit_warranties
    AFTER INSERT OR UPDATE OR DELETE ON warranties
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_warranty_claims
    AFTER INSERT OR UPDATE OR DELETE ON warranty_claims
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Tasks
CREATE TRIGGER audit_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_workflows
    AFTER INSERT OR UPDATE OR DELETE ON workflows
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ATLAS
CREATE TRIGGER audit_agents
    AFTER INSERT OR UPDATE OR DELETE ON agents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_agent_tasks
    AFTER INSERT OR UPDATE OR DELETE ON agent_tasks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================
-- SYSTEM EVENT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION emit_system_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_events (
        event_type,
        event_source,
        payload,
        org_id,
        entity_type,
        entity_id
    ) VALUES (
        TG_TABLE_NAME || '.' || LOWER(TG_OP),
        'database',
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'id', COALESCE(NEW.id, OLD.id),
            'timestamp', NOW()
        ),
        COALESCE(NEW.org_id, OLD.org_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CREATE SYSTEM EVENT TRIGGERS FOR KEY TABLES
-- ============================================================

-- Projects
CREATE TRIGGER emit_project_event
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Pursuits (Pipeline changes)
CREATE TRIGGER emit_pursuit_event
    AFTER INSERT OR UPDATE OR DELETE ON pursuits
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Budgets
CREATE TRIGGER emit_budget_event
    AFTER INSERT OR UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Change Orders
CREATE TRIGGER emit_change_order_event
    AFTER INSERT OR UPDATE ON change_orders
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Risks
CREATE TRIGGER emit_risk_event
    AFTER INSERT OR UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Incidents
CREATE TRIGGER emit_incident_event
    AFTER INSERT OR UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- RFIs
CREATE TRIGGER emit_rfi_event
    AFTER INSERT OR UPDATE ON rfis
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Submittals
CREATE TRIGGER emit_submittal_event
    AFTER INSERT OR UPDATE ON submittals
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Tasks
CREATE TRIGGER emit_task_event
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- Milestones
CREATE TRIGGER emit_milestone_event
    AFTER INSERT OR UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION emit_system_event();

-- ============================================================
-- PIPELINE STAGE CHANGE TRACKING
-- ============================================================

CREATE OR REPLACE FUNCTION track_pipeline_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO pipeline_history (
            org_id,
            pursuit_id,
            from_stage_id,
            to_stage_id,
            changed_by
        ) VALUES (
            NEW.org_id,
            NEW.id,
            OLD.stage_id,
            NEW.stage_id,
            auth.uid()
        );

        -- Update stage_entered_at
        NEW.stage_entered_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER track_pursuit_stage_change
    BEFORE UPDATE ON pursuits
    FOR EACH ROW EXECUTE FUNCTION track_pipeline_stage_change();

-- ============================================================
-- BUDGET RECALCULATION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE budgets
    SET
        revised_budget = original_budget + approved_changes,
        variance = revised_budget - forecast,
        contingency_remaining = contingency_original - contingency_used,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalc_budget_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON budget_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_budget_totals();

-- ============================================================
-- PUNCH LIST ITEM COUNT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_punch_list_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE punch_lists
    SET
        total_items = (SELECT COUNT(*) FROM punch_items WHERE punch_list_id = COALESCE(NEW.punch_list_id, OLD.punch_list_id)),
        completed_items = (SELECT COUNT(*) FROM punch_items WHERE punch_list_id = COALESCE(NEW.punch_list_id, OLD.punch_list_id) AND status = 'completed'),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.punch_list_id, OLD.punch_list_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_punch_counts
    AFTER INSERT OR UPDATE OR DELETE ON punch_items
    FOR EACH ROW EXECUTE FUNCTION update_punch_list_counts();

-- ============================================================
-- NOTIFICATION TRIGGER FOR ASSIGNMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Task assignment
    IF TG_TABLE_NAME = 'tasks' AND NEW.assigned_to IS NOT NULL AND
       (OLD IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
        INSERT INTO notifications (org_id, user_id, type, title, message, data, action_url)
        VALUES (
            NEW.org_id,
            NEW.assigned_to,
            'task_assigned',
            'New Task Assigned',
            'You have been assigned a new task: ' || NEW.title,
            jsonb_build_object('task_id', NEW.id),
            '/tasks/' || NEW.id
        );
    END IF;

    -- RFI assignment
    IF TG_TABLE_NAME = 'rfis' AND NEW.assigned_to IS NOT NULL AND
       (OLD IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
        INSERT INTO notifications (org_id, user_id, type, title, message, data, action_url)
        VALUES (
            NEW.org_id,
            NEW.assigned_to,
            'rfi_assigned',
            'RFI Assigned',
            'You have been assigned RFI #' || NEW.number || ': ' || NEW.subject,
            jsonb_build_object('rfi_id', NEW.id),
            '/rfis/' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_task_assignment
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();

CREATE TRIGGER notify_rfi_assignment
    AFTER INSERT OR UPDATE ON rfis
    FOR EACH ROW EXECUTE FUNCTION notify_on_assignment();

-- ============================================================
-- WARRANTY EXPIRATION CHECK FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION check_warranty_expirations()
RETURNS void AS $$
DECLARE
    warranty_record RECORD;
BEGIN
    FOR warranty_record IN
        SELECT w.*, p.name as project_name
        FROM warranties w
        JOIN projects p ON w.project_id = p.id
        WHERE w.status = 'active'
        AND w.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (w.notify_before_days || ' days')::INTERVAL
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.data->>'warranty_id' = w.id::TEXT
            AND n.type = 'warranty_expiring'
            AND n.created_at > CURRENT_DATE - INTERVAL '7 days'
        )
    LOOP
        -- Create notification for warranty expiration
        INSERT INTO notifications (org_id, user_id, type, title, message, data)
        SELECT
            warranty_record.org_id,
            pm.user_id,
            'warranty_expiring',
            'Warranty Expiring Soon',
            'Warranty for ' || warranty_record.item || ' on project ' || warranty_record.project_name || ' expires on ' || warranty_record.end_date,
            jsonb_build_object('warranty_id', warranty_record.id, 'project_id', warranty_record.project_id)
        FROM project_members pm
        WHERE pm.project_id = warranty_record.project_id
        AND pm.role IN ('project_manager', 'project_engineer');
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule this to run daily via pg_cron or external scheduler

