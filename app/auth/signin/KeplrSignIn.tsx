"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    keplr?: any;
  }
}

export function KeplrSignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isKeplrAvailable, setIsKeplrAvailable] = useState(false);

  useEffect(() => {
    // Check if Keplr is available
    if (window.keplr) {
      setIsKeplrAvailable(true);
    } else {
      // Listen for Keplr to be loaded
      const checkKeplr = setInterval(() => {
        if (window.keplr) {
          setIsKeplrAvailable(true);
          clearInterval(checkKeplr);
        }
      }, 100);

      // Clean up after 3 seconds
      setTimeout(() => clearInterval(checkKeplr), 3000);
    }
  }, []);

  const handleWalletSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!window.keplr) {
        throw new Error("Please install Keplr wallet extension");
      }

      // Enable Keplr for Cosmos Hub
      const chainId = "cosmoshub-4";
      await window.keplr.enable(chainId);

      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const account = accounts[0];
      
      // Create a message to sign
      const message = `Sign in to Snapshots\n\nAddress: ${account.address}\nTimestamp: ${new Date().toISOString()}`;
      
      // Sign the message with Keplr
      const signature = await window.keplr.signArbitrary(
        chainId,
        account.address,
        message
      );

      if (!signature) {
        throw new Error("Failed to sign message");
      }

      // Authenticate with our backend
      const response = await fetch("/api/v1/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account.address,
          signature: signature.signature,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Authentication failed");
      }

      // Sign in with NextAuth
      const result = await signIn("wallet", {
        walletAddress: account.address,
        signature: signature.signature,
        message,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Wallet sign in error:", error);
      setError(error.message || "Failed to sign in with wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Keplr wallet to sign in
        </p>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <Button
          onClick={handleWalletSignIn}
          className="w-full"
          disabled={isLoading || !isKeplrAvailable}
        >
          {isLoading ? "Signing in..." : 
           !isKeplrAvailable ? "Install Keplr Wallet" : 
           "Connect Keplr"}
        </Button>
        {!isKeplrAvailable && (
          <p className="text-xs text-muted-foreground">
            <a 
              href="https://www.keplr.app/download" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download Keplr Wallet
            </a>
          </p>
        )}
      </div>
    </div>
  );
}