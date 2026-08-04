import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("shows the title and description", () => {
    render(
      <EmptyState
        icon={Search}
        title="No encontramos propiedades"
        description="Intentá ajustar los filtros"
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "No encontramos propiedades" })).toBeInTheDocument();
    expect(screen.getByText("Intentá ajustar los filtros")).toBeInTheDocument();
  });

  it("renders the action node", () => {
    render(
      <EmptyState icon={Search} title="Lista vacía" action={<button>Limpiar</button>} />
    );

    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });

  it("has a heading with the accessible name for screen readers", () => {
    render(<EmptyState icon={Search} title="Vacío" />);

    expect(screen.getByRole("heading", { name: "Vacío" })).toBeInTheDocument();
  });
});