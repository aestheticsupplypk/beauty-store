-- Add province field to parlours table for complete shipping address
ALTER TABLE parlours ADD COLUMN IF NOT EXISTS province TEXT NULL;

COMMENT ON COLUMN parlours.province IS 'Province/state for parlour shipping address';
