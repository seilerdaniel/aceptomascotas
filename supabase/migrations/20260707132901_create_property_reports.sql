-- Create property_reports table for the "report a listing" feature
CREATE TABLE public.property_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_reports
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a report (public "report listing" flow, no login required)
CREATE POLICY "Anyone can submit a property report"
ON public.property_reports FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view reports
CREATE POLICY "Admins can view property reports"
ON public.property_reports FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update report status (pending -> reviewed/dismissed)
CREATE POLICY "Admins can update property reports"
ON public.property_reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete reports
CREATE POLICY "Admins can delete property reports"
ON public.property_reports FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Index to quickly find reports for a given property, and to sort pending ones
CREATE INDEX idx_property_reports_property_id ON public.property_reports(property_id);
CREATE INDEX idx_property_reports_status ON public.property_reports(status);
