import { verifyCosmosSignature, validateSignatureMessage, VerifySignatureParams } from "../cosmos-verify";
import { verifyADR36Amino } from "@keplr-wallet/cosmos";
import { fromBase64, fromBech32 } from "@cosmjs/encoding";
import { makeADR36AminoSignDoc, serializeSignDoc } from "@keplr-wallet/cosmos";

// Mock all external dependencies
jest.mock("@keplr-wallet/cosmos");
jest.mock("@cosmjs/encoding");
jest.mock("@cosmjs/amino", () => ({
  pubkeyToAddress: jest.fn(),
}));

const mockVerifyADR36Amino = verifyADR36Amino as jest.MockedFunction<typeof verifyADR36Amino>;
const mockFromBase64 = fromBase64 as jest.MockedFunction<typeof fromBase64>;
const mockFromBech32 = fromBech32 as jest.MockedFunction<typeof fromBech32>;
const mockMakeADR36AminoSignDoc = makeADR36AminoSignDoc as jest.MockedFunction<typeof makeADR36AminoSignDoc>;
const mockSerializeSignDoc = serializeSignDoc as jest.MockedFunction<typeof serializeSignDoc>;

describe("Cosmos Signature Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("validateSignatureMessage", () => {
    it("should accept valid message with recent timestamp", () => {
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${new Date().toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(true);
    });

    it("should reject message without expected prefix", () => {
      const message = `Wrong message\n\nTimestamp: ${new Date().toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(false);
    });

    it("should reject message without timestamp", () => {
      const message = "Sign this message to authenticate with Snapshots Service";
      expect(validateSignatureMessage(message)).toBe(false);
    });

    it("should reject message with old timestamp", () => {
      const oldDate = new Date();
      oldDate.setMinutes(oldDate.getMinutes() - 10); // 10 minutes ago
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${oldDate.toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Signature timestamp is too old");
    });

    it("should reject message with future timestamp", () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5); // 5 minutes in future
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${futureDate.toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Signature timestamp is in the future");
    });

    it("should accept message with timestamp within 1 minute in future (clock skew)", () => {
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 30); // 30 seconds in future
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${futureDate.toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(true);
    });

    it("should reject message with invalid timestamp format", () => {
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: not-a-date`;
      expect(validateSignatureMessage(message)).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Invalid timestamp in signature message:", expect.any(Error));
    });

    it("should handle edge case of exactly 5 minutes old", () => {
      const oldDate = new Date();
      oldDate.setTime(oldDate.getTime() - 5 * 60 * 1000 - 1); // 5 minutes and 1ms ago
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${oldDate.toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(false);
    });

    it("should handle edge case of exactly 1 minute future", () => {
      const futureDate = new Date();
      futureDate.setTime(futureDate.getTime() + 60 * 1000 + 1); // 1 minute and 1ms future
      const message = `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${futureDate.toISOString()}`;
      expect(validateSignatureMessage(message)).toBe(false);
    });
  });

  describe("verifyCosmosSignature", () => {
    const validSignature = new Uint8Array(64); // 64 bytes for secp256k1
    const validPubkey = new Uint8Array(33); // 33 bytes compressed pubkey
    
    const mockParams: VerifySignatureParams = {
      walletAddress: "cosmos1example",
      signature: "validBase64Signature",
      message: `Sign this message to authenticate with Snapshots Service\n\nTimestamp: ${new Date().toISOString()}`,
      pubkey: "validBase64Pubkey",
    };

    beforeEach(() => {
      // Setup default successful mocks
      mockFromBase64.mockReturnValue(validSignature);
      mockFromBech32.mockReturnValue({ prefix: "cosmos", data: new Uint8Array() });
      mockVerifyADR36Amino.mockResolvedValue(true);
      mockMakeADR36AminoSignDoc.mockReturnValue({} as any);
      mockSerializeSignDoc.mockReturnValue(new Uint8Array());
      
      // Mock dynamic import
      const { pubkeyToAddress } = require("@cosmjs/amino");
      pubkeyToAddress.mockReturnValue("cosmos1example");
    });

    it("should verify valid cosmos signature", async () => {
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(true);
      expect(mockVerifyADR36Amino).toHaveBeenCalledWith(
        "cosmos1example",
        mockParams.message,
        validSignature,
        validPubkey
      );
    });

    it("should verify valid osmosis signature", async () => {
      const osmoParams = { ...mockParams, walletAddress: "osmo1example" };
      mockFromBech32.mockReturnValue({ prefix: "osmo", data: new Uint8Array() });
      const { pubkeyToAddress } = require("@cosmjs/amino");
      pubkeyToAddress.mockReturnValue("osmo1example");
      
      const result = await verifyCosmosSignature(osmoParams);
      expect(result).toBe(true);
    });

    it("should verify signature without pubkey", async () => {
      const paramsWithoutPubkey = { ...mockParams, pubkey: undefined };
      const result = await verifyCosmosSignature(paramsWithoutPubkey);
      expect(result).toBe(true);
      expect(mockVerifyADR36Amino).toHaveBeenCalledWith(
        "cosmos1example",
        mockParams.message,
        validSignature,
        undefined
      );
    });

    it("should reject invalid wallet address format", async () => {
      const result = await verifyCosmosSignature({
        ...mockParams,
        walletAddress: "invalid-address",
      });
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Invalid wallet address format");
    });

    it("should reject invalid base64 signature", async () => {
      mockFromBase64.mockImplementation(() => {
        throw new Error("Invalid base64");
      });
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Failed to decode signature from base64:", expect.any(Error));
    });

    it("should reject signature with wrong length", async () => {
      mockFromBase64.mockReturnValue(new Uint8Array(32)); // Wrong length
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Invalid signature length: 32, expected 64");
    });

    it("should reject when pubkey doesn't match address", async () => {
      const { pubkeyToAddress } = require("@cosmjs/amino");
      pubkeyToAddress.mockReturnValue("cosmos1different");
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Public key does not match wallet address");
    });

    it("should handle pubkey decoding error", async () => {
      mockFromBase64.mockImplementation((input) => {
        if (input === mockParams.pubkey) {
          throw new Error("Invalid pubkey base64");
        }
        return validSignature;
      });
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Failed to verify public key:", expect.any(Error));
    });

    it("should handle pubkey derivation error", async () => {
      const { pubkeyToAddress } = require("@cosmjs/amino");
      pubkeyToAddress.mockImplementation(() => {
        throw new Error("Derivation failed");
      });
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Failed to verify public key:", expect.any(Error));
    });

    it("should handle verification failure", async () => {
      mockVerifyADR36Amino.mockResolvedValue(false);
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
    });

    it("should handle verification error", async () => {
      mockVerifyADR36Amino.mockRejectedValue(new Error("Verification failed"));
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Signature verification failed:", expect.any(Error));
    });

    it("should handle unexpected errors", async () => {
      mockMakeADR36AminoSignDoc.mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Error during signature verification:", expect.any(Error));
    });

    it("should properly decode and pass pubkey when provided", async () => {
      mockFromBase64.mockImplementation((input) => {
        if (input === mockParams.signature) return validSignature;
        if (input === mockParams.pubkey) return validPubkey;
        return new Uint8Array();
      });
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(true);
      expect(mockFromBase64).toHaveBeenCalledWith(mockParams.pubkey);
    });

    it("should handle fromBech32 error", async () => {
      mockFromBech32.mockImplementation(() => {
        throw new Error("Invalid bech32");
      });
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Failed to verify public key:", expect.any(Error));
    });

    it("should handle empty signature", async () => {
      mockFromBase64.mockReturnValue(new Uint8Array(0));
      
      const result = await verifyCosmosSignature(mockParams);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Invalid signature length: 0, expected 64");
    });

    it("should call makeADR36AminoSignDoc and serializeSignDoc", async () => {
      const mockSignDoc = { test: "doc" };
      const mockSerializedDoc = new Uint8Array([1, 2, 3]);
      mockMakeADR36AminoSignDoc.mockReturnValue(mockSignDoc as any);
      mockSerializeSignDoc.mockReturnValue(mockSerializedDoc);
      
      await verifyCosmosSignature(mockParams);
      
      expect(mockMakeADR36AminoSignDoc).toHaveBeenCalledWith("cosmos1example", mockParams.message);
      expect(mockSerializeSignDoc).toHaveBeenCalledWith(mockSignDoc);
    });
  });
});