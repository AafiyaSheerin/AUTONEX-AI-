-- =========================================================================
-- HERMORA AGENTIC COMMERCE & BIOMETRIC AUTHENTICATION SUPABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =========================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    monthly_allowance NUMERIC(10, 2) DEFAULT 150.00,
    monthly_spent NUMERIC(10, 2) DEFAULT 0.00,
    autonomous_limit NUMERIC(10, 2) DEFAULT 15.00,
    face_enrolled BOOLEAN DEFAULT FALSE,
    biometric_locked BOOLEAN DEFAULT FALSE,
    face_id_locked BOOLEAN DEFAULT FALSE,
    passkey_locked BOOLEAN DEFAULT FALSE,
    security_pin TEXT DEFAULT '1234',
    biometric_locked_at TIMESTAMPTZ,
    face_template_id TEXT,
    face_biometric_vector JSONB,
    avatar TEXT,
    last_cycle_month TEXT,
    last_revived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions for existing deployments
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS face_id_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS passkey_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_pin TEXT DEFAULT '1234';

-- 2. FACE AUTHENTICATION & BIOMETRIC LOGS TABLE
-- Stores every biometric enrollment, verification scan, face geometry vector, and spend lock
CREATE TABLE IF NOT EXISTS public.face_auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'ENROLLMENT', 'VERIFICATION', 'LIMIT_LOCK'
    status TEXT NOT NULL,     -- 'MATCH_CONFIRMED', 'REJECTED_MISMATCH', 'ENROLLED'
    confidence_score NUMERIC(5, 2),
    similarity NUMERIC(6, 4),
    audit_hash TEXT,
    face_vector JSONB,
    photo_data TEXT,          -- Base64 or snapshot snippet
    transaction_id TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    product_name TEXT,
    amount_usd NUMERIC(10, 2),
    status TEXT NOT NULL,
    requires_face_id BOOLEAN DEFAULT TRUE,
    face_verified BOOLEAN DEFAULT FALSE,
    biometric_audit_hash TEXT,
    paypal_order_id TEXT,
    paypal_capture_id TEXT,
    audit_log JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_face_logs_email ON public.face_auth_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_face_logs_created_at ON public.face_auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow anon & service-role full access for Hermora backend
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow backend access to users" ON public.users;
    DROP POLICY IF EXISTS "Allow backend access to face_auth_logs" ON public.face_auth_logs;
    DROP POLICY IF EXISTS "Allow backend access to transactions" ON public.transactions;
END $$;

CREATE POLICY "Allow backend access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow backend access to face_auth_logs" ON public.face_auth_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow backend access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Insert Demo User Seed (Aafiya Sheerin)
INSERT INTO public.users (
    id, email, name, password, monthly_allowance, monthly_spent,
    autonomous_limit, face_enrolled, biometric_locked,
    face_template_id, face_biometric_vector, avatar
) VALUES (
    'usr_001',
    'demo@hermora.com',
    'Aafiya Sheerin',
    'hermora123',
    500.00,
    0.00,
    25.00,
    true,
    true,
    'FACE_TMPL_AAFIYA_994',
    '[0.46, 0.38, 0.32, 1.34, 0.88, 0.72, 0.98, 0.05]'::jsonb,
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aafiya'
) ON CONFLICT (email) DO NOTHING;
