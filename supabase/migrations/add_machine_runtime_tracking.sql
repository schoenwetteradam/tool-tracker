-- Migration: Add machine runtime tracking between tool changes
-- This migration adds functionality to track and calculate machine runtime between consecutive tool changes

-- ===============
-- MACHINE RUNTIME CALCULATION FUNCTION
-- ===============

-- Function to calculate runtime between consecutive tool changes for a specific machine
CREATE OR REPLACE FUNCTION get_machine_runtime_between_tool_changes(
  equipment_num TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  equipment_number TEXT,
  tool_change_id BIGINT,
  change_datetime TIMESTAMPTZ,
  next_change_datetime TIMESTAMPTZ,
  runtime_hours NUMERIC,
  runtime_minutes NUMERIC,
  pieces_produced INTEGER,
  operator TEXT,
  shift INTEGER,
  part_number TEXT,
  work_center TEXT,
  downtime_minutes INTEGER
) AS $$
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
      LEAD((tc.date + tc.time)::TIMESTAMPTZ) OVER (
        PARTITION BY tc.equipment_number
        ORDER BY tc.date, tc.time
      ) AS next_change_datetime
    FROM tool_changes tc
    WHERE
      (equipment_num IS NULL OR tc.equipment_number = equipment_num)
      AND (start_date IS NULL OR tc.date >= start_date)
      AND (end_date IS NULL OR tc.date <= end_date)
      AND tc.equipment_number IS NOT NULL
  )
  SELECT
    tct.equipment_number,
    tct.id AS tool_change_id,
    tct.change_datetime,
    tct.next_change_datetime,
    CASE
      WHEN tct.next_change_datetime IS NOT NULL
      THEN EXTRACT(EPOCH FROM (tct.next_change_datetime - tct.change_datetime)) / 3600.0
      ELSE NULL
    END AS runtime_hours,
    CASE
      WHEN tct.next_change_datetime IS NOT NULL
      THEN EXTRACT(EPOCH FROM (tct.next_change_datetime - tct.change_datetime)) / 60.0
      ELSE NULL
    END AS runtime_minutes,
    tct.pieces_produced,
    tct.operator,
    tct.shift,
    tct.part_number,
    tct.work_center,
    tct.downtime_minutes
  FROM tool_change_timeline tct
  ORDER BY tct.equipment_number, tct.change_datetime;
$$ LANGUAGE sql STABLE;

-- ===============
-- MACHINE RUNTIME ANALYTICS VIEW
-- ===============

DROP VIEW IF EXISTS machine_runtime_analytics;
CREATE OR REPLACE VIEW machine_runtime_analytics AS
WITH runtime_data AS (
  SELECT
    equipment_number,
    tool_change_id,
    change_datetime,
    next_change_datetime,
    runtime_hours,
    runtime_minutes,
    pieces_produced,
    operator,
    shift,
    part_number,
    work_center,
    downtime_minutes,
    DATE_TRUNC('day', change_datetime)::DATE AS change_date,
    DATE_TRUNC('week', change_datetime)::DATE AS week_start,
    DATE_TRUNC('month', change_datetime)::DATE AS month_start
  FROM get_machine_runtime_between_tool_changes()
  WHERE runtime_hours IS NOT NULL
)
SELECT
  equipment_number,
  change_date,
  COUNT(*) AS tool_changes_count,
  SUM(runtime_hours) AS total_runtime_hours,
  AVG(runtime_hours) AS avg_runtime_hours,
  MIN(runtime_hours) AS min_runtime_hours,
  MAX(runtime_hours) AS max_runtime_hours,
  SUM(pieces_produced) AS total_pieces_produced,
  SUM(downtime_minutes) AS total_downtime_minutes,
  CASE
    WHEN SUM(runtime_hours) > 0
    THEN SUM(pieces_produced) / SUM(runtime_hours)
    ELSE 0
  END AS pieces_per_hour,
  CASE
    WHEN SUM(runtime_hours * 60 + COALESCE(downtime_minutes, 0)) > 0
    THEN (SUM(runtime_hours * 60) / SUM(runtime_hours * 60 + COALESCE(downtime_minutes, 0))) * 100
    ELSE 0
  END AS utilization_percentage
FROM runtime_data
GROUP BY equipment_number, change_date
ORDER BY equipment_number, change_date DESC;

-- ===============
-- MACHINE RUNTIME BY SHIFT VIEW
-- ===============

DROP VIEW IF EXISTS machine_runtime_by_shift;
CREATE OR REPLACE VIEW machine_runtime_by_shift AS
WITH runtime_data AS (
  SELECT
    equipment_number,
    runtime_hours,
    pieces_produced,
    shift,
    work_center,
    DATE_TRUNC('day', change_datetime)::DATE AS change_date
  FROM get_machine_runtime_between_tool_changes()
  WHERE runtime_hours IS NOT NULL
)
SELECT
  equipment_number,
  work_center,
  shift,
  change_date,
  COUNT(*) AS tool_changes_count,
  SUM(runtime_hours) AS total_runtime_hours,
  AVG(runtime_hours) AS avg_runtime_hours,
  SUM(pieces_produced) AS total_pieces_produced,
  CASE
    WHEN SUM(runtime_hours) > 0
    THEN SUM(pieces_produced) / SUM(runtime_hours)
    ELSE 0
  END AS pieces_per_hour
