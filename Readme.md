-- Table for Programs
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  language_id integer not null,
  test_cases jsonb not null,
  created_at timestamp default now()
);

-- Table for Submissions
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  program_id uuid references programs(id) on delete cascade,
  code text not null,
  output text,
  is_correct boolean default false,
  submitted_at timestamp default now()
);

-- Table for Users (basic structure)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text,  -- Optional: only if using custom auth
  created_at timestamp default now()
);

ALTER TABLE users
ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

# To add admin
INSERT INTO users (id, email, role)
VALUES (
  'PUT-USER-ID-HERE', -- from the Authentication tab
  'admin@example.com',
  'admin'
);

