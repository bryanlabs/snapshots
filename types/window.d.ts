interface Window {
  keplr?: {
    enable(chainId: string): Promise<void>;
    signArbitrary(
      chainId: string,
      signerAddress: string,
      data: string | Uint8Array
    ): Promise<{
      pub_key: {
        type: string;
        value: string;
      };
      signature: string;
    }>;
    getKey(chainId: string): Promise<{
      name: string;
      algo: string;
      pubKey: Uint8Array;
      address: Uint8Array;
      bech32Address: string;
    }>;
  };
}