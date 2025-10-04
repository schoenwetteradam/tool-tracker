# Pour Report KPI Playbook

This document outlines the proposed production, quality, cost, and operational KPIs that can be derived from the pour report dataset. It serves as a reference for analytics development and dashboard planning.

## 1. Production Efficiency KPIs

### Daily and Shift Metrics
- **Pours per Shift**: Count pours grouped by `shift` (values 1, 2, 3).
- **Average Cast Weight**: Average of `cast_weight` per pour, segmented by `grade_name` and `shift`.
- **Total Production Weight**: Sum of `cast_weight` by day, week, and month.
- **Utilization Rate**: Compare actual pours per shift against target pours.

### Timing Metrics
- **Average Cycle Time**: Measure from `tap_time` to pour completion timestamp.
- **Pour Duration Distribution**: Analyze distribution of `pour_time_seconds`.
- **Spin Time Variance**: Compare `spin_time_minutes` to standard cycle expectations.

## 2. Quality Control KPIs

### Temperature Management
- **Pour Temperature Range Control**: Percentage of pours with `pour_temperature` within ±10°F of specification per grade, furnace, and shift.
- **Tap-to-Pour Temperature Drop**: Difference between `tap_temp` and `pour_temperature`; highlight excessive heat loss trends.

### Process Parameters
- **Die Temperature Consistency**: Standard deviation of `die_temp_before_pour`; flag readings >2 standard deviations from the mean.
- **RPM Compliance**: Compare `die_rpm` to specification by product, and analyze variance by operator/shift.
- **Wash Thickness Control**: Track `wash_thickness` trends and correlate with quality outcomes.

## 3. Cost and Financial KPIs

### Direct Costs
- **Cost per Pound Trend**: Trend analysis of `cost_per_pound` by grade over time.
- **Total Cast Value**: `cast_weight × cost_per_pound` aggregated for desired periods.
- **Material Cost Variance**: Compare actual material cost to standards.

### Productivity
- **Cost per Pour**: Total relevant costs divided by number of pours.
- **Yield Rate**: `(Actual weight ÷ planned weight) × 100` to monitor efficiency.
- **Scrap/Rework Impact**: Integrate with quality data to quantify downstream impact.

## 4. Equipment Performance KPIs

### Furnace Metrics
- **Furnace Utilization**: Pours per `furnace_number` (e.g., #15, #2).
- **Power Consumption**: Trend analysis of `power_percent` readings.
- **New Lining Impact**: Compare performance for records with `new_lining = true`.

### Die Performance
- **Die Utilization**: Pours per `die_number`.
- **Average RPM by Die**: Identify optimal `die_rpm` ranges.
- **Die Temperature Patterns**: Evaluate preheating effectiveness using `die_temp_before_pour`.

## 5. Operator and Shift Performance KPIs

### By Melter
- **Average Pour Quality**: Temperature consistency metrics for each `melter_id`.
- **Throughput per Melter**: Pours and total weight by `melter_id`.
- **Process Compliance Rate**: Track adherence to key parameters per melter.

### By Shift
- **Shift Production Volume**: Total weight and pour count per shift.
- **Shift Quality Score**: Composite metric combining temperature, weight, and parameter variances.
- **First Pour Success Rate**: Evaluate quality outcomes for each shift's initial pour.

## 6. Material and Process KPIs

### Additives and Treatments
- **Liquid Usage Efficiency**: `liquid_amount` per pound of cast output, segmented by `liquid_type`.
- **Rice Hulls Consumption**: Track `rice_hulls_amount` usage trends.
- **Bath Weight Management**: Monitor `bath_weight_carried_in` to optimize carryover.

### Wash Process
- **Wash Application Consistency**: Analyze `wash_pass` counts and `wash_thickness` distribution.
- **Wash Type Effectiveness**: Compare `wash_type` (e.g., ASG 600, 5010) with quality results.

## 7. Grade-Specific KPIs
- **CAT3 Performance**: Target temperature 2,930–2,940°F, standard `die_rpm` 875, and associated cost trends.
- **440-C Performance**: Monitor high-cost grade metrics.
- **CA-15/CA-40 Performance**: Validate adherence to process parameters.

## 8. Advanced Analytics Opportunities
- **Out-of-Spec Prediction**: Use features such as `tap_temp` variance and `die_temp_before_pour` for predictive alerts.
- **Equipment Maintenance Triggers**: Detect degrading performance trends by furnace or die.
- **Cost Escalation Alerts**: Identify unusual `cost_per_pound` spikes by grade.
- **Correlation Analysis**: Explore relationships between temperature, RPM, wash parameters, and quality outcomes.

## Next Steps
- Prioritize KPI development based on stakeholder needs.
- Align data modeling to ensure the required fields are captured and cleansed.
- Integrate selected KPIs into dashboard refresh routines (e.g., `refresh_all_kpis`).
