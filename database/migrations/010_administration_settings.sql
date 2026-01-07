

-- ============================================================
-- SECTION 14: INDEXES FOR PERFORMANCE
-- ============================================================

-- Company Settings
CREATE INDEX IF NOT EXISTS idx_company_settings_org ON company_settings(org_id);

-- Units of Measure
CREATE INDEX IF NOT EXISTS idx_uom_org ON units_of_measure(org_id);
CREATE INDEX IF NOT EXISTS idx_uom_category ON units_of_measure(org_id, category);

-- Currencies
CREATE INDEX IF NOT EXISTS idx_currencies_org ON currencies(org_id);

-- Account Codes
CREATE INDEX IF NOT EXISTS idx_account_codes_org ON account_codes(org_id);
CREATE INDEX IF NOT EXISTS idx_account_codes_parent ON account_codes(parent_id);
CREATE INDEX IF NOT EXISTS idx_account_codes_type ON account_codes(org_id, code_type);
CREATE INDEX IF NOT EXISTS idx_account_codes_csi ON account_codes(org_id, csi_division);

-- Custom Fields
CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON custom_field_definitions(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_field_definitions(org_id, entity_type);

-- Tags
CREATE INDEX IF NOT EXISTS idx_tags_org ON tags(org_id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(org_id, category);

-- WBS Templates
CREATE INDEX IF NOT EXISTS idx_wbs_templates_org ON wbs_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_wbs_items_template ON wbs_template_items(template_id);

-- Labor Resources
CREATE INDEX IF NOT EXISTS idx_labor_org ON labor_resources(org_id);
CREATE INDEX IF NOT EXISTS idx_labor_trade ON labor_resources(org_id, trade);
CREATE INDEX IF NOT EXISTS idx_labor_wage_area ON labor_resources(org_id, wage_area);

-- Equipment Resources
CREATE INDEX IF NOT EXISTS idx_equipment_org ON equipment_resources(org_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_resources(org_id, category);

-- Rental Equipment
CREATE INDEX IF NOT EXISTS idx_rental_org ON rental_equipment(org_id);

-- Material Resources
CREATE INDEX IF NOT EXISTS idx_materials_org ON material_resources(org_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON material_resources(org_id, category);
CREATE INDEX IF NOT EXISTS idx_materials_csi ON material_resources(org_id, csi_section);

-- Subcontractor Defaults
CREATE INDEX IF NOT EXISTS idx_sub_defaults_org ON subcontractor_defaults(org_id);
CREATE INDEX IF NOT EXISTS idx_sub_defaults_csi ON subcontractor_defaults(org_id, csi_division);

-- Other Cost Items
CREATE INDEX IF NOT EXISTS idx_other_costs_org ON other_cost_items(org_id);
CREATE INDEX IF NOT EXISTS idx_other_costs_category ON other_cost_items(org_id, category);

-- Cost Assemblies
CREATE INDEX IF NOT EXISTS idx_assemblies_org ON cost_assemblies(org_id);
CREATE INDEX IF NOT EXISTS idx_assemblies_csi ON cost_assemblies(org_id, csi_division);
CREATE INDEX IF NOT EXISTS idx_assembly_items ON cost_assembly_items(assembly_id);

-- Markup Defaults
CREATE INDEX IF NOT EXISTS idx_markup_org ON markup_defaults(org_id);

-- Quote Groups
CREATE INDEX IF NOT EXISTS idx_quote_groups_org ON quote_groups(org_id);

-- Report Templates
CREATE INDEX IF NOT EXISTS idx_report_templates_org ON report_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(org_id, report_type);

-- System Defaults
CREATE INDEX IF NOT EXISTS idx_system_defaults_org ON system_defaults(org_id);

-- Project Settings
CREATE INDEX IF NOT EXISTS idx_project_settings_project ON project_settings(project_id);

-- Project Team
CREATE INDEX IF NOT EXISTS idx_project_team_project ON project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_user ON project_team(user_id);

-- Project Contacts
CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_contact ON project_contacts(contact_id);

-- Project Tags
CREATE INDEX IF NOT EXISTS idx_project_tags_project ON project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags(tag_id);

-- Project Custom Fields
CREATE INDEX IF NOT EXISTS idx_project_custom_fields_project ON project_custom_fields(project_id);


-- ============================================================
-- SECTION 15: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_assembly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_lookup_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE markup_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_custom_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access data from their organization
-- (Assumes auth.uid() and user_org_id() function exist from base schema)

-- Company Settings Policy
CREATE POLICY company_settings_org_policy ON company_settings
    FOR ALL USING (org_id = user_org_id());

-- Units of Measure Policy
CREATE POLICY uom_org_policy ON units_of_measure
    FOR ALL USING (org_id = user_org_id());

-- Currencies Policy
CREATE POLICY currencies_org_policy ON currencies
    FOR ALL USING (org_id = user_org_id());

-- Account Codes Policy
CREATE POLICY account_codes_org_policy ON account_codes
    FOR ALL USING (org_id = user_org_id());

-- Custom Fields Policy
CREATE POLICY custom_fields_org_policy ON custom_field_definitions
    FOR ALL USING (org_id = user_org_id());

-- Tags Policy
CREATE POLICY tags_org_policy ON tags
    FOR ALL USING (org_id = user_org_id());

-- WBS Templates Policy
CREATE POLICY wbs_templates_org_policy ON wbs_templates
    FOR ALL USING (org_id = user_org_id());

-- WBS Template Items Policy (via template)
CREATE POLICY wbs_items_org_policy ON wbs_template_items
    FOR ALL USING (
        template_id IN (SELECT id FROM wbs_templates WHERE org_id = user_org_id())
    );

-- Labor Resources Policy
CREATE POLICY labor_org_policy ON labor_resources
    FOR ALL USING (org_id = user_org_id());

-- Equipment Resources Policy
CREATE POLICY equipment_org_policy ON equipment_resources
    FOR ALL USING (org_id = user_org_id());

-- Rental Equipment Policy
CREATE POLICY rental_org_policy ON rental_equipment
    FOR ALL USING (org_id = user_org_id());

-- Material Resources Policy
CREATE POLICY materials_org_policy ON material_resources
    FOR ALL USING (org_id = user_org_id());

-- Subcontractor Defaults Policy
CREATE POLICY sub_defaults_org_policy ON subcontractor_defaults
    FOR ALL USING (org_id = user_org_id());

-- Other Cost Items Policy
CREATE POLICY other_costs_org_policy ON other_cost_items
    FOR ALL USING (org_id = user_org_id());

-- Cost Assemblies Policy
CREATE POLICY assemblies_org_policy ON cost_assemblies
    FOR ALL USING (org_id = user_org_id());

-- Cost Assembly Items Policy (via assembly)
CREATE POLICY assembly_items_org_policy ON cost_assembly_items
    FOR ALL USING (
        assembly_id IN (SELECT id FROM cost_assemblies WHERE org_id = user_org_id())
    );

-- Assembly Lookup Tables Policy
CREATE POLICY lookup_tables_org_policy ON assembly_lookup_tables
    FOR ALL USING (org_id = user_org_id());

-- Markup Defaults Policy
CREATE POLICY markup_org_policy ON markup_defaults
    FOR ALL USING (org_id = user_org_id());

-- Quote Groups Policy
CREATE POLICY quote_groups_org_policy ON quote_groups
    FOR ALL USING (org_id = user_org_id());

-- Report Templates Policy
CREATE POLICY report_templates_org_policy ON report_templates
    FOR ALL USING (org_id = user_org_id());

-- System Defaults Policy
CREATE POLICY system_defaults_org_policy ON system_defaults
    FOR ALL USING (org_id = user_org_id());

-- Project Settings Policy (via project access)
CREATE POLICY project_settings_policy ON project_settings
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE org_id = user_org_id())
    );

-- Project Team Policy
CREATE POLICY project_team_policy ON project_team
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE org_id = user_org_id())
    );

