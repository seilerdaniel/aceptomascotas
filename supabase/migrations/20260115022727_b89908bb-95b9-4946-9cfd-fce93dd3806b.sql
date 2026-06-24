-- Fix: Drop and recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.service_ratings;

CREATE OR REPLACE VIEW public.service_ratings 
WITH (security_invoker = true)
AS
SELECT 
  service_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.service_reviews
WHERE is_approved = true
GROUP BY service_id;