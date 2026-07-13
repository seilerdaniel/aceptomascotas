-- The pet_services INSERT policy only checked auth.uid() = user_id, not
-- the account's role — meaning any account type (buscador, propietario,
-- agencia) could insert a service directly, bypassing the "proveedor only"
-- rule that PublishServicePage.tsx only enforces client-side. Same class
-- of gap found and fixed for properties.creation this session.
DROP POLICY IF EXISTS "Authenticated users can create services" ON public.pet_services;

CREATE POLICY "Only proveedor accounts can create services"
ON public.pet_services FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.user_type = 'proveedor'
  )
);
