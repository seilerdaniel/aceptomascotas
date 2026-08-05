import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import SearchPage from "./SearchPage";
import type { PropertiesPage, Property } from "@/hooks/useProperties";

// URL round-trip coverage (spec U1/S27-S30, S31): SearchPage derives filter
// state from useSearchParams, so a refresh (S27), a shared deep link (S28)
// and back/forward navigation (S29) must all restore identical results, and
// malformed/unknown params must be ignored without crashing (S30). S31 keeps
// the EmptyState + clear-filters action.
const { mockUseProperties, mockSetSearchParams, paramsHolder } = vi.hoisted(() => ({
  mockUseProperties: vi.fn(),
  mockSetSearchParams: vi.fn(),
  paramsHolder: { params: new URLSearchParams() },
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [paramsHolder.params, mockSetSearchParams],
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/useAdmin", () => ({
  useIsAdmin: () => ({ data: false }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null }),
}));

vi.mock("@/hooks/useProperties", () => ({
  useProperties: (...args: unknown[]) => mockUseProperties(...args),
  __esModule: true,
}));

vi.mock("@/components/Header", () => ({
  default: () => <header>header-stub</header>,
}));
vi.mock("@/components/Footer", () => ({
  default: () => <footer>footer-stub</footer>,
}));
vi.mock("@/components/Map", () => ({
  default: () => <div>map-stub</div>,
}));
vi.mock("@/components/PropertyCard", () => ({
  default: ({ property }: { property: { title: string } }) => (
    <article>{property.title}</article>
  ),
}));
vi.mock("@/components/Pagination", () => ({
  default: () => <nav>pagination-stub</nav>,
}));

const buildPage = (
  overrides: Partial<PropertiesPage> = {}
): { data: PropertiesPage; isLoading: boolean; error: null } => {
  const property = {
    id: "p1",
    title: "Departamento en Palermo",
    description: "Acepta mascotas",
    location: "Palermo, CABA",
    price: 120000,
    property_type: "departamento",
    pet_types: ["perro", "gato"],
    images: ["/img1.jpg"],
    contact_name: "Owner",
  } as Property;

  return {
    data: { rows: [property], totalCount: 1, pageCount: 1, ...overrides },
    isLoading: false,
    error: null,
  };
};

const renderSearchPage = () =>
  render(
    <HelmetProvider>
      <SearchPage />
    </HelmetProvider>
  );

describe("SearchPage URL round-trip (S27-S30)", () => {
  beforeEach(() => {
    mockUseProperties.mockReset();
    mockSetSearchParams.mockReset();
    paramsHolder.params = new URLSearchParams();
  });

  it("restores identical filters on refresh (S27)", () => {
    paramsHolder.params = new URLSearchParams(
      "min=50000&max=300000&tipo=casa,ph&mascota=perro&tamano=grande&mascotas_max=2&pet_fee=5000&comodidades=balcon,jardin"
    );
    mockUseProperties.mockReturnValue(buildPage());

    const { rerender } = renderSearchPage();
    const firstCall = mockUseProperties.mock.calls[0][0];

    expect(firstCall).toMatchObject({
      minPrice: 50000,
      maxPrice: 300000,
      propertyTypes: ["casa", "ph"],
      petTypes: ["perro"],
      petSize: "grande",
      maxPets: 2,
      petFee: 5000,
      amenities: ["balcon", "jardin"],
    });

    // Refresh = re-render with the same URL.
    mockUseProperties.mockClear();
    rerender(
      <HelmetProvider>
        <SearchPage />
      </HelmetProvider>
    );
    expect(mockUseProperties.mock.calls[0][0]).toEqual(firstCall);
  });

  it("applies a shared deep link with advanced filter params (S28)", () => {
    paramsHolder.params = new URLSearchParams("tipo=loft&mascota=gato&precio=150000&ubicacion=Palermo");
    mockUseProperties.mockReturnValue(buildPage());

    renderSearchPage();

    const filters = mockUseProperties.mock.calls[0][0];
    expect(filters).toMatchObject({
      location: "Palermo",
      maxPrice: 150000,
      propertyTypes: ["loft"],
      petTypes: ["gato"],
    });
  });

  it("follows filter state across back/forward navigation (S29)", () => {
    paramsHolder.params = new URLSearchParams("tipo=casa");
    mockUseProperties.mockReturnValue(buildPage());

    const { rerender } = renderSearchPage();
    expect(mockUseProperties.mock.calls[0][0]).toMatchObject({ propertyTypes: ["casa"] });

    // Back/forward hands the router's previous URL params to the page.
    paramsHolder.params = new URLSearchParams("tipo=ph&max=200000");
    mockUseProperties.mockClear();
    rerender(
      <HelmetProvider>
        <SearchPage />
      </HelmetProvider>
    );

    const filters = mockUseProperties.mock.calls[0][0];
    expect(filters).toMatchObject({ propertyTypes: ["ph"], maxPrice: 200000 });
  });

  it("ignores malformed and unknown params without crashing (S30)", () => {
    paramsHolder.params = new URLSearchParams(
      "min=abc&max=-5&tipo=castle,xyz&mascota=unicornio&tamano=kolossal&mascotas_max=two&pet_fee=-1&precio=99999999&ubicacion=Palermo"
    );
    mockUseProperties.mockReturnValue(buildPage());

    renderSearchPage();

    const filters = mockUseProperties.mock.calls[0][0];
    expect(filters).toMatchObject({
      location: "Palermo", // well-formed params still apply
      minPrice: undefined,
      maxPrice: undefined,
      propertyTypes: undefined,
      petTypes: undefined,
      petSize: undefined,
      maxPets: undefined,
      petFee: undefined,
      amenities: undefined,
    });
    // The page rendered a result list, proving it did not crash.
    expect(screen.getByText("Departamento en Palermo")).toBeInTheDocument();
  });

  it("keeps the EmptyState with a clear-filters action when URL filters match nothing (S31)", () => {
    paramsHolder.params = new URLSearchParams("tipo=ph");
    mockUseProperties.mockReturnValue(buildPage({ rows: [], totalCount: 0, pageCount: 0 }));

    renderSearchPage();

    expect(
      screen.getByRole("heading", { name: "No encontramos propiedades" })
    ).toBeInTheDocument();
    // Both the EmptyState action and the AdvancedFilters header expose a
    // clear-filters button — at least one must be present so the user can
    // recover from a URL that matches nothing.
    expect(
      screen.getAllByRole("button", { name: "Limpiar filtros" }).length
    ).toBeGreaterThan(0);
  });
});
