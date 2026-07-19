import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Sin esto, un error de JS no capturado en cualquier parte del árbol
// (ej. el ReferenceError que dejó /buscar en blanco) tira abajo TODA la
// app y el usuario ve una pantalla en blanco sin ninguna explicación,
// como pasó. Con este componente envolviendo <Routes>, ese mismo error
// muestra esta pantalla en vez de blanco — no arregla el bug de fondo,
// pero evita que el usuario se quede sin ninguna salida.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: cuando se integre Sentry (ya pendiente en el backlog), mandar
    // el error acá en vez de (o además de) console.error.
    console.error("Error no capturado:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Algo salió mal
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Encontramos un error inesperado. Podés intentar recargar la página o volver al inicio.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReload} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recargar
            </Button>
            <Link to="/">
              <Button variant="hero" className="gap-2">
                <Home className="h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
