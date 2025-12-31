-- Optional: Add difficulty field to programs table
-- This enables proper difficulty tracking in the dashboard

-- Add difficulty column to programs table
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Optional: Update existing programs with difficulty levels
-- You can manually set these based on your requirements

-- Example updates (modify based on your actual program IDs):
-- UPDATE programs SET difficulty = 'easy' WHERE language_id = 71; -- Python problems
-- UPDATE programs SET difficulty = 'medium' WHERE language_id = 62; -- Java problems
-- UPDATE programs SET difficulty = 'hard' WHERE language_id = 54; -- C++ problems

-- Or set manually:
-- UPDATE programs SET difficulty = 'easy' WHERE title LIKE '%Basic%';
-- UPDATE programs SET difficulty = 'hard' WHERE title LIKE '%Advanced%';

COMMENT ON COLUMN public.programs.difficulty IS 'Problem difficulty level: easy, medium, or hard';
