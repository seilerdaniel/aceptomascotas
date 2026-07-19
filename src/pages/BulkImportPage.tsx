import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, Loader2, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

// Columns expected in the CSV template. petTypes and images use ";" as a
// sub-separator since "," is already the column separator.
const CSV_COLUMNS = [
  "title",
  "description",
  "price",
  "propertyType",
  "location",
  "address",
  "petTypes",
  "contactName",
  "contactPhone",
  "contactEmail",
  "images",
];

const TEMPLATE_EXAMPLE_ROW = [
  "Depto 2 ambientes en Palermo, luminoso y pet-friendly",
  "A dos cuadras del parque, ideal para mascotas",
  "150000",
  "departamento",
  "Palermo, CABA",
  "Av. Santa Fe 1234",
  "perro;gato",
  "Inmobiliaria Ejemplo",
  "+54 9 11 1234-5678",
  "contacto@inmobiliariaejemplo.com",
  "",
];

interface ParsedRow {
  [key: string]: string;
}

interface RowResult {
  row: number;
  success: boolean;
  error?: string;
}

// Minimal CSV parser supporting quoted fields with embedded commas.
// Avoids adding an extra dependency (papaparse) for a template this simple.
function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map((v) => v.trim());
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: ParsedRow = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });
}

function downloadCsvTemplate() {
  const csvContent = [CSV_COLUMNS.join(","), TEMPLATE_EXAMPLE_ROW.map((v) => `"${v}"`).join(",")].join(
    "\n"
  );
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "acepto-mascotas-plantilla-import.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const BulkImportPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("El archivo debe ser un .csv");
      return;
    }

    setFileName(file.name);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error("El archivo no tiene filas para importar");
        return;
      }
      if (parsed.length > 50) {
        toast.error("Máximo 50 propiedades por importación");
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (rows.length === 0) return;

    setImporting(true);
    setResults(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Tu sesión expiró. Iniciá sesión nuevamente.");
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("bulk-create-properties", {
        body: { rows },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al importar");
      }

      const { imported, total, results: rowResults } = response.data;
      setResults(rowResults);
      trackEvent("bulk_properties_imported", { imported, total });

      if (imported === total) {
        toast.success(`¡Se importaron las ${imported} propiedades correctamente!`);
      } else {
        toast.warning(`Se importaron ${imported} de ${total} propiedades. Revisá los errores abajo.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al importar las propiedades";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Importar propiedades por CSV" description="Importá varias propiedades a la vez." path="/publicar/importar" noIndex />
      <Header />
        <main className="flex-1 container py-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (profile?.user_type !== "agencia") {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Importar propiedades por CSV" description="Importá varias propiedades a la vez." path="/publicar/importar" noIndex />
      <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Import disponible solo para agencias
          </h1>
          <p className="text-muted-foreground mb-6">
            Esta herramienta está pensada para inmobiliarias que necesitan publicar varias propiedades a la vez.
          </p>
          <Button variant="outline" onClick={() => navigate("/publicar")}>
            Publicar una propiedad
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Importar propiedades por CSV" description="Importá varias propiedades a la vez." path="/publicar/importar" noIndex />
      <Header />

      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Importar propiedades por CSV
            </h1>
            <p className="text-muted-foreground">
              Publicá varias propiedades a la vez completando una planilla, en vez de cargarlas una por una.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                1. Descargá la plantilla
              </CardTitle>
              <CardDescription>
                Completá una fila por propiedad. Para varios tipos de mascota o varias imágenes, separalos con punto y coma ( ; ).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={downloadCsvTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar plantilla CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                2. Subí tu archivo completado
              </CardTitle>
              <CardDescription>
                Máximo 50 propiedades por importación. Vas a poder revisar el resultado antes de confirmar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary transition-colors">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {fileName || "Hacé clic para elegir tu archivo .csv"}
                </span>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>

              {rows.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Se encontraron <strong>{rows.length}</strong> propiedades en el archivo. Revisá antes de confirmar:
                  </p>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Mascotas</TableHead>
                          {results && <TableHead>Estado</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => {
                          const rowResult = results?.find((r) => r.row === i + 1);
                          return (
                            <TableRow key={i}>
                              <TableCell className="max-w-[200px] truncate">{row.title}</TableCell>
                              <TableCell>{row.location}</TableCell>
                              <TableCell>{row.price}</TableCell>
                              <TableCell>{row.petTypes}</TableCell>
                              {results && (
                                <TableCell>
                                  {rowResult?.success ? (
                                    <Badge className="gap-1 bg-primary">
                                      <CheckCircle2 className="h-3 w-3" />
                                      OK
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="gap-1">
                                      <XCircle className="h-3 w-3" />
                                      {rowResult?.error || "Error"}
                                    </Badge>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {!results && (
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handleImport}
                      disabled={importing}
                    >
                      {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar e importar {rows.length} propiedades
                    </Button>
                  )}

                  {results && (
                    <Button variant="outline" className="w-full" onClick={() => navigate("/perfil")}>
                      Ver mis propiedades
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BulkImportPage;
