import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SignInPage from "../page";
import { useToast } from "@/components/ui/toast";

// Mock dependencies
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/components/ui/toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("../KeplrSignIn", () => ({
  KeplrSignIn: () => <div data-testid="keplr-signin">Keplr Sign In Component</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe("SignInPage", () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };
  const mockShowToast = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
  });

  it("renders sign in page with initial state", () => {
    render(<SignInPage />);
    
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Access your blockchain snapshots")).toBeInTheDocument();
    expect(screen.getByText("Choose your sign in method")).toBeInTheDocument();
    expect(screen.getByText("Continue with Email")).toBeInTheDocument();
    expect(screen.getByText("Continue with Keplr")).toBeInTheDocument();
  });

  it("shows features on the left side", () => {
    render(<SignInPage />);
    
    expect(screen.getByText("Fast Downloads")).toBeInTheDocument();
    expect(screen.getByText("Secure & Reliable")).toBeInTheDocument();
    expect(screen.getByText("Multiple Chains")).toBeInTheDocument();
  });

  it("shows toast message when registered param is present", () => {
    mockSearchParams.set("registered", "true");
    render(<SignInPage />);
    
    expect(mockShowToast).toHaveBeenCalledWith(
      "Account created successfully! Please sign in.",
      "success"
    );
  });

  it("switches to signup mode when mode param is signup", () => {
    mockSearchParams.set("mode", "signup");
    render(<SignInPage />);
    
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByText("Start downloading snapshots today")).toBeInTheDocument();
  });

  it("switches between signin and signup modes", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    
    // Initially in signin mode
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    
    // Click to switch to signup
    await user.click(screen.getByText("Create free account"));
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    
    // Click to switch back to signin
    await user.click(screen.getByText("Sign in"));
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows email form when email method is selected", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    
    await user.click(screen.getByText("Continue with Email"));
    
    expect(screen.getByLabelText("Username or Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("shows Keplr component when wallet method is selected", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    
    await user.click(screen.getByText("Continue with Keplr"));
    
    expect(screen.getByTestId("keplr-signin")).toBeInTheDocument();
  });

  it("can go back from auth method selection", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    
    await user.click(screen.getByText("Continue with Email"));
    expect(screen.getByText("Back to options")).toBeInTheDocument();
    
    await user.click(screen.getByText("Back to options"));
    expect(screen.getByText("Choose your sign in method")).toBeInTheDocument();
  });

  describe("Email Sign In", () => {
    it("handles successful sign in", async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      
      render(<SignInPage />);
      await user.click(screen.getByText("Continue with Email"));
      
      await user.type(screen.getByLabelText("Username or Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      
      const form = screen.getByLabelText("Username or Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com",
          password: "password123",
          redirect: false,
        });
        expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it("handles sign in error", async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ error: "Invalid credentials" });
      
      render(<SignInPage />);
      await user.click(screen.getByText("Continue with Email"));
      
      await user.type(screen.getByLabelText("Username or Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "wrongpassword");
      
      const form = screen.getByLabelText("Username or Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
      });
    });

    it("handles sign in exception", async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockRejectedValue(new Error("Network error"));
      
      render(<SignInPage />);
      await user.click(screen.getByText("Continue with Email"));
      
      await user.type(screen.getByLabelText("Username or Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      
      const form = screen.getByLabelText("Username or Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
      });
    });

    it("shows loading state during sign in", async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<SignInPage />);
      await user.click(screen.getByText("Continue with Email"));
      
      await user.type(screen.getByLabelText("Username or Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      
      const form = screen.getByLabelText("Username or Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("Signing in...")).toBeInTheDocument();
        expect(screen.getByLabelText("Username or Email")).toBeDisabled();
        expect(screen.getByLabelText("Password")).toBeDisabled();
      });
    });
  });

  describe("Sign Up", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<SignInPage />);
      await user.click(screen.getByText("Create free account"));
      await user.click(screen.getByText("Continue with Email"));
    });

    it("shows signup form fields", () => {
      expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    });

    it("shows account benefits", () => {
      expect(screen.getByText("5 downloads per day")).toBeInTheDocument();
      expect(screen.getByText("50 Mbps download speed")).toBeInTheDocument();
      expect(screen.getByText("Access to all blockchains")).toBeInTheDocument();
    });

    it("validates password match", async () => {
      const user = userEvent.setup();
      
      await user.type(screen.getByLabelText("Display Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(screen.getByLabelText("Confirm Password"), "differentpassword");
      
      const form = screen.getByLabelText("Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });

    it("validates password length", async () => {
      const user = userEvent.setup();
      
      await user.type(screen.getByLabelText("Display Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "short");
      await user.type(screen.getByLabelText("Confirm Password"), "short");
      
      const form = screen.getByLabelText("Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters long")).toBeInTheDocument();
      });
    });

    it("handles successful signup", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      
      await user.type(screen.getByLabelText("Display Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(screen.getByLabelText("Confirm Password"), "password123");
      
      const form = screen.getByLabelText("Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "password123",
            displayName: "John Doe",
          }),
        });
        expect(signIn).toHaveBeenCalledWith("credentials", {
          email: "john@example.com",
          password: "password123",
          redirect: false,
        });
        expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("handles signup error from API", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Email already exists" }),
      });
      
      await user.type(screen.getByLabelText("Display Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(screen.getByLabelText("Confirm Password"), "password123");
      
      const form = screen.getByLabelText("Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });
    });

    it("handles signup exception", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      
      await user.type(screen.getByLabelText("Display Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(screen.getByLabelText("Confirm Password"), "password123");
      
      const form = screen.getByLabelText("Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
      });
    });

    it("shows loading state during signup", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      await user.type(screen.getByLabelText("Display Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(screen.getByLabelText("Confirm Password"), "password123");
      
      const form = screen.getByLabelText("Email").closest("form")!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText("Creating account...")).toBeInTheDocument();
        expect(screen.getByLabelText("Display Name")).toBeDisabled();
        expect(screen.getByLabelText("Email")).toBeDisabled();
      });
    });
  });

  it("shows disabled social login buttons", () => {
    render(<SignInPage />);
    
    const googleButton = screen.getByText("Google").closest("button");
    const githubButton = screen.getByText("GitHub").closest("button");
    
    expect(googleButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
  });

  it("resets form when switching modes", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    
    // Fill in signin form
    await user.click(screen.getByText("Continue with Email"));
    await user.type(screen.getByLabelText("Username or Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    
    // Switch to signup
    await user.click(screen.getByText("Create free account"));
    
    // Check that form is reset
    expect(screen.queryByDisplayValue("test@example.com")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("password123")).not.toBeInTheDocument();
  });

  it("shows terms and privacy links", () => {
    render(<SignInPage />);
    
    const termsLink = screen.getByRole("link", { name: /terms of service/i });
    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    
    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("shows account benefits in signup mode", async () => {
    const user = userEvent.setup();
    mockSearchParams.set("mode", "signup");
    render(<SignInPage />);
    
    expect(screen.getByText("Why Create an Account?")).toBeInTheDocument();
    expect(screen.getByText("Personalized Experience")).toBeInTheDocument();
    expect(screen.getByText("Daily Credits")).toBeInTheDocument();
    expect(screen.getByText("Priority Access")).toBeInTheDocument();
    expect(screen.getByText("API Access")).toBeInTheDocument();
  });
});