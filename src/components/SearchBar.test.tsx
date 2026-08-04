import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "./SearchBar";

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("SearchBar", () => {
  it("renders the main search controls", () => {
    render(<SearchBar />);

    expect(screen.getByPlaceholderText("Ciudad o barrio...")).toBeInTheDocument();
    expect(screen.getByText("Precio máx.")).toBeInTheDocument();
    expect(screen.getByText("Tipo de propiedad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
  });

  it("builds the query string from the location input and navigates to /buscar", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByPlaceholderText("Ciudad o barrio..."), "Palermo");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(mockNavigate).toHaveBeenCalledWith("/buscar?ubicacion=Palermo");
  });

  it("skips empty filters when submitting", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(mockNavigate).toHaveBeenCalledWith("/buscar?");
  });
});