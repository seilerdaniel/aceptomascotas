const STORAGE_KEY = "am_client_id";

// Identificador anónimo persistido en localStorage, generado una sola vez
// por navegador. No identifica a la persona (no es su email ni su user_id):
// es solo la clave que usa el rate limit del servidor para agrupar
// intentos. Se borra si el usuario limpia el localStorage, lo cual es una
// limitación conocida y aceptable para este nivel de protección (frena
// spam casual, no a un atacante decidido — eso requeriría rate limiting
// por IP en un Edge Function, fuera de alcance por ahora).
export const getClientIdentifier = (): string => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage puede fallar (modo privado, storage lleno, etc.) — en
    // ese caso generamos uno efímero por request en vez de romper el envío.
    return crypto.randomUUID();
  }
};
