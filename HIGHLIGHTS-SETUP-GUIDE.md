# Highlights Auto-Update System - Setup Guide

## Overview
This system automatically updates highlights when users solve problems, displays random solved problems in the modal, and tracks progress throughout the month.

## Setup Steps

### 1. Add solved_problems Column to Highlights Table
Run this in your Supabase SQL editor:

```sql
ALTER TABLE public.highlights
ADD COLUMN IF NOT EXISTS solved_problems jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_highlights_solved_problems ON public.highlights USING GIN (solved_problems);
CREATE INDEX IF NOT EXISTS idx_highlights_completed_count ON public.highlights(completed_count DESC);
```

### 2. Create Trigger Function for Auto-Updates
Run the entire content of `highlights-trigger-function.sql` in your Supabase SQL editor.

This creates:
- `update_highlights_on_submission()` - Automatically increments completed_count and stores solved code when a submission is correct
- `get_solved_problems()` - Fetches solved problems from a highlight
- `get_random_solved_problem()` - Gets a random solved problem for display

### 3. Verify Setup

After running the SQL, check that everything is working:

```sql
-- Check if solved_problems column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'highlights' AND column_name = 'solved_problems';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'submissions';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%solved%';

-- View highlights with solved problems
SELECT id, user_id, month, title, completed_count, 
       jsonb_array_length(solved_problems) as problems_solved,
       updated_at
FROM public.highlights
WHERE completed_count > 0
ORDER BY updated_at DESC;
```

### 4. How It Works

**When a user submits a correct solution:**
1. Submission record is inserted into `submissions` table with `is_correct = true`
2. Trigger `trigger_update_highlights` fires
3. Function `update_highlights_on_submission()` executes:
   - Gets current month (e.g., "January-2026")
   - Finds or creates highlight for user + month
   - Increments `completed_count` by 1
   - Appends solved problem to `solved_problems` array with code, timestamp, and test results
   - Updates `updated_at` timestamp

**When viewing highlights modal:**
1. Page fetches all highlights for current user (RLS policies enforce this)
2. When modal opens, `displaySolvedProblems()` function:
   - Gets array of solved_problems from highlight
   - Selects random problem from array
   - Fetches problem details (title, language) from programs table
   - Displays code preview with test cases passed and solve date
   - Shows interactive solved problem example

### 5. Data Structure

**solved_problems array format:**
```jsonb
[
  {
    "program_id": "918c7ccc-7532-4751-a2d9-a73de13153a1",
    "code": "def main():\n    a,b = map(int , input().split())\n    print(a+b)\n...",
    "solved_at": "2026-01-01T09:44:56.370Z",
    "test_cases_passed": 5
  },
  {
    "program_id": "...",
    "code": "...",
    "solved_at": "2026-01-01T10:20:15.250Z",
    "test_cases_passed": 5
  }
]
```

### 6. Example Query to Test

```sql
-- Get a user's highlights with solved problems count
SELECT 
    h.id,
    h.user_id,
    h.month,
    h.title,
    h.completed_count,
    jsonb_array_length(h.solved_problems) as actual_solved,
    h.solved_problems
FROM public.highlights h
WHERE h.user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
ORDER BY h.month DESC;

-- Get most recent solved problem from a highlight
SELECT 
    (item->>'program_id')::uuid as program_id,
    item->>'code' as code,
    (item->>'solved_at')::timestamp as solved_at,
    (item->>'test_cases_passed')::integer as test_cases_passed
FROM public.highlights h,
     jsonb_array_elements(h.solved_problems) as item
WHERE h.user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
ORDER BY (item->>'solved_at')::timestamp DESC
LIMIT 1;
```

### 7. Features

✅ **Auto-increment Problems**: Completed count increases automatically when correct submission is made
✅ **Store Solved Code**: Full code solution stored with each solved problem
✅ **Random Display**: Modal shows a random solved problem each time (for variety)
✅ **Problem Details**: Shows problem title, language, test cases passed, and solve date
✅ **Code Preview**: Interactive code display with syntax highlighting
✅ **Per-User Tracking**: Each user only sees their own solved problems (RLS enforced)
✅ **Monthly Separation**: Highlights track month-by-month progress
✅ **Timestamp Tracking**: Records exact time each problem was solved

### 8. Frontend Display

The highlights modal now shows:

1. **Statistics Section**
   - Problems Completed: Auto-incremented count
   - Top Performers: List of top users

2. **Your Latest Solution** (NEW)
   - Random solved problem display
   - Problem title with checkmark icon
   - Language used (C++, Python, Java, etc.)
   - Test cases passed badge
   - Solve date in readable format
   - Full code preview with syntax formatting

3. **Top Performers**
   - List of top performers (existing)

### 9. Troubleshooting

**Highlights not updating after submission:**
- Check if trigger exists: `SELECT trigger_name FROM information_schema.triggers;`
- Verify `solved_problems` column exists: `\d public.highlights`
- Check submission is marked as `is_correct = true`

**Code not displaying in modal:**
- Ensure code was stored in `solved_problems` array
- Check if program_id is valid in programs table
- Verify no circular JSON parsing issues

**RLS blocking reads:**
- Ensure user_id in localStorage matches auth.users.id
- Check RLS policies allow SELECT for current user
- Test with raw Supabase query to isolate RLS issue

### 10. Next Steps

- Deploy files to Vercel
- Test with actual submissions
- Monitor trigger performance (add ANALYZE if needed)
- Consider caching solved_problems in localStorage for offline viewing
- Add export feature to let users download their solved code

---

**Files Modified:**
- `highlights-setup.sql` - Schema changes
- `highlights-trigger-function.sql` - Trigger and functions
- `highlights.html` - Display logic
- `highlights.css` - Styling for solved problems section
