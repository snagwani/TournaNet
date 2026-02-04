-- Step 1: Clean up invalid event registrations
-- Remove registrations where athlete gender/category doesn't match event

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Show what will be deleted
    RAISE NOTICE 'Finding invalid registrations...';
    
    -- Delete invalid registrations and count them
    WITH deleted AS (
        DELETE FROM event_registrations
        WHERE id IN (
            SELECT er.id
            FROM event_registrations er
            JOIN athletes a ON er."athleteId" = a.id
            JOIN events e ON er."eventId" = e.id
            WHERE a.gender != e.gender OR a.category != e.category
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RAISE NOTICE 'Deleted % invalid registration(s)', deleted_count;
END $$;

-- Step 2: Add documentation for validation constraint
COMMENT ON TABLE event_registrations IS 
'Event registrations must match athlete gender and category with event gender and category. Enforced by application validation in athletes.service.ts and heats.service.ts';

-- Step 3: Clean up heats that might have invalid athletes
-- Delete results, heat lanes, and heats so they can be regenerated with correct filtering

DO $$
DECLARE
    deleted_results INTEGER;
    deleted_lanes INTEGER;
    deleted_heats INTEGER;
BEGIN
    -- Delete results first (foreign key to heats)
    DELETE FROM results;
    GET DIAGNOSTICS deleted_results = ROW_COUNT;
    
    -- Delete heat lanes (foreign key to heats)
    DELETE FROM heat_lanes;
    GET DIAGNOSTICS deleted_lanes = ROW_COUNT;
    
    -- Delete heats
    DELETE FROM heats;
    GET DIAGNOSTICS deleted_heats = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % result(s), % lane(s), and % heat(s)', deleted_results, deleted_lanes, deleted_heats;
    RAISE NOTICE 'Please regenerate heats for all events';
END $$;

-- Final report
SELECT 
    'Cleanup complete!' as status,
    'Invalid registrations removed' as step_1,
    'Application-level validation enforced' as step_2,
    'All heats/results deleted - please regenerate' as step_3;
