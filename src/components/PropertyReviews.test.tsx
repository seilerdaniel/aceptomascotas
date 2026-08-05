import { render, screen } from "@testing-library/react";
import PropertyReviews from "./PropertyReviews";
import type { PropertyReview } from "@/hooks/usePropertyReviews";

// PropertyReviews coverage (spec S16/S18): only approved reviews render
// (S18), pet dimensions render as structured badges (S16), and an
// unapproved review — with its photos — stays hidden even if the data
// ever contains one (defense in depth, S18).
const { mockReviews, mockRating } = vi.hoisted(() => ({
  mockReviews: vi.fn(),
  mockRating: vi.fn(),
}));

vi.mock("@/hooks/usePropertyReviews", () => ({
  usePropertyReviews: (...args: unknown[]) => mockReviews(...args),
  usePropertyRating: (...args: unknown[]) => mockRating(...args),
  useCreatePropertyReview: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  __esModule: true,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const review = (overrides: Partial<PropertyReview>): PropertyReview => ({
  id: "r1",
  property_id: "p1",
  user_name: "María",
  rating: 5,
  comment: "Departamento ideal para mi perro",
  user_id: null,
  is_approved: true,
  pet_dimensions: null,
  created_at: "2026-08-01T12:00:00.000Z",
  ...overrides,
});

const renderReviews = () => render(<PropertyReviews propertyId="p1" />);

describe("PropertyReviews (S16/S18)", () => {
  beforeEach(() => {
    mockReviews.mockReset();
    mockRating.mockReset();
    mockRating.mockReturnValue({
      data: { property_id: "p1", review_count: 1, average_rating: 5 },
    });
  });

  it("renders approved reviews only (S18)", () => {
    mockReviews.mockReturnValue({
      data: [review({ user_name: "María" })],
      isLoading: false,
    });

    renderReviews();

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("Departamento ideal para mi perro")).toBeInTheDocument();
  });

  it("does not render an unapproved review (S18)", () => {
    mockReviews.mockReturnValue({
      data: [
        review({ is_approved: false, user_name: "Juan" }),
        review({ id: "r2", user_name: "María" }),
      ],
      isLoading: false,
    });

    renderReviews();

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.queryByText("Juan")).not.toBeInTheDocument();
  });

  it("renders pet dimensions as structured badges (S16)", () => {
    mockReviews.mockReturnValue({
      data: [
        review({
          pet_dimensions: {
            pet_friendliness: 5,
            space: 4,
            owner_responsiveness: null,
          },
        }),
      ],
      isLoading: false,
    });

    renderReviews();

    expect(screen.getByText("Amigable con mascotas: 5/5")).toBeInTheDocument();
    expect(screen.getByText("Espacio: 4/5")).toBeInTheDocument();
    expect(screen.queryByText(/Respuesta del dueño/)).not.toBeInTheDocument();
  });

  it("renders photos for an approved review (S18)", () => {
    mockReviews.mockReturnValue({
      data: [
        review({
          pet_dimensions: {
            pet_friendliness: 4,
            photos: ["review-images/u1/foto.jpg"],
          },
        }),
      ],
      isLoading: false,
    });

    renderReviews();

    const photo = screen.getByAltText("Foto de la reseña") as HTMLImageElement;
    expect(photo).toBeInTheDocument();
    expect(photo.src).toContain("/storage/v1/object/public/review-images/u1/foto.jpg");
  });

  it("hides an unapproved review together with its photos (S18)", () => {
    mockReviews.mockReturnValue({
      data: [
        review({
          is_approved: false,
          user_name: "Juan",
          pet_dimensions: {
            pet_friendliness: 5,
            photos: ["review-images/u1/foto-secreta.jpg"],
          },
        }),
      ],
      isLoading: false,
    });

    renderReviews();

    expect(screen.queryByText("Juan")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Foto de la reseña")).not.toBeInTheDocument();
    expect(
      screen.getByText("Todavía no hay reseñas. ¡Sé el primero en opinar!")
    ).toBeInTheDocument();
  });
});