FROM runtime_data
WHERE shift IS NOT NULL
GROUP BY equipment_number, work_center, shift, change_date
ORDER BY equipment_number, change_date DESC, shift;

-- ===============
-- MACHINE RUNTIME BY OPERATOR VIEW
-- ===============

DROP VIEW IF EXISTS machine_runtime_by_operator;
CREATE OR REPLACE VIEW machine_runtime_by_operator AS
WITH runtime_data AS (
  SELECT
    equipment_number,
    operator,
    runtime_hours,
    pieces_produced,
    DATE_TRUNC('month', change_datetime)::DATE AS month_start
  FROM get_machine_runtime_between_tool_changes()
  WHERE runtime_hours IS NOT NULL
    AND operator IS NOT NULL
)
SELECT
  operator,
  equipment_number,
  month_start,
  COUNT(*) AS tool_changes_count,
  SUM(runtime_hours) AS total_runtime_hours,
  AVG(runtime_hours) AS avg_runtime_hours,
  SUM(pieces_produced) AS total_pieces_produced,
  CASE
    WHEN SUM(runtime_hours) > 0
    THEN SUM(pieces_produced) / SUM(runtime_hours)
    ELSE 0
  END AS pieces_per_hour
FROM runtime_data
GROUP BY operator, equipment_number, month_start
ORDER BY month_start DESC, operator, equipment_number;

-- ===============
-- HELPER FUNCTION: GET MACHINE RUNTIME SUMMARY
-- ===============

CREATE OR REPLACE FUNCTION get_machine_runtime_summary(
  equipment_num TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  equipment_number TEXT,
  total_tool_changes BIGINT,
  total_runtime_hours NUMERIC,
  avg_runtime_hours NUMERIC,
  max_runtime_hours NUMERIC,
  min_runtime_hours NUMERIC,
  total_pieces_produced NUMERIC,
  avg_pieces_per_hour NUMERIC,
  total_downtime_minutes NUMERIC
) AS $$
  SELECT
    rd.equipment_number,
    COUNT(*) AS total_tool_changes,
    SUM(rd.runtime_hours) AS total_runtime_hours,
    AVG(rd.runtime_hours) AS avg_runtime_hours,
    MAX(rd.runtime_hours) AS max_runtime_hours,
    MIN(rd.runtime_hours) AS min_runtime_hours,
    SUM(rd.pieces_produced) AS total_pieces_produced,
    CASE
      WHEN SUM(rd.runtime_hours) > 0
      THEN SUM(rd.pieces_produced) / SUM(rd.runtime_hours)
      ELSE 0
    END AS avg_pieces_per_hour,
    SUM(rd.downtime_minutes) AS total_downtime_minutes
  FROM get_machine_runtime_between_tool_changes(
    equipment_num,
    CURRENT_DATE - COALESCE(days_back, 30),
    CURRENT_DATE
  ) rd
  WHERE rd.runtime_hours IS NOT NULL
  GROUP BY rd.equipment_number
  ORDER BY rd.equipment_number;
$$ LANGUAGE sql STABLE;

-- ===============
-- GRANT PERMISSIONS
-- ===============

GRANT EXECUTE ON FUNCTION get_machine_runtime_between_tool_changes(TEXT, DATE, DATE) TO tool_tracker_public;
GRANT EXECUTE ON FUNCTION get_machine_runtime_summary(TEXT, INTEGER) TO tool_tracker_public;
GRANT SELECT ON machine_runtime_analytics TO tool_tracker_public;
GRANT SELECT ON machine_runtime_by_shift TO tool_tracker_public;
GRANT SELECT ON machine_runtime_by_operator TO tool_tracker_public;

-- ===============
-- COMMENTS FOR DOCUMENTATION
-- ===============

COMMENT ON FUNCTION get_machine_runtime_between_tool_changes IS
'Calculates runtime between consecutive tool changes for machines. Returns time intervals, pieces produced, and metadata for each runtime period.';

COMMENT ON FUNCTION get_machine_runtime_summary IS
'Provides summary statistics of machine runtime for a given equipment number and time period.';

COMMENT ON VIEW machine_runtime_analytics IS
'Daily aggregated view of machine runtime showing utilization, production rates, and downtime by equipment.';

COMMENT ON VIEW machine_runtime_by_shift IS
'Machine runtime metrics grouped by shift, enabling shift-based performance analysis.';

COMMENT ON VIEW machine_runtime_by_operator IS
'Monthly operator performance metrics showing runtime and production efficiency by machine.';
