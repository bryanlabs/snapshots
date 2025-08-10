import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KeplrSignIn } from "../KeplrSignIn";

// Mock dependencies
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Keplr wallet
const mockKeplr = {
  enable: jest.fn(),
  getOfflineSigner: jest.fn(),
  signArbitrary: jest.fn(),
};

describe("KeplrSignIn", () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Reset window.keplr
    delete (window as any).keplr;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders initial state without Keplr", () => {
    render(<KeplrSignIn />);
    
    expect(screen.getByText("Connect your Keplr wallet to sign in")).toBeInTheDocument();
    expect(screen.getByText("Install Keplr Wallet")).toBeInTheDocument();
    expect(screen.getByText("Download Keplr Wallet")).toBeInTheDocument();
  });

  it("detects Keplr when available on mount", () => {
    (window as any).keplr = mockKeplr;
    
    render(<KeplrSignIn />);
    
    expect(screen.getByText("Connect Keplr")).toBeInTheDocument();
    expect(screen.queryByText("Install Keplr Wallet")).not.toBeInTheDocument();
  });

  it("detects Keplr when it becomes available after mount", async () => {
    render(<KeplrSignIn />);
    
    expect(screen.getByText("Install Keplr Wallet")).toBeInTheDocument();
    
    // Add Keplr after 50ms
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    (window as any).keplr = mockKeplr;
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(screen.getByText("Connect Keplr")).toBeInTheDocument();
    });
  });

  it("stops checking for Keplr after 3 seconds", () => {
    render(<KeplrSignIn />);
    
    // Advance past 3 seconds
    act(() => {
      jest.advanceTimersByTime(3100);
    });
    
    // Add Keplr after timeout
    (window as any).keplr = mockKeplr;
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should still show install message
    expect(screen.getByText("Install Keplr Wallet")).toBeInTheDocument();
  });

  describe("wallet sign in flow", () => {
    const mockAccounts = [{
      address: "cosmos1testaddress",
      pubkey: new Uint8Array(),
      algo: "secp256k1",
    }];
    
    const mockSignature = {
      signature: "base64signature",
      pub_key: { value: "base64pubkey" },
    };

    beforeEach(() => {
      (window as any).keplr = mockKeplr;
      mockKeplr.enable.mockResolvedValue(undefined);
      mockKeplr.getOfflineSigner.mockReturnValue({
        getAccounts: jest.fn().mockResolvedValue(mockAccounts),
      });
      mockKeplr.signArbitrary.mockResolvedValue(mockSignature);
    });

    it("handles successful wallet sign in", async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(mockKeplr.enable).toHaveBeenCalledWith("cosmoshub-4");
        expect(mockKeplr.getOfflineSigner).toHaveBeenCalledWith("cosmoshub-4");
        expect(mockKeplr.signArbitrary).toHaveBeenCalledWith(
          "cosmoshub-4",
          "cosmos1testaddress",
          expect.stringContaining("Sign this message to authenticate with Snapshots Service")
        );
      });
      
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: "cosmos1testaddress",
          signature: "base64signature",
          message: expect.stringContaining("Sign this message to authenticate with Snapshots Service"),
        }),
      });
      
      // Verify NextAuth sign in
      expect(signIn).toHaveBeenCalledWith("wallet", {
        walletAddress: "cosmos1testaddress",
        signature: "base64signature",
        message: expect.stringContaining("Timestamp:"),
        redirect: false,
      });
      
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it("shows error when Keplr not installed", async () => {
      const user = userEvent.setup({ delay: null });
      delete (window as any).keplr;
      
      render(<KeplrSignIn />);
      
      // Force state update to show Connect button
      (window as any).keplr = null;
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
      
      const button = screen.getByRole("button");
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText("Please install Keplr wallet extension")).toBeInTheDocument();
      });
    });

    it("handles Keplr enable error", async () => {
      const user = userEvent.setup({ delay: null });
      mockKeplr.enable.mockRejectedValue(new Error("User rejected"));
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("User rejected")).toBeInTheDocument();
      });
    });

    it("handles no accounts error", async () => {
      const user = userEvent.setup({ delay: null });
      mockKeplr.getOfflineSigner.mockReturnValue({
        getAccounts: jest.fn().mockResolvedValue([]),
      });
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("No accounts found")).toBeInTheDocument();
      });
    });

    it("handles signature rejection", async () => {
      const user = userEvent.setup({ delay: null });
      mockKeplr.signArbitrary.mockResolvedValue(null);
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("Failed to sign message")).toBeInTheDocument();
      });
    });

    it("handles API authentication error", async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid signature" }),
      });
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("Invalid signature")).toBeInTheDocument();
      });
    });

    it("handles API error without message", async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("Authentication failed")).toBeInTheDocument();
      });
    });

    it("handles NextAuth sign in error", async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      (signIn as jest.Mock).mockResolvedValue({ error: "Invalid credentials" });
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("shows loading state during sign in", async () => {
      const user = userEvent.setup({ delay: null });
      mockKeplr.enable.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("handles generic errors", async () => {
      const user = userEvent.setup({ delay: null });
      mockKeplr.enable.mockRejectedValue({ code: "UNKNOWN_ERROR" });
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(screen.getByText("Failed to sign in with wallet")).toBeInTheDocument();
      });
    });

    it("logs errors to console", async () => {
      const user = userEvent.setup({ delay: null });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const testError = new Error("Test error");
      mockKeplr.enable.mockRejectedValue(testError);
      
      render(<KeplrSignIn />);
      
      await user.click(screen.getByText("Connect Keplr"));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Wallet sign in error:", testError);
      });
      
      consoleSpy.mockRestore();
    });
  });

  it("includes timestamp in signed message", async () => {
    const user = userEvent.setup({ delay: null });
    (window as any).keplr = mockKeplr;
    mockKeplr.enable.mockResolvedValue(undefined);
    mockKeplr.getOfflineSigner.mockReturnValue({
      getAccounts: jest.fn().mockResolvedValue([{
        address: "cosmos1test",
        pubkey: new Uint8Array(),
        algo: "secp256k1",
      }]),
    });
    mockKeplr.signArbitrary.mockResolvedValue({
      signature: "sig",
      pub_key: { value: "pubkey" },
    });
    
    render(<KeplrSignIn />);
    
    const dateBefore = new Date();
    await user.click(screen.getByText("Connect Keplr"));
    
    await waitFor(() => {
      const signCall = mockKeplr.signArbitrary.mock.calls[0];
      const message = signCall[2];
      
      expect(message).toContain("Address: cosmos1test");
      expect(message).toMatch(/Timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Verify timestamp is recent
      const timestampMatch = message.match(/Timestamp: (.+)$/);
      if (timestampMatch) {
        const timestamp = new Date(timestampMatch[1]);
        const dateAfter = new Date();
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(dateBefore.getTime());
        expect(timestamp.getTime()).toBeLessThanOrEqual(dateAfter.getTime());
      }
    });
  });

  it("renders download link correctly", () => {
    render(<KeplrSignIn />);
    
    const link = screen.getByRole("link", { name: "Download Keplr Wallet" });
    expect(link).toHaveAttribute("href", "https://www.keplr.app/download");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});