-- Project Contacts Policy
CREATE POLICY project_contacts_policy ON project_contacts
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE org_id = user_org_id())
    );

-- Project Tags Policy
CREATE POLICY project_tags_policy ON project_tags
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE org_id = user_org_id())
    );

-- Project Custom Fields Policy
CREATE POLICY project_custom_fields_policy ON project_custom_fields
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE org_id = user_org_id())
    );


-- ============================================================
-- SECTION 16: TRIGGERS FOR UPDATED_AT
-- ============================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uom_updated_at BEFORE UPDATE ON units_of_measure
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_codes_updated_at BEFORE UPDATE ON account_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wbs_templates_updated_at BEFORE UPDATE ON wbs_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_updated_at BEFORE UPDATE ON labor_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_updated_at BEFORE UPDATE ON rental_equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON material_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_defaults_updated_at BEFORE UPDATE ON subcontractor_defaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_other_costs_updated_at BEFORE UPDATE ON other_cost_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assemblies_updated_at BEFORE UPDATE ON cost_assemblies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lookup_tables_updated_at BEFORE UPDATE ON assembly_lookup_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markup_updated_at BEFORE UPDATE ON markup_defaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_groups_updated_at BEFORE UPDATE ON quote_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_defaults_updated_at BEFORE UPDATE ON system_defaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON project_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_custom_fields_updated_at BEFORE UPDATE ON project_custom_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- END OF MIGRATION 010: ADMINISTRATION SETTINGS
-- ============================================================
-- Total Tables Created: 26
-- 
-- Company-Level (15):
--   1. company_settings
--   2. units_of_measure
--   3. currencies
--   4. account_codes
--   5. custom_field_definitions
--   6. tags
--   7. wbs_templates
--   8. wbs_template_items
--   9. labor_resources
--  10. equipment_resources
--  11. rental_equipment
--  12. material_resources
--  13. subcontractor_defaults
--  14. other_cost_items
--  15. cost_assemblies
--  16. cost_assembly_items
--  17. assembly_lookup_tables
--  18. markup_defaults
--  19. quote_groups
--  20. report_templates
--  21. system_defaults
--
-- Project-Level (5):
--  22. project_settings
--  23. project_team
--  24. project_contacts
--  25. project_tags
--  26. project_custom_fields
-- ============================================================
