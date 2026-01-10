-- ============================================
-- AFFILIATE PROFILE FIELDS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Add address and contact fields
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT;

-- Add payout method fields
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('easypaisa', 'bank_transfer')),
ADD COLUMN IF NOT EXISTS easypaisa_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_iban TEXT;

-- Add profile updated timestamp
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ;
