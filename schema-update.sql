-- Enhanced Users Table Schema
-- Run this SQL in your Supabase SQL Editor to add profile fields

-- Add new profile columns to existing users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Optional: Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Updated table structure:
/*
create table public.users (
  id uuid not null default gen_random_uuid(),
  email text not null unique,
  password text null,
  created_at timestamp without time zone null default now(),
  role text null default 'user'::text,
  
  -- New Profile Fields
  full_name text,
  bio text,
  profile_picture_url text,
  phone text,
  location text,
  occupation text,
  institution text,
  linkedin_url text,
  github_url text,
  updated_at timestamp default now(),
  
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_role_check check ((role = any (array['user'::text, 'admin'::text])))
) TABLESPACE pg_default;
*/
