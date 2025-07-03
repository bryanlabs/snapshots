import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Chain Not Found
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            The blockchain you're looking for doesn't exist in our snapshot
            collection.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Available Chains
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            We currently support snapshots for these popular Cosmos ecosystem
            chains:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-left text-muted-foreground">
              • CosmosHub
              <br />
              • Osmosis
              <br />
              • Juno
              <br />• Stargaze
            </div>
            <div className="text-left text-muted-foreground">
              • Akash
              <br />
              • Persistence
              <br />
              • Secret Network
              <br />• Injective
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Browse All Snapshots
          </Link>
          <Link
            href="/"
            className="block w-full bg-slate-100 hover:bg-slate-200 text-foreground font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            Don't see your chain? <br />
            <a
              href="mailto:hello@bryanlabs.net"
              className="text-accent hover:text-accent/80 underline"
            >
              Contact us
            </a>{" "}
            to request new chain support.
          </p>
        </div>
      </div>
    </div>
  );
}
