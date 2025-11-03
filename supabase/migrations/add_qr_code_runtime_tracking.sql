-- Migration: QR Code-based Machine Runtime Tracking
-- This migration adds QR code scanning functionality for tracking machine start/stop events
-- Operators scan START and STOP QR codes, and the system calculates total runtime

-- ===============
-- MACHINE STATE EVENTS TABLE
-- ===============

-- Table to store each QR code scan event (START or STOP)
CREATE TABLE IF NOT EXISTS machine_state_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  equipment_number TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('START', 'STOP')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  operator_id BIGINT REFERENCES operators(id) ON DELETE SET NULL,
  shift INTEGER,
  work_center TEXT,
  part_number TEXT,
  job_number TEXT,
  qr_code_data TEXT,
  notes TEXT,
  -- Link to tool change if this event is associated with one
  tool_change_id BIGINT REFERENCES tool_changes(id) ON DELETE SET NULL,
  -- Flag to mark if this event has been paired/processed
  paired BOOLEAN DEFAULT FALSE,
  -- Store the paired event ID for reference
  paired_event_id BIGINT REFERENCES machine_state_events(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_machine_state_events_equipment ON machine_state_events(equipment_number);
CREATE INDEX IF NOT EXISTS idx_machine_state_events_timestamp ON machine_state_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_machine_state_events_type ON machine_state_events(event_type);
CREATE INDEX IF NOT EXISTS idx_machine_state_events_paired ON machine_state_events(paired);
CREATE INDEX IF NOT EXISTS idx_machine_state_events_tool_change ON machine_state_events(tool_change_id);
CREATE INDEX IF NOT EXISTS idx_machine_state_events_operator ON machine_state_events(operator_id);

-- ===============
-- QR CODE DEFINITIONS TABLE
-- ===============

-- Table to store QR code definitions (what each code means)
CREATE TABLE IF NOT EXISTS qr_code_definitions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  qr_code TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('START', 'STOP')),
  equipment_number TEXT,
  work_center TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_qr_code_definitions_code ON qr_code_definitions(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_code_definitions_active ON qr_code_definitions(active);

-- ===============
-- FUNCTION: PAIR START/STOP EVENTS
-- ===============

-- Function to pair consecutive START and STOP events
CREATE OR REPLACE FUNCTION pair_machine_state_events()
RETURNS void AS $$
BEGIN
  -- Update paired flags for consecutive START-STOP pairs
  WITH ordered_events AS (
    SELECT
      id,
      equipment_number,
      event_type,
      event_timestamp,
      paired,
      ROW_NUMBER() OVER (PARTITION BY equipment_number ORDER BY event_timestamp) AS rn
    FROM machine_state_events
    WHERE paired = FALSE
  ),
  start_events AS (
    SELECT * FROM ordered_events WHERE event_type = 'START'
  ),
  stop_events AS (
    SELECT * FROM ordered_events WHERE event_type = 'STOP'
  ),
  pairs AS (
    SELECT
      s.id AS start_id,
      st.id AS stop_id
    FROM start_events s
    LEFT JOIN LATERAL (
      SELECT id, event_timestamp
      FROM stop_events st
      WHERE st.equipment_number = s.equipment_number
        AND st.rn > s.rn
        AND st.event_timestamp > s.event_timestamp
      ORDER BY st.event_timestamp
      LIMIT 1
    ) st ON TRUE
    WHERE st.id IS NOT NULL
  )
  UPDATE machine_state_events
  SET
    paired = TRUE,
    paired_event_id = pairs.stop_id
  FROM pairs
  WHERE machine_state_events.id = pairs.start_id;

  -- Also mark the STOP events as paired
  WITH ordered_events AS (
    SELECT
      id,
      equipment_number,
      event_type,
      event_timestamp,
      paired,
      ROW_NUMBER() OVER (PARTITION BY equipment_number ORDER BY event_timestamp) AS rn
    FROM machine_state_events
    WHERE paired = FALSE
  ),
  start_events AS (
    SELECT * FROM ordered_events WHERE event_type = 'START'
  ),
  stop_events AS (
    SELECT * FROM ordered_events WHERE event_type = 'STOP'
  ),
  pairs AS (
    SELECT
      s.id AS start_id,
      st.id AS stop_id
    FROM start_events s
    LEFT JOIN LATERAL (
      SELECT id, event_timestamp
      FROM stop_events st
      WHERE st.equipment_number = s.equipment_number
        AND st.rn > s.rn
        AND st.event_timestamp > s.event_timestamp
      ORDER BY st.event_timestamp
      LIMIT 1
    ) st ON TRUE
    WHERE st.id IS NOT NULL
  )
  UPDATE machine_state_events
  SET
    paired = TRUE,
    paired_event_id = pairs.start_id
  FROM pairs
  WHERE machine_state_events.id = pairs.stop_id;
END;
$$ LANGUAGE plpgsql;

-- ===============
-- FUNCTION: GET RUNTIME PERIODS
-- ===============

-- Function to get all runtime periods (paired START/STOP events)
CREATE OR REPLACE FUNCTION get_machine_runtime_periods(
  equipment_num TEXT DEFAULT NULL,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  equipment_number TEXT,
  start_event_id BIGINT,
  stop_event_id BIGINT,
  start_time TIMESTAMPTZ,
  stop_time TIMESTAMPTZ,
  runtime_hours NUMERIC,
  runtime_minutes NUMERIC,
  runtime_seconds NUMERIC,
  operator TEXT,
  shift INTEGER,
  work_center TEXT,
  part_number TEXT,
  tool_change_id BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH start_events AS (
    SELECT
      mse.id,
      mse.equipment_number,
      mse.event_timestamp,
      mse.operator,
      mse.shift,
      mse.work_center,
      mse.part_number,
      mse.tool_change_id,
      mse.paired_event_id
    FROM machine_state_events mse
    WHERE mse.event_type = 'START'
      AND mse.paired = TRUE
      AND (equipment_num IS NULL OR mse.equipment_number = equipment_num)
      AND (start_date IS NULL OR mse.event_timestamp >= start_date)
      AND (end_date IS NULL OR mse.event_timestamp <= end_date)
  ),
  stop_events AS (
    SELECT
      mse.id,
      mse.event_timestamp
    FROM machine_state_events mse
    WHERE mse.event_type = 'STOP'
      AND mse.paired = TRUE
  )
  SELECT
    se.equipment_number,
    se.id AS start_event_id,
    ste.id AS stop_event_id,
    se.event_timestamp AS start_time,
    ste.event_timestamp AS stop_time,
    EXTRACT(EPOCH FROM (ste.event_timestamp - se.event_timestamp)) / 3600.0 AS runtime_hours,
    EXTRACT(EPOCH FROM (ste.event_timestamp - se.event_timestamp)) / 60.0 AS runtime_minutes,
    EXTRACT(EPOCH FROM (ste.event_timestamp - se.event_timestamp)) AS runtime_seconds,
    se.operator,
    se.shift,
    se.work_center,
    se.part_number,
    se.tool_change_id
  FROM start_events se
  INNER JOIN stop_events ste ON se.paired_event_id = ste.id
  ORDER BY se.equipment_number, se.event_timestamp;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============
-- FUNCTION: GET TOTAL RUNTIME BETWEEN TOOL CHANGES
-- ===============

-- Function to calculate total runtime from all START/STOP pairs between tool changes
CREATE OR REPLACE FUNCTION get_total_runtime_between_tool_changes(
  equipment_num TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  equipment_number TEXT,
  tool_change_id BIGINT,
  tool_change_date DATE,
  tool_change_time TIME,
  next_tool_change_id BIGINT,
  next_tool_change_date DATE,
  next_tool_change_time TIME,
  total_runtime_hours NUMERIC,
  total_runtime_minutes NUMERIC,
  runtime_period_count BIGINT,
  pieces_produced INTEGER,
  downtime_minutes INTEGER,
  operator TEXT,
  shift INTEGER,
  part_number TEXT,
  work_center TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH tool_change_timeline AS (
    SELECT
      tc.id,
      tc.equipment_number,
      tc.date,
      tc.time,
      (tc.date + tc.time)::TIMESTAMPTZ AS change_datetime,
      tc.operator,
      tc.shift,
      tc.part_number,
      tc.work_center,
      tc.pieces_produced,
      tc.downtime_minutes,
      LEAD(tc.id) OVER (PARTITION BY tc.equipment_number ORDER BY tc.date, tc.time) AS next_change_id,
      LEAD(tc.date) OVER (PARTITION BY tc.equipment_number ORDER BY tc.date, tc.time) AS next_change_date,
      LEAD(tc.time) OVER (PARTITION BY tc.equipment_number ORDER BY tc.date, tc.time) AS next_change_time,
      LEAD((tc.date + tc.time)::TIMESTAMPTZ) OVER (PARTITION BY tc.equipment_number ORDER BY tc.date, tc.time) AS next_change_datetime
    FROM tool_changes tc
    WHERE
      (equipment_num IS NULL OR tc.equipment_number = equipment_num)
      AND (start_date IS NULL OR tc.date >= start_date)
      AND (end_date IS NULL OR tc.date <= end_date)
      AND tc.equipment_number IS NOT NULL
  ),
  runtime_periods AS (
    SELECT * FROM get_machine_runtime_periods(equipment_num, NULL, NULL)
  ),
  aggregated_runtime AS (
    SELECT
      tct.id AS tool_change_id,
      tct.equipment_number,
      tct.date,
      tct.time,
      tct.next_change_id,
      tct.next_change_date,
      tct.next_change_time,
      tct.operator,
      tct.shift,
      tct.part_number,
      tct.work_center,
      tct.pieces_produced,
      tct.downtime_minutes,
      COALESCE(SUM(rp.runtime_hours), 0) AS total_runtime_hours,
      COALESCE(SUM(rp.runtime_minutes), 0) AS total_runtime_minutes,
      COUNT(rp.start_event_id) AS runtime_period_count
    FROM tool_change_timeline tct
    LEFT JOIN runtime_periods rp ON
      rp.equipment_number = tct.equipment_number
      AND rp.start_time >= tct.change_datetime
      AND (tct.next_change_datetime IS NULL OR rp.stop_time <= tct.next_change_datetime)
    GROUP BY
      tct.id, tct.equipment_number, tct.date, tct.time,
      tct.next_change_id, tct.next_change_date, tct.next_change_time,
      tct.operator, tct.shift, tct.part_number, tct.work_center,
      tct.pieces_produced, tct.downtime_minutes
  )
  SELECT
    ar.equipment_number,
    ar.tool_change_id,
    ar.date AS tool_change_date,
    ar.time AS tool_change_time,
    ar.next_change_id AS next_tool_change_id,
    ar.next_change_date AS next_tool_change_date,
    ar.next_change_time AS next_tool_change_time,
    ar.total_runtime_hours,
    ar.total_runtime_minutes,
    ar.runtime_period_count,
    ar.pieces_produced,
    ar.downtime_minutes,
    ar.operator,
    ar.shift,
    ar.part_number,
    ar.work_center
  FROM aggregated_runtime ar
  ORDER BY ar.equipment_number, ar.date, ar.time;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============
-- FUNCTION: GET RUNTIME SUMMARY
-- ===============

CREATE OR REPLACE FUNCTION get_qr_runtime_summary(
  equipment_num TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  equipment_number TEXT,
  total_runtime_hours NUMERIC,
  total_runtime_minutes NUMERIC,
  total_start_stop_cycles BIGINT,
  avg_cycle_runtime_hours NUMERIC,
  total_pieces_produced NUMERIC,
  pieces_per_hour NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.equipment_number,
    SUM(rt.total_runtime_hours) AS total_runtime_hours,
    SUM(rt.total_runtime_minutes) AS total_runtime_minutes,
    SUM(rt.runtime_period_count) AS total_start_stop_cycles,
    AVG(rt.total_runtime_hours) AS avg_cycle_runtime_hours,
    SUM(rt.pieces_produced) AS total_pieces_produced,
    CASE
      WHEN SUM(rt.total_runtime_hours) > 0
      THEN SUM(rt.pieces_produced) / SUM(rt.total_runtime_hours)
      ELSE 0
    END AS pieces_per_hour
  FROM get_total_runtime_between_tool_changes(
    equipment_num,
    CURRENT_DATE - COALESCE(days_back, 30),
    CURRENT_DATE
  ) rt
  GROUP BY rt.equipment_number
  ORDER BY rt.equipment_number;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===============
-- VIEW: MACHINE RUNTIME SUMMARY BY DAY
-- ===============

DROP VIEW IF EXISTS machine_runtime_by_day;
CREATE OR REPLACE VIEW machine_runtime_by_day AS
SELECT
  equipment_number,
  DATE(start_time) AS runtime_date,
  COUNT(*) AS runtime_periods,
  SUM(runtime_hours) AS total_runtime_hours,
  SUM(runtime_minutes) AS total_runtime_minutes,
  AVG(runtime_hours) AS avg_runtime_hours,
  MIN(runtime_hours) AS min_runtime_hours,
  MAX(runtime_hours) AS max_runtime_hours
FROM get_machine_runtime_periods()
GROUP BY equipment_number, DATE(start_time)
ORDER BY equipment_number, runtime_date DESC;

-- ===============
-- VIEW: UNPAIRED EVENTS (for monitoring)
-- ===============

DROP VIEW IF EXISTS unpaired_machine_events;
CREATE OR REPLACE VIEW unpaired_machine_events AS
SELECT
  id,
  equipment_number,
  event_type,
  event_timestamp,
  operator,
  shift,
  work_center,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - event_timestamp)) / 3600.0 AS hours_since_event
FROM machine_state_events
WHERE paired = FALSE
ORDER BY event_timestamp DESC;

-- ===============
-- FUNCTION: TRIGGER TO AUTO-PAIR EVENTS
-- ===============

-- Trigger function to automatically pair events when a new event is inserted
CREATE OR REPLACE FUNCTION auto_pair_machine_events()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a STOP event, try to find the most recent unpaired START for the same equipment
  IF NEW.event_type = 'STOP' THEN
    WITH latest_start AS (
      SELECT id, event_timestamp
      FROM machine_state_events
      WHERE equipment_number = NEW.equipment_number
        AND event_type = 'START'
        AND paired = FALSE
        AND event_timestamp < NEW.event_timestamp
      ORDER BY event_timestamp DESC
      LIMIT 1
    )
    UPDATE machine_state_events
    SET paired = TRUE, paired_event_id = NEW.id
    FROM latest_start
    WHERE machine_state_events.id = latest_start.id;

    -- Mark the STOP event as paired if we found a START
    IF FOUND THEN
      UPDATE machine_state_events
      SET paired = TRUE,
          paired_event_id = (
            SELECT id FROM machine_state_events
            WHERE equipment_number = NEW.equipment_number
              AND event_type = 'START'
              AND paired_event_id = NEW.id
            LIMIT 1
          )
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_pair_events ON machine_state_events;
CREATE TRIGGER trigger_auto_pair_events
  AFTER INSERT ON machine_state_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_pair_machine_events();

-- ===============
-- SEED DATA: CREATE DEFAULT QR CODES
-- ===============

-- Insert default START and STOP QR codes for common equipment
-- You can generate more specific codes later

INSERT INTO qr_code_definitions (qr_code, event_type, description) VALUES
  ('MACHINE_START_GLOBAL', 'START', 'Global START code - works for any machine'),
  ('MACHINE_STOP_GLOBAL', 'STOP', 'Global STOP code - works for any machine')
ON CONFLICT (qr_code) DO NOTHING;

-- ===============
-- GRANT PERMISSIONS
-- ===============

GRANT SELECT, INSERT, UPDATE, DELETE ON machine_state_events TO tool_tracker_public;
GRANT SELECT ON qr_code_definitions TO tool_tracker_public;
GRANT INSERT ON qr_code_definitions TO tool_tracker_admin;
GRANT SELECT ON machine_runtime_by_day TO tool_tracker_public;
GRANT SELECT ON unpaired_machine_events TO tool_tracker_public;

GRANT EXECUTE ON FUNCTION pair_machine_state_events() TO tool_tracker_public;
GRANT EXECUTE ON FUNCTION get_machine_runtime_periods(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO tool_tracker_public;
GRANT EXECUTE ON FUNCTION get_total_runtime_between_tool_changes(TEXT, DATE, DATE) TO tool_tracker_public;
GRANT EXECUTE ON FUNCTION get_qr_runtime_summary(TEXT, INTEGER) TO tool_tracker_public;

-- ===============
-- ROW LEVEL SECURITY
-- ===============

ALTER TABLE machine_state_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public access to machine_state_events" ON machine_state_events
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public inserts for machine_state_events" ON machine_state_events
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY IF NOT EXISTS "Allow public access to qr_code_definitions" ON qr_code_definitions
  FOR SELECT USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- ===============
-- COMMENTS FOR DOCUMENTATION
-- ===============

COMMENT ON TABLE machine_state_events IS
'Stores each QR code scan event (START or STOP) for machine runtime tracking. Multiple START/STOP pairs can occur between tool changes.';

COMMENT ON TABLE qr_code_definitions IS
'Defines what each QR code represents (START or STOP) and optionally links to specific equipment.';

COMMENT ON FUNCTION get_machine_runtime_periods IS
'Returns all paired START/STOP events with calculated runtime for each period.';

COMMENT ON FUNCTION get_total_runtime_between_tool_changes IS
'Calculates total runtime from all START/STOP pairs that occurred between consecutive tool changes. Handles multiple runtime periods between tool changes.';

COMMENT ON FUNCTION get_qr_runtime_summary IS
'Provides summary statistics of QR-based runtime tracking including total hours, cycles, and production rates.';

COMMENT ON VIEW machine_runtime_by_day IS
'Daily summary of runtime periods showing total runtime hours and statistics by equipment.';

COMMENT ON VIEW unpaired_machine_events IS
'Shows unpaired START or STOP events that need attention. Useful for monitoring and troubleshooting.';
