/**
 * NetworkModal Usage Examples
 * 
 * This file demonstrates how to use the NetworkModal component in different contexts.
 * It's not included in the build, just for documentation purposes.
 */

import { NetworkModal } from './NetworkModal';
import { Button } from '@/components/ui/button';

// Example 1: Default trigger button
export function DefaultNetworkModal() {
  return <NetworkModal />;
}

// Example 2: Custom trigger text
export function CustomTextNetworkModal() {
  return <NetworkModal triggerText="View Network Details" />;
}

// Example 3: Custom trigger component
export function CustomTriggerNetworkModal() {
  const customTrigger = (
    <Button variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
      🌐 DACS-IX Network
    </Button>
  );
  
  return <NetworkModal trigger={customTrigger} />;
}

// Example 4: Inline trigger (as link text)
export function InlineNetworkModal() {
  const inlineTrigger = (
    <button className="text-primary hover:text-primary/80 underline">
      powered by DACS-IX
    </button>
  );
  
  return <NetworkModal trigger={inlineTrigger} />;
}

// Example 5: In a chain card footer
export function ChainCardWithNetwork() {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <h3 className="font-semibold">Osmosis Chain</h3>
      <p className="text-sm text-muted-foreground">Latest snapshot available</p>
      <div className="flex justify-between items-center mt-4">
        <Button>Download</Button>
        <NetworkModal triggerText="Network Info" />
      </div>
    </div>
  );
}