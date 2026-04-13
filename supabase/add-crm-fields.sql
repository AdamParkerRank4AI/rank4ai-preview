
-- Add CRM fields to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS marketing_type TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agency_experience TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT 'Jimmy';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS audit_type TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT false;

-- Valid stages: new, contacted, qualified, audit_booked, audit_done, follow_up, won, lost, unqualified, partial
COMMENT ON COLUMN conversations.current_stage IS 'Valid: new, contacted, qualified, audit_booked, audit_done, follow_up, won, lost, unqualified, partial';
