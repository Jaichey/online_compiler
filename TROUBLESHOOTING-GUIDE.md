# Highlights Auto-Update Troubleshooting Guide

## Problem: Solved Problems Not Showing in Highlights (0 Problems)

You've solved 5 problems in the compiler, but highlights shows 0. This means the trigger isn't updating the highlights table.

## Step-by-Step Fix

### Step 1: Check & Add the Column (5 minutes)

Run this in your **Supabase SQL Editor**:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'highlights' AND column_name = 'solved_problems';
```

If you see **NO RESULTS**, the column is missing. Run this to add it:

```sql
ALTER TABLE public.highlights
ADD COLUMN IF NOT EXISTS solved_problems jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_highlights_solved_problems ON public.highlights USING GIN (solved_problems);
```

### Step 2: Check if Trigger Exists (2 minutes)

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'submissions';
```

Should see: `trigger_update_highlights | submissions`

If **NO RESULTS**, continue to Step 3.

### Step 3: Create/Recreate the Trigger Function (5 minutes)

Copy the **entire** `DIAGNOSTIC-AND-FIX.sql` file content from line starting with "-- Then create/recreate the trigger function" through the end of the function creation (up to the CREATE TRIGGER statement).

Or run this complete block:

```sql
DROP TRIGGER IF EXISTS trigger_update_highlights ON public.submissions;

CREATE OR REPLACE FUNCTION public.update_highlights_on_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_month text;
    current_year integer;
    month_key text;
    user_highlight_id uuid;
    solved_problems jsonb;
BEGIN
    IF NEW.is_correct = true THEN
        current_month := to_char(now(), 'FMMonth');
        current_year := extract(year from now());
        month_key := format('%s-%s', current_month, current_year);

        SELECT id INTO user_highlight_id FROM public.highlights
        WHERE user_id = NEW.user_id AND month = month_key;

        IF user_highlight_id IS NULL THEN
            INSERT INTO public.highlights (user_id, month, title, description, completed_count, top_users, solved_problems)
            VALUES (
                NEW.user_id,
                month_key,
                format('%s %s Highlights', current_month, current_year),
                format('Monthly highlights for %s %s', current_month, current_year),
                1,
                '[]'::jsonb,
                jsonb_build_array(
                    jsonb_build_object(
                        'program_id', NEW.program_id,
                        'code', NEW.code,
                        'solved_at', NOW(),
                        'test_cases_passed', 5
                    )
                )
            );
        ELSE
            SELECT COALESCE(solved_problems, '[]'::jsonb) INTO solved_problems
            FROM public.highlights
            WHERE id = user_highlight_id;

            solved_problems := solved_problems || jsonb_build_array(
                jsonb_build_object(
                    'program_id', NEW.program_id,
                    'code', NEW.code,
                    'solved_at', NOW(),
                    'test_cases_passed', 5
                )
            );

            UPDATE public.highlights
            SET 
                completed_count = completed_count + 1,
                solved_problems = solved_problems,
                updated_at = NOW()
            WHERE id = user_highlight_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_highlights
AFTER INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_highlights_on_submission();
```

### Step 4: Verify It's Working (2 minutes)

Run diagnostic query:

```sql
SELECT 
    h.id,
    h.user_id,
    h.month,
    h.completed_count,
    jsonb_array_length(COALESCE(h.solved_problems, '[]'::jsonb)) as problems_stored,
    h.updated_at
FROM public.highlights h
WHERE h.month = to_char(now(), 'FMMonth') || '-' || extract(year from now())
ORDER BY h.updated_at DESC;
```

You should see your highlights with:
- `completed_count` > 0
- `problems_stored` > 0

### Step 5: Backfill Existing Problems (Optional but Recommended)

Since you've already solved 5 problems, we need to create a highlight entry and add those solutions.

**First**, check which submissions are marked as correct:

```sql
SELECT id, user_id, program_id, code, is_correct, submitted_at
FROM public.submissions
WHERE user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
AND is_correct = true
ORDER BY submitted_at DESC;
```

**Then**, manually create/update the January 2026 highlight for your user:

```sql
-- First, delete the old empty one if it exists
DELETE FROM public.highlights
WHERE user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
AND month = 'January-2026'
AND completed_count = 0;

-- Now insert with all solved problems
INSERT INTO public.highlights (user_id, month, title, description, completed_count, top_users, solved_problems)
SELECT 
    'ae6f1cad-3a73-464b-9431-fa41dc4357ec' as user_id,
    'January-2026' as month,
    'January 2026 Highlights' as title,
    'Your highlights for January 2026' as description,
    COUNT(*) as completed_count,
    '[]'::jsonb as top_users,
    jsonb_agg(
        jsonb_build_object(
            'program_id', program_id,
            'code', code,
            'solved_at', submitted_at,
            'test_cases_passed', 5
        )
        ORDER BY submitted_at DESC
    ) as solved_problems
FROM public.submissions
WHERE user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
AND is_correct = true
AND submitted_at >= '2026-01-01'::date
AND submitted_at < '2026-02-01'::date;
```

### Step 6: Test New Submissions (5 minutes)

1. Go to **Compiler** page
2. Solve a NEW problem (submit code that passes all tests)
3. Go to **Highlights** page
4. Click on **January 2026 Highlights** → "Read More"
5. You should see:
   - "Your Latest Solution" section with your code
   - Problem title, language, test cases passed
   - Code preview

## Debugging Checklist

- [ ] Column `solved_problems` exists in highlights table (check with first diagnostic query)
- [ ] Trigger `trigger_update_highlights` exists (check with second diagnostic query)
- [ ] Function `update_highlights_on_submission` exists and has no syntax errors
- [ ] RLS policies on highlights allow updates (should see "Users can update their own highlights")
- [ ] Submissions table has `is_correct` column marked as `true` for passed solutions
- [ ] User_id in localStorage matches auth.users.id

## Common Issues

### Issue 1: "Permission denied for schema public"
**Solution:** Make sure the function has `SECURITY DEFINER` - it's already in the code above.

### Issue 2: "Column solved_problems does not exist"
**Solution:** Run Step 1 above to add the column.

### Issue 3: Trigger still not firing after new submission
**Solution:** 
1. Check that `is_correct = true` is being set when you submit
2. Verify user_id is being stored correctly in submissions
3. Manually test with INSERT query from Step 4

### Issue 4: Highlights show 0 completed_count but old data exists
**Solution:** Run the backfill query in Step 5 to recreate with solved problems.

## After All Steps Complete

1. ✅ Refresh highlights page (Ctrl+Shift+R for hard refresh)
2. ✅ You should see completed_count > 0 on the January 2026 card
3. ✅ Click "Read More" → should see solved problem preview
4. ✅ Solve a new problem → highlights should update automatically
5. ✅ Done! The system is now working.

## Need More Help?

Run all diagnostic queries from `DIAGNOSTIC-AND-FIX.sql` and share the results - this will show exactly where the issue is.

**Key diagnostic query** (shows everything):
```sql
SELECT 
    'Submissions' as check_item,
    COUNT(*) as count,
    COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_count
FROM public.submissions
WHERE user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
UNION ALL
SELECT 
    'Highlights for Jan 2026',
    COUNT(*),
    COALESCE(MAX(completed_count), 0)
FROM public.highlights
WHERE user_id = 'ae6f1cad-3a73-464b-9431-fa41dc4357ec'
AND month = 'January-2026';
```

If this shows:
- Submissions: 5 correct, Highlights: 0 completed → Trigger not working (run Step 3)
- Submissions: 5 correct, Highlights: 5 completed → ✅ Working perfectly!
