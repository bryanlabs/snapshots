import { validateSession } from "../validate-session";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Mock dependencies
jest.mock("@/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock("next/navigation");

describe("validateSession", () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns null when no session exists", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await validateSession();

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns null when session has no user", async () => {
    mockAuth.mockResolvedValue({} as any);

    const result = await validateSession();

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns null when session user has no id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as any);

    const result = await validateSession();

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns session when user exists in database", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      },
      expires: "2024-12-31",
    };

    mockAuth.mockResolvedValue(mockSession as any);
    mockFindUnique.mockResolvedValue({ id: "user-123" } as any);

    const result = await validateSession();

    expect(result).toEqual(mockSession);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      select: { id: true },
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects when user not found in database", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    };

    mockAuth.mockResolvedValue(mockSession as any);
    mockFindUnique.mockResolvedValue(null);

    await validateSession();

    expect(console.error).toHaveBeenCalledWith(
      "Session user user-123 not found in database - forcing re-authentication"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/api/auth/signout?callbackUrl=/auth/signin");
  });

  it("handles database errors gracefully", async () => {
    const mockSession = {
      user: {
        id: "user-123",
      },
    };

    mockAuth.mockResolvedValue(mockSession as any);
    mockFindUnique.mockRejectedValue(new Error("Database connection failed"));

    await expect(validateSession()).rejects.toThrow("Database connection failed");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("passes correct parameters to prisma findUnique", async () => {
    const mockSession = {
      user: {
        id: "test-user-456",
        email: "another@example.com",
        name: "Another User",
        image: "https://example.com/avatar.jpg",
      },
      expires: "2025-01-01",
    };

    mockAuth.mockResolvedValue(mockSession as any);
    mockFindUnique.mockResolvedValue({ id: "test-user-456" } as any);

    await validateSession();

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "test-user-456" },
      select: { id: true },
    });
  });

  it("only selects id field from database", async () => {
    const mockSession = {
      user: { id: "user-789" },
    };

    mockAuth.mockResolvedValue(mockSession as any);
    mockFindUnique.mockResolvedValue({ id: "user-789" } as any);

    await validateSession();

    const callArgs = mockFindUnique.mock.calls[0][0];
    expect(callArgs?.select).toEqual({ id: true });
    expect(Object.keys(callArgs?.select || {})).toHaveLength(1);
  });

  it("constructs correct signout URL with callback", async () => {
    const mockSession = {
      user: { id: "user-999" },
    };

    mockAuth.mockResolvedValue(mockSession as any);
    mockFindUnique.mockResolvedValue(null);

    await validateSession();

    const redirectUrl = mockRedirect.mock.calls[0][0];
    expect(redirectUrl).toBe("/api/auth/signout?callbackUrl=/auth/signin");
    expect(redirectUrl).toContain("callbackUrl");
  });

  it("returns the exact session object from auth", async () => {
    const complexSession = {
      user: {
        id: "complex-user",
        email: "complex@example.com",
        name: "Complex User",
        role: "admin",
        customField: "custom-value",
      },
      expires: "2024-12-31T23:59:59.999Z",
      customSessionField: "session-value",
    };

    mockAuth.mockResolvedValue(complexSession as any);
    mockFindUnique.mockResolvedValue({ id: "complex-user" } as any);

    const result = await validateSession();

    expect(result).toBe(complexSession); // Should be the exact same reference
    expect(result).toEqual(complexSession);
  });
});