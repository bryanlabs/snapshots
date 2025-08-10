import { verifyADR36Amino } from "@keplr-wallet/cosmos";
import { fromBase64, fromBech32 } from "@cosmjs/encoding";
import { Secp256k1, Secp256k1Signature } from "@cosmjs/crypto";
import { makeADR36AminoSignDoc, serializeSignDoc } from "@keplr-wallet/cosmos";

export interface VerifySignatureParams {
  walletAddress: string;
  signature: string;
  message: string;
  pubkey?: string;
}

/**
 * Verifies a Cosmos wallet signature using ADR-036 standard
 * @param params - The signature verification parameters
 * @returns true if signature is valid, false otherwise
 */
export async function verifyCosmosSignature({
  walletAddress,
  signature,
  message,
  pubkey,
}: VerifySignatureParams): Promise<boolean> {
  try {
    console.log("Verifying signature for wallet:", walletAddress);
    console.log("Message length:", message.length);
    console.log("Message content:", message);
    console.log("Has pubkey:", !!pubkey);
    
    // Validate wallet address format
    if (!walletAddress.startsWith("cosmos") && !walletAddress.startsWith("osmo")) {
      console.error("Invalid wallet address format");
      return false;
    }

    // Decode the signature from base64
    let signatureBytes: Uint8Array;
    try {
      console.log("Signature to decode:", signature.length, "chars");
      signatureBytes = fromBase64(signature);
      console.log("Decoded signature length:", signatureBytes.length, "bytes");
    } catch (error) {
      console.error("Failed to decode signature from base64:", error);
      return false;
    }

    // Verify signature length (should be 64 bytes for secp256k1)
    if (signatureBytes.length !== 64) {
      console.error(`Invalid signature length: ${signatureBytes.length}, expected 64`);
      return false;
    }

    // If pubkey is provided, verify it matches the address
    if (pubkey) {
      try {
        const pubkeyBytes = fromBase64(pubkey);
        // Verify the pubkey derives to the provided address
        // This is an additional security check
        const derivedAddress = await deriveAddressFromPubkey(pubkeyBytes, walletAddress);
        if (derivedAddress !== walletAddress) {
          console.error("Public key does not match wallet address");
          return false;
        }
      } catch (error) {
        console.error("Failed to verify public key:", error);
        return false;
      }
    }

    // Create the sign doc according to ADR-036
    const signDoc = makeADR36AminoSignDoc(walletAddress, message);
    const signBytes = serializeSignDoc(signDoc);

    // For ADR-036, we need to verify against the actual signer's address
    // The signature should be verifiable using the standard Cosmos SDK verification
    try {
      // Try with undefined pubkey first (Keplr often doesn't provide pubkey)
      const isValid = await verifyADR36Amino(
        walletAddress,
        message,
        signatureBytes,
        undefined  // Don't pass pubkey to avoid issues
      );
      return isValid;
    } catch (error) {
      console.error("Signature verification failed:", error);
      
      // Try alternative verification approach
      try {
        console.log("Trying alternative verification...");
        // Create a simpler verification without pubkey constraints
        const isValidAlt = await verifyADR36Amino(
          walletAddress,
          message.trim(), // Try trimmed message
          signatureBytes,
          undefined
        );
        return isValidAlt;
      } catch (altError) {
        console.error("Alternative verification also failed:", altError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error during signature verification:", error);
    return false;
  }
}

/**
 * Derives a Cosmos address from a public key
 * @param pubkeyBytes - The public key bytes
 * @param prefix - The address prefix (e.g., "cosmos", "osmo")
 * @returns The derived address
 */
async function deriveAddressFromPubkey(
  pubkeyBytes: Uint8Array,
  originalAddress: string
): Promise<string> {
  // Extract the prefix from the original address
  const { prefix } = fromBech32(originalAddress);
  
  // Import the address derivation logic
  const { pubkeyToAddress } = await import("@cosmjs/amino");
  
  // Derive the address
  const derivedAddress = pubkeyToAddress(
    {
      type: "tendermint/PubKeySecp256k1",
      value: Buffer.from(pubkeyBytes).toString("base64"),
    },
    prefix
  );
  
  return derivedAddress;
}

/**
 * Validates the message format and content
 * @param message - The message that was signed
 * @returns true if message is valid
 */
export function validateSignatureMessage(message: string): boolean {
  // Ensure the message contains expected content to prevent replay attacks
  const expectedPrefix = "Sign this message to authenticate with Snapshots Service";
  if (!message.includes(expectedPrefix)) {
    return false;
  }

  // Check for timestamp in message to prevent old signatures
  // Message format: "Sign this message to authenticate with Snapshots Service\n\nTimestamp: <ISO timestamp>"
  const timestampMatch = message.match(/Timestamp: (.+)$/);
  if (!timestampMatch) {
    return false;
  }

  try {
    const timestamp = new Date(timestampMatch[1]);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Reject if timestamp is more than 5 minutes old
    if (timestamp < fiveMinutesAgo) {
      console.error("Signature timestamp is too old");
      return false;
    }

    // Reject if timestamp is in the future (with 1 minute tolerance for clock skew)
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
    if (timestamp > oneMinuteFromNow) {
      console.error("Signature timestamp is in the future");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Invalid timestamp in signature message:", error);
    return false;
  }
}