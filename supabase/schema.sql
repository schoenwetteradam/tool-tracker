-- Supabase schema for tool tracker application
-- Includes operators, equipment, tooling, measurement templates, and dimensional records

-- ===============
-- ENUMERATED TYPES
-- ===============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'volume_classification_enum') THEN
    CREATE TYPE volume_classification_enum AS ENUM (
      'Critical',
      'High',
      'Medium',
      'Low',
      'Prototype',
      'Legacy'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'measurement_frequency_enum') THEN
    CREATE TYPE measurement_frequency_enum AS ENUM (
      'Each piece prior to heat treat',
      'First-off and every 3 pieces',
      'First-off and every 5 pieces',
      'Per lot',
      'Per shift',
      'Per day',
      'Per week',
      'Per month',
      'As required'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tolerance_class_enum') THEN
    CREATE TYPE tolerance_class_enum AS ENUM (
      'Critical',
      'High',
      'Medium',
      'Standard',
      'Legacy'
    );
  END IF;
END $$;

-- ===============
-- ACCESS ROLES
-- ===============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tool_tracker_public') THEN
    CREATE ROLE tool_tracker_public NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tool_tracker_admin') THEN
    CREATE ROLE tool_tracker_admin NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tool_tracker_service_writer') THEN
    CREATE ROLE tool_tracker_service_writer NOLOGIN;
  END IF;
END $$;

GRANT tool_tracker_public TO anon;
GRANT tool_tracker_public TO authenticated;
GRANT tool_tracker_admin TO service_role;
GRANT tool_tracker_service_writer TO service_role;

-- ===============
-- OPERATORS
-- ===============
CREATE TABLE IF NOT EXISTS operators (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  employee_id TEXT UNIQUE,
  clock_number INTEGER UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  department TEXT,
  primary_shift INTEGER,
  job_title TEXT,
  skill_level TEXT,
  cnc_certified BOOLEAN DEFAULT FALSE,
  lathe_certified BOOLEAN DEFAULT FALSE,
  mill_certified BOOLEAN DEFAULT FALSE,
  cat536_6763_experience BOOLEAN DEFAULT FALSE,
  cat536_6763_pieces_produced INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(active);
CREATE INDEX IF NOT EXISTS idx_operators_full_name ON operators(full_name);

-- ===============
-- EQUIPMENT
-- ===============
CREATE TABLE IF NOT EXISTS equipment (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  equipment_number TEXT UNIQUE NOT NULL,
  description TEXT,
  work_center TEXT,
  equipment_type TEXT,
  equipment_group TEXT,
  location TEXT,
  status TEXT DEFAULT 'ACTIVE',
  model TEXT,
  manufacturer TEXT,
  last_maintenance DATE,
  next_maintenance DATE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment(active);
CREATE INDEX IF NOT EXISTS idx_equipment_work_center ON equipment(work_center);

-- ===============
-- TOOLING TABLES
-- ===============
CREATE TABLE IF NOT EXISTS tool_inventory (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tool_id TEXT UNIQUE NOT NULL,
  material_id TEXT,
  tool_type TEXT,
  insert_type TEXT,
  insert_geometry TEXT,
  insert_grade TEXT,
  quantity_on_hand INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit_cost NUMERIC(10,2),
  supplier_name TEXT,
  supplier_part_number TEXT,
  location TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_tool_inventory_active ON tool_inventory(active);
CREATE INDEX IF NOT EXISTS idx_tool_inventory_type ON tool_inventory(insert_type);

CREATE TABLE IF NOT EXISTS tool_costs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tool_type TEXT,
  insert_type TEXT,
  insert_grade TEXT,
  cost_per_tool NUMERIC(10,2),
  supplier_name TEXT,
  effective_date DATE
);

-- ===============
-- TOOL CHANGES
-- ===============
CREATE TABLE IF NOT EXISTS tool_changes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  shift INTEGER,
  operator TEXT,
  operator_id BIGINT REFERENCES operators(id) ON DELETE SET NULL,
  supervisor TEXT,
  work_center TEXT,
  equipment_number TEXT,
  operation TEXT,
  part_number TEXT,
  job_number TEXT,
  heat_number TEXT,
  casting_date DATE,
  material_appearance TEXT,
  material_risk_score INTEGER,
  tool_type TEXT,
  tool_position TEXT,
  insert_type TEXT,
  insert_grade TEXT,
  old_tool_id TEXT,
  new_tool_id TEXT,
  old_first_rougher TEXT,
  new_first_rougher TEXT,
  first_rougher_action TEXT,
  old_finish_tool TEXT,
  new_finish_tool TEXT,
  finish_tool_action TEXT,
  old_rougher_material_id TEXT,
  new_rougher_material_id TEXT,
  old_finish_material_id TEXT,
  new_finish_material_id TEXT,
  old_rougher_supplier TEXT,
  new_rougher_supplier TEXT,
  old_finish_supplier TEXT,
  new_finish_supplier TEXT,
  first_rougher_change_reason TEXT,
  finish_tool_change_reason TEXT,
  change_reason TEXT,
  old_tool_condition TEXT,
  pieces_produced INTEGER,
  cycle_time_before NUMERIC(10,2),
  cycle_time_after NUMERIC(10,2),
  cycle_time NUMERIC(10,2),
  downtime_minutes INTEGER,
  dimension_check TEXT,
  surface_finish TEXT,
  rougher_cost NUMERIC(10,2),
  finish_cost NUMERIC(10,2),
  total_tool_cost NUMERIC(10,2),
  cost_per_tool NUMERIC(10,2),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tool_changes_date ON tool_changes(date);
CREATE INDEX IF NOT EXISTS idx_tool_changes_part_number ON tool_changes(part_number);
CREATE INDEX IF NOT EXISTS idx_tool_changes_work_center ON tool_changes(work_center);
CREATE INDEX IF NOT EXISTS idx_tool_changes_operator ON tool_changes(operator);
CREATE INDEX IF NOT EXISTS idx_tool_changes_tool_type ON tool_changes(tool_type);

CREATE TABLE IF NOT EXISTS tool_change_costs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tool_change_id BIGINT REFERENCES tool_changes(id) ON DELETE SET NULL,
  date DATE,
  part_number TEXT,
  work_center TEXT,
  tool_type TEXT,
  tool_unit_cost NUMERIC(10,2),
  pieces_produced INTEGER,
  total_tooling_cost NUMERIC(12,2),
  notes TEXT
);

-- ===============
-- MEASUREMENT TEMPLATES
-- ===============
CREATE TABLE IF NOT EXISTS measurement_templates (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  product_number TEXT UNIQUE NOT NULL,
  product_description TEXT,
  product_family TEXT,
  requires_barrel_diameter BOOLEAN DEFAULT FALSE,
  barrel_diameter_target NUMERIC(10,4),
  barrel_diameter_tolerance NUMERIC(10,4),
  requires_flange_diameter BOOLEAN DEFAULT FALSE,
  flange_diameter_target NUMERIC(10,4),
  flange_diameter_tolerance NUMERIC(10,4),
  requires_overall_length BOOLEAN DEFAULT FALSE,
  overall_length_target NUMERIC(10,4),
  overall_length_tolerance NUMERIC(10,4),
  requires_length_to_flange BOOLEAN DEFAULT FALSE,
  length_to_flange_target NUMERIC(10,4),
  length_to_flange_tolerance NUMERIC(10,4),
  od_measurement_count INTEGER DEFAULT 0,
  id_measurement_count INTEGER DEFAULT 0,
  length_measurement_count INTEGER DEFAULT 0,
  scrap_threshold_percentage NUMERIC(6,3),
  rework_threshold_percentage NUMERIC(6,3),
  measurement_instructions TEXT,
  critical_dimensions TEXT[],
  special_requirements TEXT,
  volume_classification volume_classification_enum,
  measurement_frequency measurement_frequency_enum,
  priority_score INTEGER,
  priority_label TEXT,
  tolerance_class tolerance_class_enum,
  drawing_reference TEXT,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_measurement_templates_active ON measurement_templates(active);
CREATE INDEX IF NOT EXISTS idx_measurement_templates_product_number ON measurement_templates(product_number);
CREATE INDEX IF NOT EXISTS idx_measurement_templates_priority ON measurement_templates(priority_score DESC);

-- ===============
-- DIMENSIONAL MEASUREMENTS
-- ===============
CREATE TABLE IF NOT EXISTS dimensional_measurements (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  heat_number TEXT,
  tracking_number BIGINT,
  product_number TEXT REFERENCES measurement_templates(product_number) ON DELETE SET NULL,
  product_family TEXT,
  measurement_date DATE,
  measurement_time TIME,
  operator TEXT,
  shift INTEGER,
  barrel_diameter_actual NUMERIC(12,5),
  barrel_diameter_target NUMERIC(12,5),
  barrel_diameter_tolerance NUMERIC(12,5),
  flange_diameter_actual NUMERIC(12,5),
  flange_diameter_target NUMERIC(12,5),
  flange_diameter_tolerance NUMERIC(12,5),
  overall_length_actual NUMERIC(12,5),
  overall_length_target NUMERIC(12,5),
  overall_length_tolerance NUMERIC(12,5),
  length_to_flange_actual NUMERIC(12,5),
  length_to_flange_target NUMERIC(12,5),
  length_to_flange_tolerance NUMERIC(12,5),
  material_appearance TEXT,
  dimensional_status TEXT,
  heat_treat_approved BOOLEAN,
  surface_condition TEXT,
  notes TEXT,
  measurement_method TEXT,
  od_measurement_1 NUMERIC(12,5),
  od_measurement_2 NUMERIC(12,5),
  od_measurement_3 NUMERIC(12,5),
  od_measurement_4 NUMERIC(12,5),
  od_measurement_5 NUMERIC(12,5),
  od_measurement_6 NUMERIC(12,5),
  od_measurement_7 NUMERIC(12,5),
  od_measurement_8 NUMERIC(12,5),
  od_measurement_9 NUMERIC(12,5),
  od_measurement_10 NUMERIC(12,5),
  id_measurement_1 NUMERIC(12,5),
  id_measurement_2 NUMERIC(12,5),
  id_measurement_3 NUMERIC(12,5),
  id_measurement_4 NUMERIC(12,5),
  id_measurement_5 NUMERIC(12,5),
  id_measurement_6 NUMERIC(12,5),
  id_measurement_7 NUMERIC(12,5),
  id_measurement_8 NUMERIC(12,5),
  id_measurement_9 NUMERIC(12,5),
  id_measurement_10 NUMERIC(12,5),
  length_measurement_1 NUMERIC(12,5),
  length_measurement_2 NUMERIC(12,5),
  length_measurement_3 NUMERIC(12,5),
  length_measurement_4 NUMERIC(12,5),
  length_measurement_5 NUMERIC(12,5),
  length_measurement_6 NUMERIC(12,5),
  length_measurement_7 NUMERIC(12,5),
  length_measurement_8 NUMERIC(12,5),
  length_measurement_9 NUMERIC(12,5),
  length_measurement_10 NUMERIC(12,5)
);

CREATE INDEX IF NOT EXISTS idx_dimensional_measurements_date ON dimensional_measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_dimensional_measurements_product ON dimensional_measurements(product_number);

-- ===============
-- ROLE PRIVILEGES
-- ===============
GRANT USAGE ON SCHEMA public TO tool_tracker_public;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tool_tracker_public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tool_tracker_public;

GRANT USAGE ON SCHEMA public TO tool_tracker_service_writer;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tool_tracker_service_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tool_tracker_service_writer;

GRANT USAGE ON SCHEMA public TO tool_tracker_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tool_tracker_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tool_tracker_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tool_tracker_public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO tool_tracker_public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO tool_tracker_service_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO tool_tracker_service_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO tool_tracker_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO tool_tracker_admin;

-- ===============
-- ROW LEVEL SECURITY
-- ===============
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_change_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimensional_measurements ENABLE ROW LEVEL SECURITY;

-- Generic policies allowing authenticated users to read data
CREATE POLICY IF NOT EXISTS "Allow public access to operators" ON operators
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to equipment" ON equipment
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to tool_inventory" ON tool_inventory
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to tool_costs" ON tool_costs
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to tool_changes" ON tool_changes
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to tool_change_costs" ON tool_change_costs
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to measurement_templates" ON measurement_templates
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to dimensional_measurements" ON dimensional_measurements
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Insert policies for application writes
CREATE POLICY IF NOT EXISTS "Allow public inserts for operators" ON operators
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for equipment" ON equipment
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for tool_inventory" ON tool_inventory
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for tool_costs" ON tool_costs
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for tool_changes" ON tool_changes
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for tool_change_costs" ON tool_change_costs
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for measurement_templates" ON measurement_templates
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for dimensional_measurements" ON dimensional_measurements
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Update and delete policies limited to the service role / admin controls
CREATE POLICY IF NOT EXISTS "Allow service role updates on operators" ON operators
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on operators" ON operators
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on equipment" ON equipment
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on equipment" ON equipment
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on tool_inventory" ON tool_inventory
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on tool_inventory" ON tool_inventory
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on tool_costs" ON tool_costs
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on tool_costs" ON tool_costs
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on tool_changes" ON tool_changes
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on tool_changes" ON tool_changes
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on tool_change_costs" ON tool_change_costs
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on tool_change_costs" ON tool_change_costs
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on measurement_templates" ON measurement_templates
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on measurement_templates" ON measurement_templates
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role updates on dimensional_measurements" ON dimensional_measurements
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow service role deletes on dimensional_measurements" ON dimensional_measurements
  FOR DELETE USING (auth.role() = 'service_role');

-- Optional update policies for additional roles can be added separately.
