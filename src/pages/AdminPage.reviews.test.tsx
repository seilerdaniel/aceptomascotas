import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import AdminPage from "./AdminPage";

// Admin gate (S19/S20): the reviews moderation surface lives behind
// AdminAccessGuard — a non-admin must see "Acceso denegado" and none of the
// admin tabs (including Reseñas), so unprivileged users can never reach the
// approve/delete controls.
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));

vi.mock("@/hooks/useAdmin", () => ({
  useIsAdmin: () => ({ data: false, isLoading: false }),
  useContactMessages: () => ({ data: [], isLoading: false }),
  usePropertyReports: () => ({ data: [], isLoading: false }),
  useAllAds: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/useAdminActionLog", () => ({
  useAdminActionLog: () => ({
    data: { rows: [] },
    isLoading: false,
    loadMore: vi.fn(),
    hasMore: false,
  }),
}));

vi.mock("@/hooks/useAdminTables", () => ({
  useAdminPropertiesPaginated: () => ({ data: { rows: [], totalCount: 0, pageCount: 1 }, isLoading: false }),
  useAdminServicesPaginated: () => ({ data: { rows: [], totalCount: 0, pageCount: 1 }, isLoading: false }),
  useAdminUsersPaginated: () => ({ data: { rows: [], totalCount: 0, pageCount: 1 }, isLoading: false }),
  useAdminPropertyReviewsPaginated: () => ({ data: { rows: [], totalCount: 0, pageCount: 1 }, isLoading: false }),
  useAdminPendingServicesCount: () => ({ data: 0 }),
  useAdminPendingReviewsCount: () => ({ data: 0 }),
}));

vi.mock("@/hooks/useAdminTableHandlers", () => ({
  useAdminTableHandlers: () => ({
    onSearchChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSort: vi.fn(),
    onPageChange: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAdminMutations", () => ({
  useAdminMutations: () => ({
    isCreatingAd: false,
    handleDeleteMessage: vi.fn(),
    handleToggleProperty: vi.fn(),
    handleToggleVerified: vi.fn(),
    handleDeleteProperty: vi.fn(),
    handleUpdateReportStatus: vi.fn(),
    handleDeleteReport: vi.fn(),
    handleToggleVerification: vi.fn(),
    handleToggleServiceApproval: vi.fn(),
    handleToggleServiceVerified: vi.fn(),
    handleDeleteService: vi.fn(),
    handleToggleReviewApproval: vi.fn(),
    handleDeleteReview: vi.fn(),
    handleCreateAd: vi.fn(),
    handleToggleAdActive: vi.fn(),
    handleDeleteAd: vi.fn(),
  }),
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
vi.mock("@/components/admin/AdminStatsCards", () => ({
  default: () => <div>stats-stub</div>,
}));

const renderAdminPage = () =>
  render(
    <HelmetProvider>
      <AdminPage />
    </HelmetProvider>
  );

describe("AdminPage moderation gate (S19/S20)", () => {
  it("blocks a non-admin user with the denied guard", () => {
    renderAdminPage();

    expect(
      screen.getByRole("heading", { name: "Acceso denegado" })
    ).toBeInTheDocument();
  });

  it("never renders the reviews moderation tab for a non-admin", () => {
    renderAdminPage();

    expect(screen.queryByRole("tab", { name: /Reseñas/ })).not.toBeInTheDocument();
    expect(
      screen.queryByText("Reseñas de propiedades")
    ).not.toBeInTheDocument();
  });
});
