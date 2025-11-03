# QR Code Machine Runtime Tracking

## Overview

This system allows operators to track machine runtime by scanning QR codes or clicking START/STOP buttons. Multiple start/stop cycles between tool changes are automatically tracked and summed, providing accurate runtime data for production analysis.

## How It Works

### Basic Workflow

1. **Operator scans START** (or clicks START button)
   - System records a START event with timestamp
   - Equipment, operator, and shift information is captured

2. **Machine runs production**
   - Machine is in RUNNING state
   - Production occurs

3. **Operator scans STOP** (or clicks STOP button)
   - System records a STOP event with timestamp
   - Calculates runtime between START and STOP
   - Automatically pairs the events

4. **Multiple cycles supported**
   - If machine stops and starts again before a tool change, repeat steps 1-3
   - All runtime periods between tool changes are summed
   - Total runtime is associated with the next tool change

### Example Scenario

```
8:00 AM  - Operator scans START
10:30 AM - Operator scans STOP (2.5 hours runtime)
11:00 AM - Operator scans START (after break)
2:00 PM  - Operator scans STOP (3 hours runtime)
2:15 PM  - Tool change recorded

Total runtime between tool changes: 5.5 hours
```

## Database Schema

### Tables

#### `machine_state_events`

Stores each START and STOP event from QR code scans.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `created_at` | TIMESTAMPTZ | When record was created |
| `equipment_number` | TEXT | Equipment identifier (required) |
| `event_type` | TEXT | 'START' or 'STOP' (required) |
| `event_timestamp` | TIMESTAMPTZ | When event occurred |
| `operator` | TEXT | Operator name |
| `operator_id` | BIGINT | Foreign key to operators table |
| `shift` | INTEGER | Shift number (1, 2, or 3) |
| `work_center` | TEXT | Work center/department |
| `part_number` | TEXT | Part being produced |
| `job_number` | TEXT | Job/work order number |
| `qr_code_data` | TEXT | The QR code that was scanned |
| `notes` | TEXT | Additional notes |
| `tool_change_id` | BIGINT | Link to tool change (optional) |
| `paired` | BOOLEAN | Whether this event has been paired |
| `paired_event_id` | BIGINT | ID of the paired event |

#### `qr_code_definitions`

Defines what each QR code represents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `created_at` | TIMESTAMPTZ | When record was created |
| `qr_code` | TEXT | Unique QR code string |
| `event_type` | TEXT | 'START' or 'STOP' |
| `equipment_number` | TEXT | Optional: specific equipment |
| `work_center` | TEXT | Optional: work center |
| `description` | TEXT | Human-readable description |
| `active` | BOOLEAN | Whether code is active |

### Functions

#### `get_machine_runtime_periods(equipment_num, start_date, end_date)`

Returns all paired START/STOP events with calculated runtime.

**Returns:**
- `equipment_number`: Equipment ID
- `start_event_id`: ID of START event
- `stop_event_id`: ID of STOP event
- `start_time`: When START was scanned
- `stop_time`: When STOP was scanned
- `runtime_hours`: Runtime in hours
- `runtime_minutes`: Runtime in minutes
- `runtime_seconds`: Runtime in seconds
- `operator`: Operator name
- `shift`: Shift number
- `work_center`: Work center
- `part_number`: Part number
- `tool_change_id`: Associated tool change

#### `get_total_runtime_between_tool_changes(equipment_num, start_date, end_date)`

Calculates total runtime from all START/STOP pairs between consecutive tool changes.

**Returns:**
- `equipment_number`: Equipment ID
- `tool_change_id`: First tool change ID
- `next_tool_change_id`: Next tool change ID
- `total_runtime_hours`: Sum of all runtime hours
- `total_runtime_minutes`: Sum of all runtime minutes
- `runtime_period_count`: Number of START/STOP cycles
- `pieces_produced`: From tool change record
- `downtime_minutes`: From tool change record
- Additional metadata

#### `get_qr_runtime_summary(equipment_num, days_back)`

Provides summary statistics for QR-based runtime tracking.

**Returns:**
- `equipment_number`: Equipment ID
- `total_runtime_hours`: Total hours tracked
- `total_start_stop_cycles`: Number of cycles
- `avg_cycle_runtime_hours`: Average runtime per cycle
- `total_pieces_produced`: Total production
- `pieces_per_hour`: Production rate

#### `pair_machine_state_events()`

Manually triggers pairing of unpaired START/STOP events. (Normally happens automatically via trigger.)

### Views

#### `machine_runtime_by_day`

Daily summary of runtime periods by equipment.

#### `unpaired_machine_events`

Shows START or STOP events that haven't been paired yet. Useful for monitoring and troubleshooting.

### Triggers

#### `auto_pair_machine_events`

Automatically pairs START and STOP events when a new event is inserted. Finds the most recent unpaired START when a STOP is recorded, and vice versa.

## API Endpoints

### POST `/api/qr-code-scan`

Record a machine state event (START or STOP).

