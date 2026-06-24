-- Change default approval for service_reviews to false (require moderation)
ALTER TABLE public.service_reviews ALTER COLUMN is_approved SET DEFAULT false;

-- Add unique constraint to prevent duplicate reviews from same authenticated user per service
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_service_review 
ON public.service_reviews(service_id, user_id) 
WHERE user_id IS NOT NULL;