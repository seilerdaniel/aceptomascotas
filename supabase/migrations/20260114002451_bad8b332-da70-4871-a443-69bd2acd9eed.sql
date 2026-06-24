-- Create a public view for properties that excludes sensitive contact information
CREATE VIEW public.properties_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    title,
    description,
    location,
    address,
    price,
    property_type,
    pet_types,
    images,
    contact_name,
    -- Mask contact info for public access
    CASE 
      WHEN auth.uid() IS NOT NULL THEN contact_phone
      ELSE NULL
    END as contact_phone,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN contact_email  
      ELSE NULL
    END as contact_email,
    is_active,
    created_at,
    updated_at,
    user_id
  FROM public.properties;