**Request Body:**
```json
{
  "qr_code": "MACHINE_START_GLOBAL",
  "equipment_number": "LATHE-001",
  "operator": "John Doe",
  "shift": 1,
  "work_center": "Machining",
  "part_number": "CAT536-6763",
  "job_number": "JOB-123",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": 1234,
    "equipment_number": "LATHE-001",
    "event_type": "START",
    "event_timestamp": "2025-11-03T08:30:00Z",
    "paired": false
  },
  "message": "Machine START event recorded successfully",
  "unpaired_events_count": 1,
  "unpaired_events": [...]
}
```

### GET `/api/qr-code-scan?equipmentNumber=LATHE-001`

Get unpaired events for monitoring.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "unpaired_events": [
    {
      "id": 1234,
      "equipment_number": "LATHE-001",
      "event_type": "START",
      "event_timestamp": "2025-11-03T08:30:00Z",
      "operator": "John Doe",
      "hours_since_event": 2.5
    }
  ]
}
```

## JavaScript Library Functions

### Recording Events

```javascript
import { recordMachineStateEvent } from '../lib/supabase'

// Record a START event
const event = await recordMachineStateEvent({
  equipment_number: 'LATHE-001',
  event_type: 'START',
  operator: 'John Doe',
  shift: 1,
  work_center: 'Machining',
  part_number: 'CAT536-6763'
})
```

### Querying Runtime Data

```javascript
import {
  getMachineRuntimePeriods,
  getTotalRuntimeBetweenToolChanges,
  getQRRuntimeSummary,
  getUnpairedMachineEvents
} from '../lib/supabase'

// Get all runtime periods
const periods = await getMachineRuntimePeriods('LATHE-001')

// Get total runtime between tool changes
const totalRuntime = await getTotalRuntimeBetweenToolChanges('LATHE-001')

// Get summary statistics
const summary = await getQRRuntimeSummary('LATHE-001', 30)

// Check for unpaired events
const unpaired = await getUnpairedMachineEvents('LATHE-001')
```

## User Interface

### Machine Runtime Scanner Page

Navigate to `/machine-runtime-scanner` to access the operator interface.

**Features:**
- Simple form for equipment and operator information
- Large START and STOP buttons
- QR code input field
- Real-time feedback on event recording
- Display of unpaired events
- Last event confirmation

**Usage:**
1. Open page on tablet or smartphone
2. Enter equipment number and operator name
3. Select shift
4. Click START when beginning work
5. Click STOP when pausing or finishing
6. Repeat as needed throughout the day

## QR Code Setup

### Default QR Codes

Two default QR codes are created during migration:

- `MACHINE_START_GLOBAL` - Works for any machine START
- `MACHINE_STOP_GLOBAL` - Works for any machine STOP

### Creating Equipment-Specific QR Codes

```sql
INSERT INTO qr_code_definitions (qr_code, event_type, equipment_number, description)
VALUES
  ('LATHE001_START', 'START', 'LATHE-001', 'Start code for Lathe 001'),
  ('LATHE001_STOP', 'STOP', 'LATHE-001', 'Stop code for Lathe 001');
```

### Generating Printable QR Codes

Use any online QR code generator with the code strings:
- For START: Use the text `MACHINE_START_GLOBAL` or your custom code
- For STOP: Use the text `MACHINE_STOP_GLOBAL` or your custom code

**Recommended:**
1. Generate QR codes as high-resolution images
2. Print on waterproof labels
3. Laminate for durability
4. Mount near machine controls
5. Include text labels: "SCAN TO START" and "SCAN TO STOP"

## Database Migration

### Apply Migration

```bash
# Using psql
psql -U postgres -d your_database -f supabase/migrations/add_qr_code_runtime_tracking.sql

# Or using Supabase CLI
supabase db push
```

### Verify Installation

```sql
-- Check that tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('machine_state_events', 'qr_code_definitions');

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%runtime%';

-- Check default QR codes
SELECT * FROM qr_code_definitions;
```

## Testing

### Manual Testing

```sql
-- 1. Record a START event
INSERT INTO machine_state_events (equipment_number, event_type, operator, shift)
VALUES ('LATHE-001', 'START', 'John Doe', 1);

-- 2. Wait a few seconds, then record a STOP event
INSERT INTO machine_state_events (equipment_number, event_type, operator, shift)
VALUES ('LATHE-001', 'STOP', 'John Doe', 1);

-- 3. Check if events were paired
SELECT * FROM machine_state_events WHERE equipment_number = 'LATHE-001' ORDER BY event_timestamp DESC;

-- 4. Get runtime periods
SELECT * FROM get_machine_runtime_periods('LATHE-001', NULL, NULL);

-- 5. Check unpaired events
SELECT * FROM unpaired_machine_events WHERE equipment_number = 'LATHE-001';
```

### API Testing

```bash
# Record START event
curl -X POST http://localhost:3000/api/qr-code-scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_code": "MACHINE_START_GLOBAL",
    "equipment_number": "LATHE-001",
    "operator": "John Doe",
    "shift": 1
  }'

