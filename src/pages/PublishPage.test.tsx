import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PublishPage from "./PublishPage";
import { toast } from "sonner";

const { mockInvoke, mockGetSession } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

// IMPORTANT: useQuery/useAuth mocks must return STABLE references. PublishPage
// has a pre-fill effect depending on [profile, user]; a fresh object per render
// re-triggers it forever (infinite render loop that hangs the whole test run).
// TanStack Query normally caches data by reference, so this mirrors production.
vi.mock("@/hooks/useAuth", () => {
  const user = { id: "u1", email: "owner@test.com" };
  return {
    useAuth: () => ({ user, loading: false }),
  };
});

vi.mock("@tanstack/react-query", () => {
  const profile = {
    user_type: "propietario",
    full_name: "Owner Test",
    phone: "+54 11 1234-5678",
  };
  return {
    useQuery: () => ({ data: profile }),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: () => vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/components/LocationPicker", () => ({
  default: () => <div>location-picker-stub</div>,
}));
vi.mock("@/components/Header", () => ({
  default: () => <header>header-stub</header>,
}));
vi.mock("@/components/Footer", () => ({
  default: () => <footer>footer-stub</footer>,
}));
vi.mock("@/components/SEOHead", () => ({
  default: () => <div />,
}));

// Stub the shadcn Select as a native <select> so tests can drive it with
// fireEvent.change. SelectTrigger/SelectValue only render in the trigger
// wrapper — irrelevant for validation flows. The two comboboxes in DOM
// order are: propertyType (info card) and petSize (pet-friendly card).
vi.mock("@/components/ui/select", () => {
  const Select = ({ value, onValueChange, children }: any) => (
    <select
      data-testid="select"
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  );
  const SelectTrigger = () => null;
  const SelectValue = () => null;
  const SelectContent = ({ children }: any) => <>{children}</>;
  const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

const submitForm = () => {
  const form = document.querySelector("form");
  if (!form) throw new Error("Publish form not rendered");
  // fireEvent.submit is the canonical way to trigger form onSubmit in
  // jsdom — clicking a submit button does not reliably dispatch it here.
  fireEvent.submit(form);
};

const validBaseForm = {
  title: "Departamento luminoso en Palermo con balcón",
  price: "150000",
  location: "Palermo, CABA",
  contactName: "Owner Test",
  contactPhone: "+54 11 1234-5678",
  contactEmail: "owner@test.com",
};

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Título del anuncio/), validBaseForm.title);
  await user.type(screen.getByLabelText(/Precio mensual/), validBaseForm.price);
  // Property type comes from the stubbed Select (first combobox in the DOM).
  fireEvent.change(screen.getAllByRole("combobox")[0], {
    target: { value: "casa" },
  });
  await user.type(screen.getByLabelText(/Ubicación/), validBaseForm.location);
  // Pick a pet type via its labeled checkbox.
  await user.click(screen.getByText("Perros"));
  // fireEvent.change overwrites the value — robust against the profile
  // pre-fill effect (which only fills empty fields, but userEvent.type
  // would append to an already-filled input).
  fireEvent.change(screen.getByLabelText(/Nombre completo/), {
    target: { value: validBaseForm.contactName },
  });
  fireEvent.change(screen.getByLabelText(/Teléfono \/ WhatsApp/), {
    target: { value: validBaseForm.contactPhone },
  });
  fireEvent.change(screen.getByLabelText(/Email/), {
    target: { value: validBaseForm.contactEmail },
  });
};

describe("PublishPage pet-friendly validation (S9)", () => {
  beforeEach(() => {
    // The sonner spies are module-level vi.fn()s shared across tests — clear
    // all mock call history or a toast from a previous test fails "not called".
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
      error: null,
    });
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    localStorage.clear();
  });

  const renderPage = () => render(<PublishPage />);

  it("blocks submission with a negative pet fee and never calls create-property", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequiredFields(user);

    // fireEvent.change (not userEvent.type) — userEvent filters invalid
    // characters for number inputs, so "-100" would arrive as "100".
    fireEvent.change(screen.getByLabelText(/Mensualidad por mascota/), {
      target: { value: "-100" },
    });

    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "La mensualidad por mascota no puede ser negativa"
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("blocks submission with a non-numeric max pets and never calls create-property", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequiredFields(user);

    fireEvent.change(screen.getByLabelText(/Máximo de mascotas/), {
      target: { value: "abc" },
    });

    submitForm();

    expect(toast.error).toHaveBeenCalledWith(
      "El máximo de mascotas debe ser un número entero"
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("submits valid pet-friendly details to create-property", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequiredFields(user);

    await user.type(screen.getByLabelText(/Mensualidad por mascota/), "5000");
    await user.type(screen.getByLabelText(/Máximo de mascotas/), "2");
    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "grande" },
    });
    await user.click(screen.getByText("Balcón"));
    await user.click(screen.getByText("Jardín"));

    submitForm();

    expect(toast.error).not.toHaveBeenCalled();

    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1));
    expect(mockInvoke).toHaveBeenCalledWith(
      "create-property",
      expect.objectContaining({
        body: expect.objectContaining({
          petFee: 5000,
          maxPets: 2,
          petSize: "grande",
          amenities: ["balcon", "jardin"],
        }),
      })
    );
  });
});
