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
  });

  const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /Filtros Avanzados/ }));
  };

  it("renders the advanced filter sections", async () => {
    const user = userEvent.setup();
    render(<AdvancedFilters onFiltersChange={vi.fn()} />);

    await openPanel(user);

    expect(screen.getByText("Rango de Precio")).toBeInTheDocument();
    expect(screen.getByText("Tipo de Propiedad")).toBeInTheDocument();
    expect(screen.getByText("Mascotas Permitidas")).toBeInTheDocument();
    expect(screen.getByText("Comodidades")).toBeInTheDocument();
  });

  it("toggles a property-type filter and reports it on change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AdvancedFilters onFiltersChange={onChange} initialFilters={buildFilters()} />);

    await openPanel(user);
    await user.click(screen.getByText("Casa"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ propertyTypes: ["casa"] })
    );
  });

  it("reports the default filter state on clear", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdvancedFilters
        onFiltersChange={onChange}
        initialFilters={{ ...buildFilters(), propertyTypes: ["casa"] }}
      />
    );

    await openPanel(user);
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ propertyTypes: [], petTypes: [], amenities: [] })
    );
  });
});