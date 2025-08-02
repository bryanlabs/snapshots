'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const bandwidthTiers = [
  {
    tier: 'FREE',
    bandwidth: 50,
    color: 'bg-slate-500',
    textColor: 'text-slate-300',
    downloadTime: '~20 min',
    description: 'Community shared pool',
  },
  {
    tier: 'PREMIUM',
    bandwidth: 250,
    color: 'bg-gradient-to-r from-blue-500 to-purple-500',
    textColor: 'text-blue-300',
    downloadTime: '~4 min',
    description: '5x faster downloads',
  },
  {
    tier: 'ULTRA',
    bandwidth: 500,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-purple-300',
    downloadTime: '~2 min',
    description: '10x faster downloads',
  },
];

export function BandwidthVisualization() {
  const maxBandwidth = Math.max(...bandwidthTiers.map(t => t.bandwidth));
  
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
          📡 Bandwidth Guarantees
        </CardTitle>
        <p className="text-slate-300 text-lg">
          Dedicated bandwidth pools for consistent performance
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Performance Promise */}
        <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">⚙️</div>
            <div className="text-lg font-semibold text-white">Performance Promise</div>
          </div>
          <p className="text-green-300 text-sm sm:text-base">
            <strong>Guaranteed bandwidth allocations</strong> mean no throttling during peak hours.
            Your tier's speed is always available, even when others are downloading.
          </p>
        </div>
        
        {/* Bandwidth Comparison */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white text-center mb-6">
            Download Speed Comparison
          </h3>
          
          {bandwidthTiers.map((tier, index) => (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="space-y-2"
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${tier.textColor}`}>
                    {tier.tier}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {tier.description}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{tier.bandwidth} Mbps</div>
                  <div className="text-slate-400 text-sm">{tier.downloadTime}</div>
                </div>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="relative bg-slate-700 rounded-full h-8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(tier.bandwidth / maxBandwidth) * 100}%` }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 1, ease: "easeOut" }}
                  className={`h-full ${tier.color} flex items-center justify-end pr-3`}
                >
                  <span className="text-white text-sm font-semibold">
                    {tier.bandwidth} Mbps
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Real-world Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-lg font-semibold text-white mb-2">
              🕰️ Typical Download Size
            </div>
            <div className="text-slate-300 text-sm">
              <strong>Cosmos Hub snapshot:</strong> ~40GB compressed<br />
              <strong>Osmosis snapshot:</strong> ~25GB compressed<br />
              <strong>Juno snapshot:</strong> ~15GB compressed
            </div>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-lg font-semibold text-white mb-2">
              🌍 Global CDN
            </div>
            <div className="text-slate-300 text-sm">
              Delivered from the edge location closest to you.<br />
              <strong>Regions:</strong> US East, US West, Europe, Asia<br />
              <strong>Uptime:</strong> 99.9% SLA guarantee
            </div>
          </div>
        </div>
        
        {/* Mobile SRE Context */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📱</div>
            <div className="text-lg font-semibold text-white">SRE on the Go</div>
          </div>
          <p className="text-slate-300 text-sm">
            Even with mobile hotspot limitations, our CDN optimization ensures 
            <strong className="text-blue-300"> maximum throughput on any connection</strong>. 
            Perfect for emergency syncs during off-hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
