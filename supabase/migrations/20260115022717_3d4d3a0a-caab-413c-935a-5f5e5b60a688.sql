-- Create enum for service categories
CREATE TYPE public.service_category AS ENUM (
  'veterinaria',
  'veterinaria_24h',
  'seguro',
  'guarderia',
  'adiestrador',
  'paseador',
  'mudanza',
  'ong_refugio',
  'peluqueria',
  'tienda'
);

-- Create table for pet services
CREATE TABLE public.pet_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category service_category NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  images TEXT[] DEFAULT '{}'::TEXT[],
  opening_hours JSONB DEFAULT '{}',
  is_24h BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for service reviews
CREATE TABLE public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.pet_services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pet_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pet_services
-- Anyone can view approved and active services
CREATE POLICY "Approved services are viewable by everyone"
ON public.pet_services
FOR SELECT
USING (is_active = true AND is_approved = true);

-- Users can view their own services (even if not approved)
CREATE POLICY "Users can view their own services"
ON public.pet_services
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create services
CREATE POLICY "Authenticated users can create services"
ON public.pet_services
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own services
CREATE POLICY "Users can update their own services"
ON public.pet_services
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own services
CREATE POLICY "Users can delete their own services"
ON public.pet_services
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can do everything on services
CREATE POLICY "Admins can manage all services"
ON public.pet_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for service_reviews
-- Anyone can view approved reviews
CREATE POLICY "Approved reviews are viewable by everyone"
ON public.service_reviews
FOR SELECT
USING (is_approved = true);

-- Anyone can create reviews (MVP - no login required)
CREATE POLICY "Anyone can create reviews"
ON public.service_reviews
FOR INSERT
WITH CHECK (true);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.service_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.service_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.service_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates on pet_services
CREATE TRIGGER update_pet_services_updated_at
BEFORE UPDATE ON public.pet_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_pet_services_category ON public.pet_services(category);
CREATE INDEX idx_pet_services_city ON public.pet_services(city);
CREATE INDEX idx_pet_services_is_24h ON public.pet_services(is_24h);
CREATE INDEX idx_pet_services_active_approved ON public.pet_services(is_active, is_approved);
CREATE INDEX idx_service_reviews_service_id ON public.service_reviews(service_id);

-- Create a view to get average ratings for services
CREATE OR REPLACE VIEW public.service_ratings AS
SELECT 
  service_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.service_reviews
WHERE is_approved = true
GROUP BY service_id;