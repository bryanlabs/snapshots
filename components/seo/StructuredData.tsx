import { ChainSnapshot } from "../ui/SnapshotCard";

interface StructuredDataProps {
  type: "homepage" | "chain";
  data?: {
    chains?: ChainSnapshot[];
    chain?: ChainSnapshot;
  };
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  const generateHomepageData = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BryanLabs Blockchain Snapshots",
    description:
      "Fast, reliable blockchain snapshots for Cosmos ecosystem chains",
    url: "https://snapshots.bryanlabs.net",
    publisher: {
      "@type": "Organization",
      name: "BryanLabs",
      url: "https://bryanlabs.net",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://snapshots.bryanlabs.net/?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Blockchain Snapshots",
      description: "Collection of blockchain snapshots for Cosmos ecosystem",
      numberOfItems: data?.chains?.length || 0,
      itemListElement:
        data?.chains?.map((chain, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareApplication",
            name: `${chain.name} Snapshot`,
            description: `Blockchain snapshot for ${chain.name} (${chain.network})`,
            operatingSystem: "Linux",
            applicationCategory: "DeveloperApplication",
            downloadUrl: chain.endpoints.snapshot,
            fileSize: chain.prunedSize,
            version: chain.nodeVersion,
            releaseNotes: `Latest block: ${chain.latestBlock.toLocaleString()}`,
            dateModified: chain.updated,
          },
        })) || [],
    },
  });

  const generateChainData = (chain: ChainSnapshot) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${chain.name} Blockchain Snapshot`,
    description: `${chain.description}. Download the latest blockchain snapshot for ${chain.name} network.`,
    operatingSystem: "Linux",
    applicationCategory: "DeveloperApplication",
    downloadUrl: chain.endpoints.snapshot,
    fileSize: chain.prunedSize,
    version: chain.nodeVersion,
    releaseNotes: `Latest block: ${chain.latestBlock.toLocaleString()}`,
    dateModified: chain.updated,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    publisher: {
      "@type": "Organization",
      name: "BryanLabs",
      url: "https://bryanlabs.net",
    },
    mainEntity: {
      "@type": "Dataset",
      name: `${chain.name} Blockchain Data`,
      description: `Blockchain data snapshot for ${
        chain.name
      } network at block ${chain.latestBlock.toLocaleString()}`,
      keywords: [chain.name, "blockchain", "snapshot", "cosmos", chain.symbol],
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: {
        "@type": "Organization",
        name: "BryanLabs",
      },
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "tar.lz4",
        contentUrl: chain.endpoints.snapshot,
        contentSize: chain.prunedSize,
      },
    },
  });

  const structuredData =
    type === "homepage"
      ? generateHomepageData()
      : data?.chain
      ? generateChainData(data.chain)
      : null;

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
};