# Record STOP event
curl -X POST http://localhost:3000/api/qr-code-scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_code": "MACHINE_STOP_GLOBAL",
    "equipment_number": "LATHE-001",
    "operator": "John Doe",
    "shift": 1
  }'

# Check unpaired events
curl http://localhost:3000/api/qr-code-scan?equipmentNumber=LATHE-001
```

## Troubleshooting

### Unpaired Events

**Problem:** START events without matching STOP (or vice versa)

**Solutions:**
1. Check `unpaired_machine_events` view
2. Manually pair events if needed:
   ```sql
   UPDATE machine_state_events SET paired = TRUE, paired_event_id = [stop_id] WHERE id = [start_id];
   UPDATE machine_state_events SET paired = TRUE, paired_event_id = [start_id] WHERE id = [stop_id];
   ```
3. Or run manual pairing function:
   ```sql
   SELECT pair_machine_state_events();
   ```

### Missing Runtime Data

**Problem:** Runtime not showing up in reports

**Possible causes:**
1. Events not paired - check `unpaired_machine_events`
2. Events outside date range - check timestamps
3. Wrong equipment number - verify exact match

**Debug queries:**
```sql
-- Check all events for equipment
SELECT * FROM machine_state_events
WHERE equipment_number = 'LATHE-001'
ORDER BY event_timestamp DESC;

-- Check runtime periods
SELECT * FROM get_machine_runtime_periods('LATHE-001', NULL, NULL);

-- Check total runtime
SELECT * FROM get_total_runtime_between_tool_changes('LATHE-001', NULL, NULL);
```

### Duplicate START or STOP Events

**Problem:** Two START events in a row without STOP

**Prevention:** UI should warn if last event was same type

**Resolution:**
1. Identify which event was erroneous
2. Delete the incorrect event:
   ```sql
   DELETE FROM machine_state_events WHERE id = [wrong_event_id];
   ```
3. Re-run pairing function if needed

## Best Practices

### For Operators

1. **Always scan both START and STOP** - Don't forget to stop when finishing
2. **Scan immediately** - Record events when they happen, not later
3. **Verify feedback** - Check that scan was recorded successfully
4. **Report issues** - If you see unpaired events, notify supervisor

### For Supervisors

1. **Monitor unpaired events** - Check daily for orphaned START/STOP events
2. **Review runtime data** - Compare against production records
3. **Train operators** - Ensure everyone knows how to use the system
4. **Audit periodically** - Spot-check runtime data for accuracy

### For Administrators

1. **Regular backups** - Back up `machine_state_events` table regularly
2. **Performance monitoring** - Index usage and query performance
3. **Data retention** - Establish policy for archiving old events
4. **QR code management** - Keep QR code definitions up to date

## Integration with Tool Changes

### Automatic Linking

When recording a machine state event, you can optionally link it to a tool change:

```javascript
await recordMachineStateEvent({
  equipment_number: 'LATHE-001',
  event_type: 'STOP',
  tool_change_id: 1234  // Links to specific tool change
})
```

### Runtime Field in Tool Changes

Future enhancement: Add a calculated field to `tool_changes` table that automatically pulls total runtime from paired events:

```sql
-- Example query to get runtime for a tool change period
SELECT tc.id AS tool_change_id,
       COALESCE(SUM(runtime_hours), 0) AS total_runtime_hours
FROM tool_changes tc
LEFT JOIN get_total_runtime_between_tool_changes(tc.equipment_number, tc.date, tc.date) rt
  ON rt.tool_change_id = tc.id
GROUP BY tc.id;
```

## Reporting Examples

### Daily Runtime by Equipment

```sql
SELECT equipment_number,
       DATE(start_time) AS date,
       COUNT(*) AS cycles,
       SUM(runtime_hours) AS total_hours
FROM get_machine_runtime_periods()
WHERE start_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY equipment_number, DATE(start_time)
ORDER BY equipment_number, date DESC;
```

### Operator Efficiency

```sql
SELECT operator,
       COUNT(*) AS cycles,
       SUM(runtime_hours) AS total_hours,
       AVG(runtime_hours) AS avg_hours_per_cycle
FROM get_machine_runtime_periods()
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
  AND operator IS NOT NULL
GROUP BY operator
ORDER BY total_hours DESC;
```

### Equipment Utilization

```sql
SELECT equipment_number,
       total_runtime_hours,
       total_start_stop_cycles,
       total_pieces_produced,
       pieces_per_hour
FROM get_qr_runtime_summary(NULL, 30)
ORDER BY total_runtime_hours DESC;
```

## Future Enhancements

Potential improvements to consider:

1. **Mobile app** - Native iOS/Android app for faster scanning
2. **Beacon/NFC support** - Automatic detection when operator approaches machine
3. **Photo capture** - Attach photos of parts/issues with events
4. **Voice commands** - Hands-free START/STOP via voice
5. **Predictive alerts** - Notify if machine running unusually long without stop
6. **Real-time dashboard** - Live view of all machines and their current state
7. **Integration with MES** - Connect to Manufacturing Execution Systems
8. **Geofencing** - Verify operator is at correct machine location
