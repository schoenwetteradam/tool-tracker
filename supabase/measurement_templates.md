# `measurement_templates` reference

The blast exit measurement form loads its live configuration from the `measurement_templates` table. Each row describes one CAT product (keyed by the `product_number`) and provides the dimensional requirements, guidance, and scheduling metadata that the UI needs to display.

## Required data for each product

| Column | Purpose |
| --- | --- |
| `product_number` | Unique identifier for the CAT part (e.g., `CAT536-6765`). Rows must start with `CAT` to appear in the production UI. |
| `product_description` | Friendly name shown in selection menus. |
| `product_family` | Used to group related parts and pre-fill downstream reports. |
| `priority_score`, `priority_label` | Control sort order and priority badges in the queue. Higher scores float to the top. |
| `volume_classification`, `measurement_frequency` | Inform operators how often to capture measurements. |
| `active` | Only active templates are loaded by the app. |

## Configuring dimensional checks

Set the `requires_*` flags to `TRUE` for each dimension the operator must record. When a flag is true, also supply the matching `*_target` and `*_tolerance` values (in inches). Leave targets and tolerances `NULL` for dimensions that are not required.

For additional spot checks, populate the measurement counters:

- `od_measurement_count`
- `id_measurement_count`
- `length_measurement_count`

These values control how many free-form readings appear in the UI. Use zeros when no extra readings are needed.

Optional thresholds `scrap_threshold_percentage` and `rework_threshold_percentage` allow the UI to highlight pass/fail status when a batch exceeds the configured percentages.

## Operator guidance

Three text fields are surfaced directly in the measurement workflow:

- `measurement_instructions`
- `critical_dimensions`
- `special_requirements`

Use them to mirror the guidance operators normally receive on paper routers (tooling, inspection sequence, hold criteria, etc.).

You can also record drawing metadata with `drawing_reference` or tolerance grouping via `tolerance_class` when available, although the current UI does not require them.

## Example insert

```sql
INSERT INTO measurement_templates (
  product_number,
  product_description,
  product_family,
  requires_barrel_diameter,
  barrel_diameter_target,
  barrel_diameter_tolerance,
  requires_flange_diameter,
  flange_diameter_target,
  flange_diameter_tolerance,
  requires_overall_length,
  overall_length_target,
  overall_length_tolerance,
  requires_length_to_flange,
  length_to_flange_target,
  length_to_flange_tolerance,
  od_measurement_count,
  id_measurement_count,
  length_measurement_count,
  measurement_instructions,
  critical_dimensions,
  special_requirements,
  volume_classification,
  measurement_frequency,
  priority_score,
  priority_label,
  active
) VALUES (
  'CAT536-6765',
  'Cylinder Casting - HIGHEST Priority',
  '536_SERIES',
  TRUE,
  11.569,
  0.02,
  TRUE,
  12.87,
  0.02,
  TRUE,
  59.519,
  0.02,
  TRUE,
  54.622,
  0.02,
  0,
  0,
  0,
  'Use measurement sheet 41A2360. Pi tape for ODs, calipers for lengths. All dimensions must pass before heat treat.',
  ARRAY['Barrel OD', 'Flange OD', 'Overall Length', 'Length to Flange'],
  'Heat treat approval requires PASS on all dimensions.',
  'Critical',
  'Each piece prior to heat treat',
  100,
  'HIGHEST PRIORITY',
  TRUE
);
```

This matches the seed data shipped with the project. Clone it for each live CAT product, adjusting the measurements, instructions, and scheduling metadata as needed.
