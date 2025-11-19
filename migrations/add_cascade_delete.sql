-- Migration: Add ON DELETE CASCADE to foreign keys referencing example_pins
-- This allows dependent rows to be automatically deleted when a pin is removed.
-- Run this in your Supabase SQL editor or via migration tool.

-- 1. Drop and recreate the foreign key on notifications.pin_id with CASCADE
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_pin_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_pin_id_fkey
  FOREIGN KEY (pin_id)
  REFERENCES public.example_pins(id)
  ON DELETE CASCADE;

-- 2. If you have other tables with pin_id FKs (comments, likes, etc.), add CASCADE for them too:
-- Example for a comments table (uncomment if it exists):
-- ALTER TABLE public.comments
--   DROP CONSTRAINT IF EXISTS comments_pin_id_fkey;
-- ALTER TABLE public.comments
--   ADD CONSTRAINT comments_pin_id_fkey
--   FOREIGN KEY (pin_id)
--   REFERENCES public.example_pins(id)
--   ON DELETE CASCADE;

-- Example for a likes table (uncomment if it exists):
-- ALTER TABLE public.likes
--   DROP CONSTRAINT IF EXISTS likes_pin_id_fkey;
-- ALTER TABLE public.likes
--   ADD CONSTRAINT likes_pin_id_fkey
--   FOREIGN KEY (pin_id)
--   REFERENCES public.example_pins(id)
--   ON DELETE CASCADE;

-- 3. Verify the constraint was updated:
SELECT
  conname AS constraint_name,
  confdeltype AS delete_action
FROM pg_constraint
WHERE conrelid = 'public.notifications'::regclass
  AND conname LIKE '%pin_id%';
-- delete_action should be 'c' (CASCADE) instead of 'a' (NO ACTION) or 'r' (RESTRICT)
