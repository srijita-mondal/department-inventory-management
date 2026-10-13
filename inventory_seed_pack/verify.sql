-- Run after schema.sql and seed.sql to confirm seed counts and stock consistency.
SELECT d.short_code, d.name, COUNT(DISTINCT sp.id) AS students
FROM departments d LEFT JOIN student_profiles sp ON sp.department_id=d.id
GROUP BY d.id, d.short_code, d.name ORDER BY d.id;

SELECT d.short_code, COUNT(i.id) AS inventory_catalogue_records,
       COUNT(i.id) FILTER (WHERE i.tracking_type='INDIVIDUAL') AS individual_item_types,
       COUNT(i.id) FILTER (WHERE i.tracking_type='QUANTITY') AS quantity_item_types
FROM departments d LEFT JOIN inventory_items i ON i.department_id=d.id
GROUP BY d.id, d.short_code ORDER BY d.id;

SELECT d.short_code, COUNT(a.id) AS individual_assets
FROM departments d LEFT JOIN assets a ON a.department_id=d.id
GROUP BY d.id, d.short_code ORDER BY d.id;

SELECT department_name, item_code, item_name, tracking_type, total_quantity,
       available_quantity, issued_quantity, overdue_quantity, damaged_quantity,
       lost_quantity, maintenance_quantity
FROM v_inventory_summary ORDER BY department_name, item_code;

SELECT enrolment_number, admission_year, course_code, roll_number
FROM student_profiles ORDER BY department_id, roll_number;