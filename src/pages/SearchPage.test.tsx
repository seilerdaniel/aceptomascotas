import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import SearchPage from "./SearchPage";
import type { PropertiesPage, Property } from "@/hooks/useProperties";

const { mockUseProperties } = vi.hoisted(() => ({
  mockUseProperties: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/useAdmin", () => ({
  useIsAdmin: () => ({ data: false }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => {
    // profile query (enabled when user present) stays null with no user.
    return { data: null };
  },
}));

vi.mock("@/hooks/useProperties", () => ({
  useProperties: () => mockUseProperties(),
  // keep the type import usable at runtime without a real implementation
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

describe("SearchPage", () => {
  beforeEach(() => {
    mockUseProperties.mockReset();
  });

  it("renders the list of properties and the result count", () => {
    mockUseProperties.mockReturnValue(buildPage());

    renderSearchPage();

    expect(screen.getByText("Departamento en Palermo")).toBeInTheDocument();
    expect(screen.getByText("1 propiedades encontradas")).toBeInTheDocument();
  });

  it("shows the result count and the empty state when nothing matches", () => {
    mockUseProperties.mockReturnValue(buildPage({ rows: [], totalCount: 0, pageCount: 0 }));

    renderSearchPage();

    expect(screen.getByText("0 propiedades encontradas")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No encontramos propiedades" })
    ).toBeInTheDocument();
  });
});