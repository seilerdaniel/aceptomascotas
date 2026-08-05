import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewsTab from "./ReviewsTab";
import type { AdminPropertyReview } from "@/types/admin";

// Radix TabsContent requires a Tabs root; the tab renders as a plain block
// in the test.
vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Admin moderation flows (S19/S20): toggling the approval Switch must call
// the approve handler with the new value, and confirming the AlertDialog
// delete must call the delete handler. The data-layer effects (public UI +
// ratings update) are covered by the mutation contract test in
// src/pages/AdminPage.reviews.test.tsx.
const handlers = {
  onSearchChange: vi.fn(),
  onStatusChange: vi.fn(),
  onSort: vi.fn(),
  onPageChange: vi.fn(),
};

const review = (overrides: Partial<AdminPropertyReview> = {}): AdminPropertyReview => ({
  id: "rev1",
  property_id: "p1",
  user_name: "María",
  rating: 5,
  comment: "Departamento ideal",
  user_id: null,
  is_approved: false,
  pet_dimensions: null,
  created_at: "2026-08-01T12:00:00.000Z",
  properties: { title: "Departamento en Palermo" },
  ...overrides,
});

const renderTab = (
  props: Partial<Parameters<typeof ReviewsTab>[0]> = {}
) => {
  const onToggleApproval = vi.fn();
  const onDelete = vi.fn();
  const user = userEvent.setup();

  render(
    <ReviewsTab
      reviews={[review()]}
      isLoading={false}
      state={{ page: 1, search: "", sortBy: "created_at", sortAscending: false, status: "pendientes" }}
      handlers={handlers}
      pageCount={1}
      totalCount={1}
      onToggleApproval={onToggleApproval}
      onDelete={onDelete}
      {...props}
    />
  );

  return { onToggleApproval, onDelete, user };
};

describe("ReviewsTab moderation (S19/S20)", () => {
  it("renders pending reviews with property title, rating and comment", () => {
    renderTab();

    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("Departamento en Palermo")).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(screen.getByText("Departamento ideal")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("calls onToggleApproval with true when the Switch is turned on (S19)", async () => {
    const { onToggleApproval, user } = renderTab();

    await user.click(screen.getByRole("switch", { name: "Aprobar reseña" }));

    expect(onToggleApproval).toHaveBeenCalledWith("rev1", true);
  });

  it("calls onDelete after confirming the AlertDialog (S20)", async () => {
    const { onDelete, user } = renderTab();

    await user.click(screen.getByRole("button", { name: "Eliminar reseña" }));
    expect(screen.getByText("¿Eliminar esta reseña?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledWith("rev1");
  });

  it("does not call onDelete when the dialog is cancelled", async () => {
    const { onDelete, user } = renderTab();

    await user.click(screen.getByRole("button", { name: "Eliminar reseña" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});
