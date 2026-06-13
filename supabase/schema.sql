-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('donor', 'seeker')) NOT NULL,
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    age INTEGER CHECK (age >= 18),
    locality TEXT,
    city TEXT,
    state TEXT,
    availability BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    donation_count INTEGER DEFAULT 0,
    profile_verified BOOLEAN DEFAULT false,
    last_donation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile and all donor profiles" 
ON public.users FOR SELECT 
USING (auth.uid() = id OR role = 'donor');

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Function to handle new user signup (Optional, if we want to auto-create user rows, 
-- but since we have a multi-step form we'll insert manually after signup).

-- ==========================================
-- PHASE 3: REAL-TIME BLOOD REQUESTS & MATCHING
-- ==========================================

-- Create blood_requests table
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender TEXT CHECK (patient_gender IN ('Male', 'Female', 'Other')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')) NOT NULL,
    units_required INTEGER NOT NULL CHECK (units_required > 0),
    hospital_name TEXT NOT NULL,
    hospital_address TEXT NOT NULL,
    locality TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    alternate_contact TEXT,
    priority TEXT CHECK (priority IN ('Normal', 'Urgent', 'Critical')) DEFAULT 'Normal',
    notes TEXT,
    status TEXT CHECK (status IN ('Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create request_responses table
CREATE TABLE IF NOT EXISTS public.request_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE NOT NULL,
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('Pending', 'Accepted', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(request_id, donor_id) -- A donor can only respond once per request
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
-- This requires running in the Supabase SQL editor directly.
-- It adds the tables to the supabase_realtime publication.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ==========================================
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Blood Requests Policies
CREATE POLICY "Anyone can view blood requests" 
ON public.blood_requests FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create blood requests" 
ON public.blood_requests FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own blood requests" 
ON public.blood_requests FOR UPDATE 
USING (auth.uid() = created_by);

-- Request Responses Policies
CREATE POLICY "Anyone can view request responses" 
ON public.request_responses FOR SELECT 
USING (true);

CREATE POLICY "Donors can create responses" 
ON public.request_responses FOR INSERT 
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors and requesters can update responses" 
ON public.request_responses FOR UPDATE 
USING (auth.uid() = donor_id OR auth.uid() IN (SELECT created_by FROM public.blood_requests WHERE id = request_id));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications (and anyone for now)" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications (e.g. mark read)" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- ==========================================
-- PHASE 4: TRUST, VERIFICATION & ACHIEVEMENTS
-- ==========================================

-- 1. Privacy Preferences for Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hide_from_public BOOLEAN DEFAULT false;

-- 2. Verifications Table (e.g. Phone, Identity)
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    verification_type TEXT CHECK (verification_type IN ('phone', 'identity', 'trusted_donor')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, verification_type)
);

-- 3. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_name TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_name)
);

-- 4. Donation Verification Table (QR Code / 2-way confirmation)
CREATE TABLE IF NOT EXISTS public.donation_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE NOT NULL,
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    requester_confirmed BOOLEAN DEFAULT false,
    donor_confirmed BOOLEAN DEFAULT false,
    verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(request_id, donor_id)
);

-- Enable RLS for Phase 4 tables
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_verifications ENABLE ROW LEVEL SECURITY;

-- Verifications Policies
CREATE POLICY "Anyone can view verifications" ON public.verifications FOR SELECT USING (true);
CREATE POLICY "Users can insert own verification" ON public.verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "System inserts achievements" ON public.achievements FOR INSERT WITH CHECK (true); -- Usually system only, keeping open for MVP

-- Donation Verifications Policies
CREATE POLICY "Anyone can view donation verifications" ON public.donation_verifications FOR SELECT USING (true);
CREATE POLICY "Involved parties can insert verifications" ON public.donation_verifications FOR INSERT WITH CHECK (
    auth.uid() = donor_id OR auth.uid() IN (SELECT created_by FROM public.blood_requests WHERE id = request_id)
);
CREATE POLICY "Involved parties can update verifications" ON public.donation_verifications FOR UPDATE USING (
    auth.uid() = donor_id OR auth.uid() IN (SELECT created_by FROM public.blood_requests WHERE id = request_id)
);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_verifications;
