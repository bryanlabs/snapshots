'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface NetworkModalProps {
  trigger?: React.ReactNode;
  triggerText?: string;
}

const majorPeers = [
  { name: "AWS", icon: "🟠" },
  { name: "Google", icon: "🔵" },
  { name: "Azure", icon: "🔷" },
  { name: "Cloudflare", icon: "🟠" },
  { name: "Apple", icon: "🍎" },
  { name: "Netflix", icon: "🔴" },
];

const exchanges = [
  "Equinix IX (Ashburn)",
  "NYIIX (New York)",
  "FCIX (Fremont)",
];

export function NetworkModal({ trigger, triggerText = "Network Info" }: NetworkModalProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      {triggerText}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Global Network Infrastructure</DialogTitle>
          <DialogDescription>
            Enterprise-grade connectivity powered by DACS-IX peering fabric
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* DACS-IX Partnership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414L11.414 11l3.293 3.293a1 1 0 01-1.414 1.414L10 12.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 11 5.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                DACS-IX Partnership
              </CardTitle>
              <CardDescription>
                Direct peering through independent Internet Exchanges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Connected Exchanges</h4>
                  <div className="space-y-1">
                    {exchanges.map((exchange, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {exchange}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Port Speeds</h4>
                  <div className="flex flex-wrap gap-2">
                    {["1G", "10G", "40G", "100G"].map((speed) => (
                      <span 
                        key={speed} 
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                      >
                        {speed}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Major Peers */}
          <Card>
            <CardHeader>
              <CardTitle>Major Peering Partners</CardTitle>
              <CardDescription>
                Direct connections to leading cloud providers and CDNs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {majorPeers.map((peer, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <span className="text-lg">{peer.icon}</span>
                    <span className="text-sm font-medium">{peer.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <span className="text-lg">+</span>
                  <span className="text-sm font-medium">Many more</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                Regional Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Data Center Locations</h4>
                  <div className="space-y-1 text-sm">
                    <div>🏢 Ashburn, VA - Primary hub</div>
                    <div>🏢 Reston, VA - Secondary</div>
                    <div>🏢 Baltimore, MD - Regional</div>
                    <div>🏢 Silver Spring, MD - Operations</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">BGP Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>AS Number: <code className="px-1 py-0.5 bg-muted rounded text-xs">AS 401711</code></div>
                    <div>
                      Registry: <Link 
                        href="https://whois.arin.net/rest/asn/AS401711" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        ARIN →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Operations Center</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div>📍 12401 Prosperity Dr, Silver Spring, MD 20904</div>
                <div>📞 (410) 760-3447</div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Learn more about our infrastructure
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/network">
                  Full Details
                </Link>
              </Button>
              <Button 
                size="sm" 
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}