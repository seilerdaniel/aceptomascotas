import { useMemo, useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const BASE_URL = "https://aceptomascotas.vercel.app";

const DESTINATION_PATHS = [
  { value: "/", label: "Home" },
  { value: "/buscar", label: "Buscar alquileres" },
  { value: "/publicar", label: "Publicar propiedad" },
];

// Consistent source/medium pairs per outreach channel, so campaign
// reports in GA4 aren't fragmented by inconsistent naming.
const SOURCE_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", medium: "outreach" },
  { value: "facebook_groups", label: "Grupos de Facebook", medium: "social" },
  { value: "instagram", label: "Instagram", medium: "social" },
  { value: "email", label: "Email", medium: "email" },
  { value: "zonaprop", label: "ZonaProp", medium: "referral" },
  { value: "otro", label: "Otro", medium: "referral" },
];

const UtmLinkGenerator = () => {
  const [path, setPath] = useState(DESTINATION_PATHS[0].value);
  const [source, setSource] = useState(SOURCE_OPTIONS[0].value);
  const [campaign, setCampaign] = useState("validacion-90-dias");

  const medium = SOURCE_OPTIONS.find((s) => s.value === source)?.medium || "referral";

  const generatedUrl = useMemo(() => {
    const params = new URLSearchParams({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign || "sin-campana",
    });
    return `${BASE_URL}${path}?${params.toString()}`;
  }, [path, source, medium, campaign]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar. Copialo manualmente.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Generador de links para outreach
        </CardTitle>
        <CardDescription>
          Genera links con UTM consistentes para saber en GA4 qué canal trae más resultados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Página de destino</Label>
            <Select value={path} onValueChange={setPath}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESTINATION_PATHS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Canal</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Campaña</Label>
            <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="ej: validacion-90-dias" />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-3">
          <code className="flex-1 text-sm break-all">{generatedUrl}</code>
          <Button variant="outline" size="icon" aria-label="Copiar link" onClick={handleCopy} className="shrink-0">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UtmLinkGenerator;
