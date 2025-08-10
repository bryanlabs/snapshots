import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-full md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/bryanlabs-logo-transparent.png"
                alt="BryanLabs Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold">
                <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Bryan</span>
                <span className="font-light text-foreground">Labs</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Fast, reliable blockchain snapshots for Cosmos ecosystem chains. 
              Professional infrastructure for validators and developers.
            </p>
            <div className="flex items-center gap-4">
              <Link 
                href="/network" 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Network Status
              </Link>
              <Link 
                href="/contact" 
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blockchain Snapshots
                </Link>
              </li>
              <li>
                <Link href="/chains" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Available Chains
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  50-500 Mbps Downloads
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Custom Snapshots
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  4x Daily Updates
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Priority Support
                </span>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my-downloads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Download History
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                © 2024 BryanLabs. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            
            {/* Upgrade CTA in Footer */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Need faster downloads?
              </span>
              <Link 
                href="/pricing" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}