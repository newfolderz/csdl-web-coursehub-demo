BEGIN;

ALTER TABLE enrollment_events
ADD COLUMN IF NOT EXISTS note VARCHAR(200);

INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Add optional note to enrollment events')
ON CONFLICT (version) DO UPDATE
SET description = EXCLUDED.description;

COMMIT;

