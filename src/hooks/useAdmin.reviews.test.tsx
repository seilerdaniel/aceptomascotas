import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useTogglePropertyReviewApproval,
  useDeletePropertyReview,
} from "./useAdmin";

// Mutation contract for property-review moderation (S19/S20): approving
// writes is_approved=true and invalidates the public list + ratings queries
// (which is what makes the review public and updates the average — S19);
// deleting removes the row and invalidates the same public queries plus the
// admin table + pending badge (S20).
const { mockUpdate, mockDelete, mockInvalidate, mockLog } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockInvalidate: vi.fn(),
  mockLog: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (_table: string) => ({
      update: (updates: unknown) => {
        mockUpdate(updates);
        return { eq: () => ({ error: null }) };
      },
      delete: () => {
        mockDelete();
        return { eq: () => ({ error: null }) };
      },
    }),
  },
}));

vi.mock("@/lib/adminActionLog", () => ({
  logAdminAction: (...args: unknown[]) => mockLog(...args),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

// Real useMutation/useQueryClient, but the client's invalidations are
// captured instead of hitting the network.
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
  };
});

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("property review moderation mutations (S19/S20)", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockInvalidate.mockReset();
    mockLog.mockReset();
  });

  it("approving sets is_approved=true and invalidates public + ratings queries (S19)", async () => {
    const { result } = renderHook(() => useTogglePropertyReviewApproval(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: "rev1", isApproved: true });
    });

    expect(mockUpdate).toHaveBeenCalledWith({ is_approved: true });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["property-reviews"] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["property-ratings"] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["admin-property-reviews-page"] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["admin-property-reviews-pending-count"] });
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "approve_property_review", targetId: "rev1" })
    );
  });

  it("deleting removes the row and invalidates public + ratings queries (S20)", async () => {
    const { result } = renderHook(() => useDeletePropertyReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("rev2");
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["property-reviews"] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["property-ratings"] });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["admin-property-reviews-page"] });
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete_property_review", targetId: "rev2" })
    );
  });

  it("unapproving keeps the review hidden from public queries", async () => {
    const { result } = renderHook(() => useTogglePropertyReviewApproval(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: "rev3", isApproved: false });
    });

    expect(mockUpdate).toHaveBeenCalledWith({ is_approved: false });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["property-reviews"] });
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "unapprove_property_review" })
    );
  });
});
