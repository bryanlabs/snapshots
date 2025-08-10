import React from "react";
import { render } from "@testing-library/react";
import { useRouter } from "next/navigation";
import SignUpPage from "../page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("SignUpPage", () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("redirects to signin page with signup mode", () => {
    render(<SignUpPage />);
    
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/signin?mode=signup");
  });

  it("renders null content", () => {
    const { container } = render(<SignUpPage />);
    
    expect(container.firstChild).toBeNull();
  });

  it("calls useRouter hook", () => {
    render(<SignUpPage />);
    
    expect(useRouter).toHaveBeenCalled();
  });

  it("only calls replace once", () => {
    const { rerender } = render(<SignUpPage />);
    
    // Rerender to ensure effect doesn't run multiple times
    rerender(<SignUpPage />);
    
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });

  it("uses correct redirect path", () => {
    render(<SignUpPage />);
    
    const redirectUrl = mockRouter.replace.mock.calls[0][0];
    expect(redirectUrl).toBe("/auth/signin?mode=signup");
    expect(redirectUrl).toContain("mode=signup");
  });
});