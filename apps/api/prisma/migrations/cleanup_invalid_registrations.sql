-- Cleanup script to remove invalid event registrations
-- This removes registrations where athlete gender/category doesn't match event gender/category

-- First, let's see what we're about to delete (for logging)
SELECT 
    er.id as registration_id,
    a.name as athlete_name,
    a.gender as athlete_gender,
    a.category as athlete_category,
    e.name as event_name,
    e.gender as event_gender,
    e.category as event_category
FROM event_registrations er
JOIN athletes a ON er."athleteId" = a.id
JOIN events e ON er."eventId" = e.id
WHERE a.gender != e.gender OR a.category != e.category;

-- Delete invalid registrations
DELETE FROM event_registrations
WHERE id IN (
    SELECT er.id
    FROM event_registrations er
    JOIN athletes a ON er."athleteId" = a.id
    JOIN events e ON er."eventId" = e.id
    WHERE a.gender != e.gender OR a.category != e.category
);

-- Report how many were deleted
SELECT 'Cleanup complete. Invalid registrations removed.' as status;
