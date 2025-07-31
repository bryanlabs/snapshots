// Mock NextAuth before any imports
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { requireAdmin } from "../admin-middleware";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

describe("Admin Middleware", () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when no session exists", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    
    const json = await result?.json();
    expect(json).toEqual({
      error: "Unauthorized",
      message: "Authentication required",
    });
  });

  it("should return 401 when session has no user id", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: "test@example.com" },
      expires: new Date().toISOString(),
    } as any);

    const result = await requireAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    
    const json = await result?.json();
    expect(json).toEqual({
      error: "Unauthorized",
      message: "Authentication required",
    });
  });

  it("should return 403 for premium-user (legacy support)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "premium-user", email: "premium@example.com" },
      expires: new Date().toISOString(),
    } as any);

    const result = await requireAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    
    const json = await result?.json();
    expect(json).toEqual({
      error: "Forbidden",
      message: "Admin access required",
    });
  });

  it("should return 403 when user is not admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user123", email: "user@example.com" },
      expires: new Date().toISOString(),
    } as any);

    mockPrismaUser.findUnique.mockResolvedValueOnce({
      role: "user",
    } as any);

    const result = await requireAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    
    const json = await result?.json();
    expect(json).toEqual({
      error: "Forbidden",
      message: "Admin access required",
    });
  });

  it("should return 403 when user not found in database", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user123", email: "user@example.com" },
      expires: new Date().toISOString(),
    } as any);

    mockPrismaUser.findUnique.mockResolvedValueOnce(null);

    const result = await requireAdmin();
    expect(result).toBeInstanceOf(NextResponse);
    
    const json = await result?.json();
    expect(json).toEqual({
      error: "Forbidden",
      message: "Admin access required",
    });
  });

  it("should return null when user is admin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "admin123", email: "admin@example.com" },
      expires: new Date().toISOString(),
    } as any);

    mockPrismaUser.findUnique.mockResolvedValueOnce({
      role: "admin",
    } as any);

    const result = await requireAdmin();
    expect(result).toBeNull();
  });
});