import type { Json } from "@/integrations/supabase/types";

// Etiquetas conocidas para las claves que ya se loguean hoy (ver
// logAdminAction() en los distintos mutation hooks). Cualquier clave
// nueva que aparezca en el futuro sin entrada acá se muestra igual, con
// una etiqueta genérica derivada del nombre del campo — no hace falta
// tocar este componente para que un campo nuevo se vea razonable.
const FIELD_LABELS: Record<string, string> = {
  status: "Nuevo estado",
};

// Traducciones conocidas para valores de estado específicos (ver
// ReportStatus en src/types/admin.ts). Un valor no mapeado se muestra
// tal cual viene.
const STATUS_VALUE_LABELS: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  dismissed: "Descartado",
};

const formatFieldLabel = (key: string): string =>
  FIELD_LABELS[key] ??
  key
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

const formatFieldValue = (key: string, value: Json): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (key === "status" && typeof value === "string") {
    return STATUS_VALUE_LABELS[value] ?? value;
  }
  return String(value);
};

interface ActionLogDetailsProps {
  details: Json | null;
}

// Reemplaza JSON.stringify(entry.details) por una lista "Etiqueta: valor"
// legible. Si en el futuro se loguean más campos (ej. "estado anterior" /
// "estado nuevo" en vez de solo "status"), alcanza con agregar la clave a
// FIELD_LABELS/STATUS_VALUE_LABELS de arriba — el resto ya es genérico.
const ActionLogDetails = ({ details }: ActionLogDetailsProps) => {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const entries = Object.entries(details);
  if (entries.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <ul className="space-y-0.5">
      {entries.map(([key, value]) => (
        <li key={key} className="text-xs">
          <span className="text-muted-foreground">{formatFieldLabel(key)}:</span>{" "}
          <span className="font-medium">{formatFieldValue(key, value as Json)}</span>
        </li>
      ))}
    </ul>
  );
};

export default ActionLogDetails;
