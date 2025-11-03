# Machine Runtime Tracking Documentation

## Overview

This feature tracks the time machines were running between consecutive tool changes. It calculates runtime intervals, production metrics, and utilization rates based on tool change timestamps.

## How It Works

The system uses the timestamps from consecutive tool changes to calculate how long a machine was running between each change. This provides insights into:

- **Runtime Hours**: Time elapsed between tool changes
- **Production Efficiency**: Pieces produced per hour of runtime
- **Machine Utilization**: Percentage of time machines are productive vs. downtime
- **Shift Performance**: Runtime and production metrics by shift
- **Operator Performance**: Runtime metrics by operator

## Database Schema

### Functions

#### `get_machine_runtime_between_tool_changes(equipment_num, start_date, end_date)`

Calculates runtime between consecutive tool changes for specified equipment and date range.

**Parameters:**
- `equipment_num` (TEXT, optional): Filter by equipment number
- `start_date` (DATE, optional): Start of date range
- `end_date` (DATE, optional): End of date range

**Returns:**
```sql
TABLE (
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
)
```

#### `get_machine_runtime_summary(equipment_num, days_back)`

Provides summary statistics for machine runtime.

**Parameters:**
- `equipment_num` (TEXT, optional): Filter by equipment number
- `days_back` (INTEGER, default: 30): Number of days to look back

**Returns:**
```sql
TABLE (
  equipment_number TEXT,
  total_tool_changes BIGINT,
  total_runtime_hours NUMERIC,
  avg_runtime_hours NUMERIC,
  max_runtime_hours NUMERIC,
  min_runtime_hours NUMERIC,
  total_pieces_produced NUMERIC,
  avg_pieces_per_hour NUMERIC,
  total_downtime_minutes NUMERIC
)
```

### Views

#### `machine_runtime_analytics`

Daily aggregated view of machine runtime with utilization metrics.

**Columns:**
- `equipment_number`: Equipment identifier
- `change_date`: Date of tool changes
- `tool_changes_count`: Number of tool changes that day
- `total_runtime_hours`: Total runtime for the day
- `avg_runtime_hours`: Average runtime between changes
- `min_runtime_hours`: Shortest runtime interval
- `max_runtime_hours`: Longest runtime interval
- `total_pieces_produced`: Total pieces produced
- `total_downtime_minutes`: Total downtime
- `pieces_per_hour`: Production rate
- `utilization_percentage`: Machine utilization rate

#### `machine_runtime_by_shift`

Runtime metrics grouped by shift.

**Columns:**
- `equipment_number`
- `work_center`
- `shift`: Shift number (1, 2, or 3)
- `change_date`
- `tool_changes_count`
- `total_runtime_hours`
- `avg_runtime_hours`
- `total_pieces_produced`
- `pieces_per_hour`

#### `machine_runtime_by_operator`

Monthly operator performance metrics.

**Columns:**
- `operator`: Operator name
- `equipment_number`
- `month_start`: First day of the month
- `tool_changes_count`
- `total_runtime_hours`
- `avg_runtime_hours`
- `total_pieces_produced`
- `pieces_per_hour`

## JavaScript API

### Import Functions

```javascript
import {
  getMachineRuntimeBetweenToolChanges,
  getMachineRuntimeSummary,
  getMachineRuntimeAnalytics,
  getMachineRuntimeByShift,
  getMachineRuntimeByOperator,
  calculateRuntimeMetrics
} from '../lib/supabase.js'
```

### Function Usage

#### `getMachineRuntimeBetweenToolChanges(equipmentNumber, startDate, endDate)`

Get detailed runtime data between tool changes.

```javascript
// Get runtime for all machines in the last 30 days
const data = await getMachineRuntimeBetweenToolChanges()

// Get runtime for specific equipment
const machineData = await getMachineRuntimeBetweenToolChanges('LATHE-001')

// Get runtime for date range
const rangeData = await getMachineRuntimeBetweenToolChanges(
  'LATHE-001',
  '2025-01-01',
  '2025-01-31'
)
```

#### `getMachineRuntimeSummary(equipmentNumber, daysBack)`

Get summary statistics.

```javascript
// Get summary for all machines (last 30 days)
const summary = await getMachineRuntimeSummary()

// Get summary for specific machine (last 60 days)
const machineSummary = await getMachineRuntimeSummary('LATHE-001', 60)
```

#### `getMachineRuntimeAnalytics(equipmentNumber, daysBack)`

Get daily aggregated analytics.

```javascript
// Get analytics for all machines
const analytics = await getMachineRuntimeAnalytics()

// Get analytics for specific machine
const machineAnalytics = await getMachineRuntimeAnalytics('LATHE-001', 30)
```

#### `getMachineRuntimeByShift(equipmentNumber, daysBack)`

Get runtime grouped by shift.

```javascript
// Get shift performance for all machines
const shiftData = await getMachineRuntimeByShift()

// Get shift performance for specific machine
const machineShiftData = await getMachineRuntimeByShift('LATHE-001', 30)
```

#### `getMachineRuntimeByOperator(operator, monthsBack)`

Get runtime grouped by operator.

```javascript
// Get operator performance for all operators
const operatorData = await getMachineRuntimeByOperator()

// Get performance for specific operator
const johnData = await getMachineRuntimeByOperator('John Doe', 6)
```

#### `calculateRuntimeMetrics(runtimeData)`

Calculate aggregate metrics from runtime data.

