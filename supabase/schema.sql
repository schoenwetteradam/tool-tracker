-- Main tool changes table
CREATE TABLE tool_changes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  shift INTEGER,
  operator VARCHAR(100),
  operator_id INTEGER,
  supervisor VARCHAR(100),
  work_center VARCHAR(50),
  equipment_number VARCHAR(50),
  operation VARCHAR(100),
  part_number VARCHAR(100),
  job_number VARCHAR(100),
  heat_number VARCHAR(100),
  casting_date DATE,
  material_appearance VARCHAR(100),
  material_risk_score INTEGER,
  tool_type VARCHAR(50),
  tool_position VARCHAR(50),
  insert_type VARCHAR(50),
  insert_grade VARCHAR(50),
  old_tool_id VARCHAR(100),
  new_tool_id VARCHAR(100),
  old_first_rougher VARCHAR(100),
  new_first_rougher VARCHAR(100),
  first_rougher_action VARCHAR(50),
  old_finish_tool VARCHAR(100),
  new_finish_tool VARCHAR(100),
  finish_tool_action VARCHAR(50),
  old_rougher_material_id VARCHAR(100),
  new_rougher_material_id VARCHAR(100),
  old_finish_material_id VARCHAR(100),
  new_finish_material_id VARCHAR(100),
  old_rougher_supplier VARCHAR(100),
  new_rougher_supplier VARCHAR(100),
  old_finish_supplier VARCHAR(100),
  new_finish_supplier VARCHAR(100),
  first_rougher_change_reason VARCHAR(100),
  finish_tool_change_reason VARCHAR(100),
  change_reason VARCHAR(100),
  old_tool_condition VARCHAR(50),
  pieces_produced INTEGER,
  cycle_time_before DECIMAL(10,2),
  cycle_time_after DECIMAL(10,2),
  cycle_time DECIMAL(10,2),
  downtime_minutes INTEGER,
  dimension_check VARCHAR(100),
  surface_finish VARCHAR(100),
  rougher_cost DECIMAL(10,2),
  finish_cost DECIMAL(10,2),
  total_tool_cost DECIMAL(10,2),
  cost_per_tool DECIMAL(10,2),
  notes TEXT
);

CREATE TABLE tool_inventory (
  id SERIAL PRIMARY KEY,
  tool_id VARCHAR(100) UNIQUE NOT NULL,
  tool_type VARCHAR(50),
  insert_type VARCHAR(50),
  insert_grade VARCHAR(50),
  quantity_on_hand INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  supplier VARCHAR(100),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tool_costs (
  id SERIAL PRIMARY KEY,
  tool_type VARCHAR(50),
  insert_type VARCHAR(50),
  insert_grade VARCHAR(50),
  cost_per_tool DECIMAL(10,2),
  supplier VARCHAR(100),
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_changes_date ON tool_changes(date);
CREATE INDEX idx_tool_changes_part_number ON tool_changes(part_number);
CREATE INDEX idx_tool_changes_work_center ON tool_changes(work_center);
CREATE INDEX idx_tool_changes_operator ON tool_changes(operator);
CREATE INDEX idx_tool_changes_tool_type ON tool_changes(tool_type);

ALTER TABLE tool_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view tool_changes" ON tool_changes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert tool_changes" ON tool_changes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
