import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdvancedFilters, { type FilterState } from "./AdvancedFilters";

describe("AdvancedFilters", () => {
  const buildFilters = (): FilterState => ({
    minPrice: 0,
    maxPrice: 500000,
    propertyTypes: [],
    petTypes: [],
    amenities: [],
    petSize: "",
    maxPets: "",
    petFee: "",
  });

  const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /Filtros Avanzados/ }));
  };

  it("renders the advanced filter sections", async () => {
    const user = userEvent.setup();
    render(<AdvancedFilters filters={buildFilters()} onFiltersChange={vi.fn()} />);

    await openPanel(user);

    expect(screen.getByText("Rango de Precio")).toBeInTheDocument();
    expect(screen.getByText("Tipo de Propiedad")).toBeInTheDocument();
    expect(screen.getByText("Mascotas Permitidas")).toBeInTheDocument();
    expect(screen.getByText("Detalles pet-friendly")).toBeInTheDocument();
    expect(screen.getByText("Comodidades")).toBeInTheDocument();
  });

  it("toggles a property-type filter and reports it with push mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AdvancedFilters filters={buildFilters()} onFiltersChange={onChange} />);

    await openPanel(user);
    await user.click(screen.getByText("Casa"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ propertyTypes: ["casa"] }),
      "push"
    );
  });

  it("reports max-pets typing with replace mode (continuous input)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AdvancedFilters filters={buildFilters()} onFiltersChange={onChange} />);

    await openPanel(user);
    await user.type(screen.getByLabelText(/Máximo de mascotas/), "2");

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ maxPets: "2" }),
      "replace"
    );
  });

  it("shows the current pet size and pet fee from the controlled filters", async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilters
        filters={{ ...buildFilters(), petSize: "grande", petFee: "5000" }}
        onFiltersChange={vi.fn()}
      />
    );

    await openPanel(user);

    expect(screen.getByText("Grande")).toBeInTheDocument();
    expect(screen.getByText("Hasta $5.000")).toBeInTheDocument();
  });

  it("reports the default filter state on clear", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdvancedFilters
        filters={{ ...buildFilters(), propertyTypes: ["casa"] }}
        onFiltersChange={onChange}
      />
    );

    await openPanel(user);
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ propertyTypes: [], petTypes: [], amenities: [] }),
      "push"
    );
  });
});