```javascript
const data = await getMachineRuntimeBetweenToolChanges('LATHE-001')
const metrics = calculateRuntimeMetrics(data)

console.log(metrics)
// {
//   totalRuntime: "125.50",
//   averageRuntime: "5.23",
//   minRuntime: "2.10",
//   maxRuntime: "8.45",
//   totalPieces: 1250,
//   piecesPerHour: "9.96",
//   totalDowntime: 240,
//   utilizationRate: "96.92"
// }
```

## REST API Endpoint

### Endpoint: `/api/machine-runtime`

**Method:** GET

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `summary` | Type of data to retrieve |
| `equipmentNumber` | string | null | Filter by equipment number |
| `startDate` | string (YYYY-MM-DD) | null | Start date for filtering |
| `endDate` | string (YYYY-MM-DD) | null | End date for filtering |
| `daysBack` | integer | 30 | Number of days to look back |
| `monthsBack` | integer | 3 | Number of months to look back (for by-operator) |
| `operator` | string | null | Filter by operator name |

**Type Options:**
- `between-changes`: Detailed runtime between each tool change
- `summary`: Summary statistics by machine
- `analytics`: Daily aggregated analytics
- `by-shift`: Runtime grouped by shift
- `by-operator`: Runtime grouped by operator

### Examples

#### Get runtime summary for all machines (last 30 days)
```bash
GET /api/machine-runtime?type=summary
```

Response:
```json
{
  "type": "summary",
  "count": 5,
  "period_days": 30,
  "data": [
    {
      "equipment_number": "LATHE-001",
      "total_tool_changes": 24,
      "total_runtime_hours": "125.50",
      "avg_runtime_hours": "5.23",
      "max_runtime_hours": "8.45",
      "min_runtime_hours": "2.10",
      "total_pieces_produced": 1250,
      "avg_pieces_per_hour": "9.96",
      "total_downtime_minutes": 240
    }
  ]
}
```

#### Get detailed runtime for specific machine
```bash
GET /api/machine-runtime?type=between-changes&equipmentNumber=LATHE-001&daysBack=7
```

Response:
```json
{
  "type": "between-changes",
  "count": 12,
  "data": [
    {
      "equipment_number": "LATHE-001",
      "tool_change_id": 1234,
      "change_datetime": "2025-11-01T08:30:00Z",
      "next_change_datetime": "2025-11-01T14:15:00Z",
      "runtime_hours": "5.75",
      "runtime_minutes": "345",
      "pieces_produced": 58,
      "operator": "John Doe",
      "shift": 1,
      "part_number": "CAT536-6763",
      "work_center": "Machining",
      "downtime_minutes": 10
    }
  ],
  "metrics": {
    "totalRuntime": "42.50",
    "averageRuntime": "3.54",
    "minRuntime": "2.10",
    "maxRuntime": "5.75",
    "totalPieces": 425,
    "piecesPerHour": "10.00",
    "totalDowntime": 120,
    "utilizationRate": "95.50"
  }
}
```

#### Get shift performance
```bash
GET /api/machine-runtime?type=by-shift&equipmentNumber=LATHE-001&daysBack=30
```

#### Get operator performance
```bash
GET /api/machine-runtime?type=by-operator&operator=John%20Doe&monthsBack=3
```

## Use Cases

### 1. Production Planning
Monitor average runtime between tool changes to predict when maintenance will be needed and plan production schedules accordingly.

### 2. Efficiency Analysis
Track pieces produced per hour of runtime to identify efficient vs. inefficient operations.

### 3. Shift Comparison
Compare runtime and production rates across different shifts to identify training opportunities or process improvements.

### 4. Operator Performance
Evaluate operator effectiveness by analyzing runtime, production rates, and tool change frequency.

### 5. Machine Utilization
Calculate actual machine utilization by comparing runtime to total available time (runtime + downtime).

### 6. Capacity Planning
Use historical runtime data to estimate production capacity and identify bottlenecks.

## Migration

To apply the database migration:

```bash
# Using psql
psql -U postgres -d your_database -f supabase/migrations/add_machine_runtime_tracking.sql

# Or using Supabase CLI
supabase db push
```

## Testing

Example test queries:

```sql
-- Get runtime for specific machine
SELECT * FROM get_machine_runtime_between_tool_changes('LATHE-001', NULL, NULL);

-- Get summary for last 7 days
SELECT * FROM get_machine_runtime_summary('LATHE-001', 7);

-- View analytics
SELECT * FROM machine_runtime_analytics
WHERE equipment_number = 'LATHE-001'
ORDER BY change_date DESC
LIMIT 10;

-- View shift performance
SELECT * FROM machine_runtime_by_shift
WHERE equipment_number = 'LATHE-001'
ORDER BY change_date DESC, shift;

-- View operator performance
SELECT * FROM machine_runtime_by_operator
WHERE operator = 'John Doe'
ORDER BY month_start DESC;
```

## Performance Considerations

- The runtime calculation uses window functions (LEAD) which are efficient for this use case
- Indexes on `tool_changes(equipment_number, date, time)` optimize query performance
- Views aggregate data on demand; consider materializing for very large datasets
- API endpoints include result counts to monitor data volume

## Future Enhancements

Potential improvements:
- Real-time machine state tracking (RUNNING, IDLE, STOPPED)
- Automated runtime logging independent of tool changes
- Downtime categorization (planned vs. unplanned)
- Integration with machine sensors for automatic state detection
- Alerts for abnormal runtime patterns
- Predictive maintenance based on runtime trends
