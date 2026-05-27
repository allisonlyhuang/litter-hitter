-- RecycleRumble Supabase Schema Setup
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    character TEXT NOT NULL DEFAULT 'frog',
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    points INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - optional for hackathon but good practice, here we'll keep it simple:
-- Allow anyone to select, insert, update profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

-- 2. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    item_name TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anyone to select and insert submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);

-- 3. Create Supabase Storage Bucket for recycling photos
-- Note: You should manually create a public bucket named "recycling-photos" in the Supabase Storage dashboard,
-- or run the following SQL if your Supabase setup supports storage system schemas:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('recycling-photos', 'recycling-photos', true);
