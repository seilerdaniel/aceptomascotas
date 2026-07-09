-- New account type for people who only want to offer a pet service
-- (vets, dog walkers, groomers, etc.) without the unrelated buscador/
-- propietario/agencia UI (favorites, pets, property listings) cluttering
-- their account.
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'proveedor';
