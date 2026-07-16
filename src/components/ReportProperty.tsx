import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getClientIdentifier } from "@/lib/clientIdentifier";

interface ReportPropertyProps {
  propertyId: string;
}

const REPORT_REASONS = [
  { value: "info_falsa", label: "La información publicada es falsa o engañosa" },
  { value: "no_pet_friendly", label: "En realidad no acepta mascotas" },
  { value: "no_disponible", label: "La propiedad ya no está disponible" },
  { value: "contenido_inapropiado", label: "Contenido inapropiado o spam" },
  { value: "otro", label: "Otro motivo" },
];

const ReportProperty = ({ propertyId }: ReportPropertyProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Elegí un motivo para el reporte");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_property_report", {
        p_identifier: getClientIdentifier(),
        p_property_id: propertyId,
        p_reason: reason,
        p_details: details.trim() || null,
      });

      if (error) {
        if (error.message?.includes("rate_limited")) {
          toast.error("Ya enviaste varios reportes. Probá de nuevo en un rato.");
          return;
        }
        throw error;
      }

      toast.success("Gracias por avisarnos. Vamos a revisar la publicación.");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("No se pudo enviar el reporte. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Flag className="h-4 w-4" />
          Reportar publicación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Reportar esta publicación
          </DialogTitle>
          <DialogDescription>
            Contanos qué está mal. Revisamos todos los reportes antes de tomar una acción.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="font-normal cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="details">Detalles (opcional)</Label>
            <Textarea
              id="details"
              placeholder="Contanos más sobre lo que encontraste..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <Button
            variant="hero"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar reporte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportProperty;
