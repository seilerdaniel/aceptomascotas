-- Log de acciones del admin: registra quién aprobó/verificó/eliminó qué
-- y cuándo. Hoy esas acciones (togglear verificación, aprobar servicio,
-- eliminar propiedad, etc.) no dejan ningún rastro — si hay más de un
-- admin, o si algo se borra por error, no hay forma de saber quién lo
-- hizo ni cuándo.

CREATE TABLE public.admin_action_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_action_log_created_at ON public.admin_action_log (created_at DESC);
CREATE INDEX idx_admin_action_log_admin_user_id ON public.admin_action_log (admin_user_id);

ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver el log completo.
CREATE POLICY "Admins can view action log"
ON public.admin_action_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Un admin solo puede insertar registros a su propio nombre (no puede
-- registrar una acción como si la hubiera hecho otro admin).
CREATE POLICY "Admins can log their own actions"
ON public.admin_action_log FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

-- Nadie puede editar ni borrar el log (ni siquiera los admins) — si se
-- pudiera borrar, dejaría de servir como auditoría.
