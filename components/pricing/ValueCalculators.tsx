'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalculatorIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const scenarios = [
  {
    name: 'Solo Validator',
    nodesCount: 1,
    syncsPerMonth: 2,
    hourlyWage: 75,
    description: 'Individual validator with occasional resyncs',
  },
  {
    name: 'Small Team',
    nodesCount: 5,
    syncsPerMonth: 8,
    hourlyWage: 100,
    description: 'Small validator team with multiple chains',
  },
  {
    name: 'Infrastructure Team',
    nodesCount: 20,
    syncsPerMonth: 30,
    hourlyWage: 125,
    description: 'Enterprise team managing multiple networks',
  },
];

const tierSyncTimes = {
  free: { hours: 8, cost: 25 }, // 6h + 2h sync from staleness
  premium: { hours: 5, cost: 25 }, // 4h + 1h sync from staleness  
  ultra: { hours: 3, cost: 125 }, // 2h + 0.5h sync from staleness
};

export function ValueCalculators() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [customValues, setCustomValues] = useState({ nodes: 1, syncs: 2, wage: 75 });
  const [showCustom, setShowCustom] = useState(false);
  
  const getCurrentScenario = () => {
    if (showCustom) {
      return {
        name: 'Custom',
        nodesCount: customValues.nodes,
        syncsPerMonth: customValues.syncs,
        hourlyWage: customValues.wage,
        description: 'Your custom scenario',
      };
    }
    return scenarios[selectedScenario];
  };
  
  const calculateMonthlyCosts = (scenario: typeof scenarios[0]) => {
    const totalSyncs = scenario.nodesCount * scenario.syncsPerMonth;
    
    return {
      free: {
        timeHours: totalSyncs * tierSyncTimes.free.hours,
        laborCost: totalSyncs * tierSyncTimes.free.hours * scenario.hourlyWage,
        serviceCost: 0,
        totalCost: totalSyncs * tierSyncTimes.free.hours * scenario.hourlyWage,
      },
      premium: {
        timeHours: totalSyncs * tierSyncTimes.premium.hours,
        laborCost: totalSyncs * tierSyncTimes.premium.hours * scenario.hourlyWage,
        serviceCost: tierSyncTimes.premium.cost,
        totalCost: totalSyncs * tierSyncTimes.premium.hours * scenario.hourlyWage + tierSyncTimes.premium.cost,
      },
      ultra: {
        timeHours: totalSyncs * tierSyncTimes.ultra.hours,
        laborCost: totalSyncs * tierSyncTimes.ultra.hours * scenario.hourlyWage,
        serviceCost: tierSyncTimes.ultra.cost,
        totalCost: totalSyncs * tierSyncTimes.ultra.hours * scenario.hourlyWage + tierSyncTimes.ultra.cost,
      },
    };
  };
  
  const scenario = getCurrentScenario();
  const costs = calculateMonthlyCosts(scenario);
  const savings = {
    premium: costs.free.totalCost - costs.premium.totalCost,
    ultra: costs.free.totalCost - costs.ultra.totalCost,
  };
  
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
          📊 Value Calculator
        </CardTitle>
        <p className="text-slate-300 text-lg">
          See how much time and money you'll save
        </p>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Time is Money Message */}
        <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-xl p-4 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyDollarIcon className="w-6 h-6 text-amber-400" />
            <div className="text-lg font-semibold text-white">Time is Money in DevOps</div>
          </div>
          <p className="text-amber-200 text-sm sm:text-base">
            <strong>Every hour spent waiting for syncs is expensive.</strong> Factor in your hourly rate, 
            and suddenly that $125/month Ultra tier pays for itself with just one emergency resync.
          </p>
        </div>
        
        {/* Scenario Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white text-center">
            Choose Your Scenario
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {scenarios.map((s, index) => (
              <Button
                key={index}
                variant={selectedScenario === index && !showCustom ? "default" : "outline"}
                onClick={() => {
                  setSelectedScenario(index);
                  setShowCustom(false);
                }}
                className="h-auto p-4 text-left flex-col items-start"
              >
                <div className="font-semibold text-base mb-1">{s.name}</div>
                <div className="text-xs opacity-70 mb-2">{s.description}</div>
                <div className="text-xs">
                  {s.nodesCount} nodes • {s.syncsPerMonth} syncs/mo • ${s.hourlyWage}/hr
                </div>
              </Button>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              variant={showCustom ? "default" : "outline"}
              onClick={() => setShowCustom(!showCustom)}
              size="sm"
            >
              <CalculatorIcon className="w-4 h-4 mr-2" />
              Custom Values
            </Button>
          </div>
          
          {/* Custom Input Fields */}
          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-700/50 rounded-lg p-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Nodes</label>
                  <input
                    type="number"
                    value={customValues.nodes}
                    onChange={(e) => setCustomValues({ ...customValues, nodes: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Syncs/Month</label>
                  <input
                    type="number"
                    value={customValues.syncs}
                    onChange={(e) => setCustomValues({ ...customValues, syncs: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={customValues.wage}
                    onChange={(e) => setCustomValues({ ...customValues, wage: parseInt(e.target.value) || 50 })}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                    min="50"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Cost Breakdown */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white text-center">
            Monthly Cost Analysis: {scenario.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Tier */}
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-slate-300 mb-1">FREE</div>
                <div className="text-sm text-slate-400">Current approach</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Time spent:</span>
                  <span className="text-white font-semibold">{costs.free.timeHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Labor cost:</span>
                  <span className="text-white font-semibold">${costs.free.laborCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Service cost:</span>
                  <span className="text-white font-semibold">$0</span>
                </div>
                <div className="border-t border-slate-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-white">
                      ${costs.free.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Premium Tier */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/50">
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-blue-300 mb-1">PREMIUM</div>
                <div className="text-sm text-slate-400">5x faster bandwidth</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Time spent:</span>
                  <span className="text-white font-semibold">{costs.premium.timeHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Labor cost:</span>
                  <span className="text-white font-semibold">${costs.premium.laborCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Service cost:</span>
                  <span className="text-white font-semibold">$25</span>
                </div>
                <div className="border-t border-blue-500/30 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-white">
                      ${costs.premium.totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-green-400 font-semibold">
                      Save ${savings.premium.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ultra Tier */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/50">
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-purple-300 mb-1">ULTRA</div>
                <div className="text-sm text-slate-400">10x faster + custom</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Time spent:</span>
                  <span className="text-white font-semibold">{costs.ultra.timeHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Labor cost:</span>
                  <span className="text-white font-semibold">${costs.ultra.laborCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Service cost:</span>
                  <span className="text-white font-semibold">$125</span>
                </div>
                <div className="border-t border-purple-500/30 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-semibold">Total:</span>
                    <span className="text-xl font-bold text-white">
                      ${costs.ultra.totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-green-400 font-semibold">
                      Save ${savings.ultra.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ROI Summary */}
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-500/30">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              🎯 ROI Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-semibold text-emerald-300">
                  Premium ROI: {savings.premium > 0 ? `${Math.round((savings.premium / 25) * 100)}%` : 'N/A'}
                </div>
                <div className="text-sm text-emerald-200">
                  Pays for itself by saving {Math.round(costs.free.timeHours - costs.premium.timeHours)} hours/month
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-emerald-300">
                  Ultra ROI: {savings.ultra > 0 ? `${Math.round((savings.ultra / 125) * 100)}%` : 'N/A'}
                </div>
                <div className="text-sm text-emerald-200">
                  Pays for itself by saving {Math.round(costs.free.timeHours - costs.ultra.timeHours)} hours/month
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
