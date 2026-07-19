import { lazy, type ComponentType } from "react";

// Sin esto: si alguien tiene el sitio abierto en una pestaña y mientras
// tanto se hace un deploy nuevo, el JS que ya está corriendo en esa
// pestaña sigue siendo el viejo. Si esa persona navega (client-side, sin
// recargar) a una ruta que todavía no se descargó, React intenta pedir
// el chunk correspondiente — pero el nombre de archivo cambia en cada
// build, así que ese chunk viejo ya no existe en el servidor: 404, la
// promesa de import() rechaza, y sin manejo la pantalla queda en blanco.
//
// Este helper reintenta una vez y, si sigue fallando, fuerza un reload
// completo de la página (que sí trae el index.html nuevo con las
// referencias correctas) — una sola vez POR CHUNK (no una sola vez para
// todo el sitio), usando sessionStorage para no caer en un loop de
// recargas infinitas si el problema fuera otro. Antes la bandera era
// global: si /auth fallaba y el reload no alcanzaba a arreglarlo del
// todo, esa misma bandera bloqueaba el reintento de /favoritos (un
// chunk totalmente distinto) más tarde en la misma sesión.
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  chunkName: string
) {
  return lazy(async () => {
    const storageKey = `chunk-reload-attempted:${chunkName}`;
    try {
      const module = await factory();
      window.sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      const alreadyAttempted = window.sessionStorage.getItem(storageKey) === "true";
      if (!alreadyAttempted) {
        window.sessionStorage.setItem(storageKey, "true");
        window.location.reload();
        // Cuelga la promesa a propósito: la página está a punto de
        // recargar, no hace falta (ni conviene) resolver ni rechazar.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
