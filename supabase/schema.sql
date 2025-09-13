-- Main tool changes table
CREATE TABLE tool_changes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  shift INTEGER,
  operator VARCHAR(100),
  supervisor VARCHAR(100),
  work_center VARCHAR(50),
  machine_number VARCHAR(50),
  operation VARCHAR(100),
  part_number VARCHAR(100),
  job_number VARCHAR(100),
  tool_type VARCHAR(50),
  old_tool_id VARCHAR(100),
  new_tool_id VARCHAR(100),
  tool_position VARCHAR(50),
  insert_type VARCHAR(50),
  insert_grade VARCHAR(50),
  first_rougher_change_reason VARCHAR(100),
  finish_tool_change_reason VARCHAR(100),
  change_reason VARCHAR(100),
  old_tool_condition VARCHAR(50),
  pieces_produced INTEGER,
  cycle_time DECIMAL(10,2),
  dimension_check VARCHAR(100),
  surface_finish VARCHAR(100),
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
