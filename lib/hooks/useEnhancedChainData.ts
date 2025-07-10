import { useState, useEffect, useMemo } from "react";
import { ChainConfig } from "@/lib/data/chains";
import { fetchChainDetails, PolkachuChainDetail } from "@/lib/api/polkachu";

interface UseEnhancedChainDataResult {
  enrichedChain: ChainConfig;
  liveData: PolkachuChainDetail | null;
  isLoadingLive: boolean;
  liveDataError: string | null;
  enhancedInfo: Array<{
    label: string;
    value: string | string[];
    type: "gas";
    isArray: boolean;
  }> | null;
}

// Utility function to merge static config with live data
function mergeChainData(
  staticConfig: ChainConfig,
  liveData?: PolkachuChainDetail | null
): ChainConfig {
  if (!liveData) return staticConfig;

  return {
    ...staticConfig,
    // Update description if live data has a better one
    description: liveData.description || staticConfig.description,

    // Update binary info with live data
    binary: {
      ...staticConfig.binary,
      version: liveData.node_version || staticConfig.binary.version,
    },

    // Keep static logo as fallback, prefer live logo if available
    logo: liveData.logo || staticConfig.logo,

    // Update GitHub if available
    github: liveData.github || staticConfig.github,

    // Enhance network data with live information
    networks: {
      ...staticConfig.networks,
      mainnet: staticConfig.networks.mainnet
        ? {
            ...staticConfig.networks.mainnet,
            chainId: liveData.chain_id || staticConfig.networks.mainnet.chainId,
            // Keep static block data for now, could estimate live blocks in future
            rpcEndpoints: {
              // Use live RPC endpoints if available, fallback to static
              primary:
                liveData.polkachu_services?.rpc?.url ||
                staticConfig.networks.mainnet.rpcEndpoints.primary,
              secondary:
                liveData.polkachu_services?.api?.url ||
                staticConfig.networks.mainnet.rpcEndpoints.secondary,
            },
          }
        : undefined,
    },
  };
}

// Utility to format gas price for better readability
function formatGasPrice(gasPrice: string): string {
  const trimmed = gasPrice.trim();
  if (!trimmed) return gasPrice;

  // Handle IBC denoms: 0.025ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2
  const ibcRegex = /^([\d.]+)(ibc\/[A-Z0-9]{15,})$/;
  const ibcMatch = trimmed.match(ibcRegex);
  if (ibcMatch) {
    const [, amount, ibcDenom] = ibcMatch;
    const hash = ibcDenom.replace("ibc/", "");
    const truncatedIbc = `ibc/${hash.substring(0, 8)}...${hash.substring(
      hash.length - 4
    )}`;
    return `${amount} ${truncatedIbc}`;
  }

  // Handle factory addresses: 0.01186factory/kujira1qk00h5atutpsv900x202pxx42npjr9thg58dnqpa72f2p7m2luase444a7/uusk
  const factoryRegex =
    /^([\d.]+)(factory\/[a-zA-Z0-9]{1,15})([a-zA-Z0-9]{25,})(\/.+)$/;
  const factoryMatch = trimmed.match(factoryRegex);
  if (factoryMatch) {
    const [, amount, prefix, longAddress, suffix] = factoryMatch;
    const truncatedAddress = longAddress.substring(0, 4) + "...";
    return `${amount} ${prefix}${truncatedAddress}${suffix}`;
  }

  // Handle very long contract addresses (cosmwasm style)
  const contractRegex = /^([\d.]+)([a-zA-Z0-9]{40,})$/;
  const contractMatch = trimmed.match(contractRegex);
  if (contractMatch) {
    const [, amount, address] = contractMatch;
    const truncatedAddress = `${address.substring(0, 8)}...${address.substring(
      address.length - 4
    )}`;
    return `${amount} ${truncatedAddress}`;
  }

  // For regular denoms, add space between amount and denom
  const regularRegex = /^([\d.]+)([a-zA-Z][a-zA-Z0-9]*)$/;
  const regularMatch = trimmed.match(regularRegex);
  if (regularMatch) {
    const [, amount, denom] = regularMatch;
    return `${amount} ${denom}`;
  }

  // Fallback: return as-is but trimmed
  return trimmed;
}

// Utility to parse minimum gas prices
function parseMinimumGasPrices(gasPrice: string): string[] {
  if (!gasPrice) return [];

  // Handle various formats like "0.001uatom,0.002utoken" or "0.001uatom"
  return gasPrice
    .split(",")
    .map((price) => formatGasPrice(price.trim()))
    .filter((p) => p.length > 0);
}

// Hook to enhance chain data with live information
export function useEnhancedChainData(
  staticConfig: ChainConfig,
  chainId: string
): UseEnhancedChainDataResult {
  const [liveData, setLiveData] = useState<PolkachuChainDetail | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);

  // Fetch live data from Polkachu
  useEffect(() => {
    let isMounted = true;

    const fetchLiveData = async () => {
      try {
        setIsLoadingLive(true);
        setLiveDataError(null);

        const data = await fetchChainDetails(chainId);

        if (isMounted) {
          if (data) {
            setLiveData(data);
          } else {
            setLiveDataError("Chain not found in Polkachu API");
          }
        }
      } catch (error) {
        if (isMounted) {
          setLiveDataError(
            error instanceof Error ? error.message : "Failed to fetch live data"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingLive(false);
        }
      }
    };

    fetchLiveData();

    return () => {
      isMounted = false;
    };
  }, [chainId]);

  // Merge static and live data
  const enrichedChain = useMemo(
    () => mergeChainData(staticConfig, liveData),
    [staticConfig, liveData]
  );

  // Generate enhanced info sections with live data
  const enhancedInfo = useMemo(() => {
    if (!liveData) return null;

    const enhancements = [];

    if (liveData.minimum_gas_price) {
      const gasPrices = parseMinimumGasPrices(liveData.minimum_gas_price);
      if (gasPrices.length > 0) {
        enhancements.push({
          label: "Min Gas Price",
          value: gasPrices[0],
          type: "gas" as const,
          isArray: false,
        });
      }
    }

    return enhancements.length > 0 ? enhancements : null;
  }, [liveData]);

  return {
    enrichedChain,
    liveData,
    isLoadingLive,
    liveDataError,
    enhancedInfo,
  };
}
