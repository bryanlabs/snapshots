'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClockIcon } from '@heroicons/react/24/outline';

const snapshotSchedules = [
  {
    tier: 'FREE',
    schedule: 'Daily',
    times: ['12:00 UTC'],
    staleness: 'Up to 24 hours',
    color: 'bg-slate-500',
    description: 'Community schedule',
  },
  {
    tier: 'PREMIUM',
    schedule: 'Twice Daily',
    times: ['00:00 UTC', '12:00 UTC'],
    staleness: 'Up to 12 hours',
    color: 'bg-gradient-to-r from-blue-500 to-purple-500',
    description: 'Business hours coverage',
  },
  {
    tier: 'ULTRA',
    schedule: 'Every 6 Hours',
    times: ['00:00', '06:00', '12:00', '18:00'],
    staleness: 'Up to 6 hours',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Near real-time + custom requests',
  },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => i);

export function SnapshotTimeline() {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
          🕰️ Snapshot Freshness
        </CardTitle>
        <p className="text-slate-300 text-lg">
          How fresh is your blockchain data?
        </p>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Data Staleness Impact */}
        <div className="bg-gradient-to-r from-amber-900/50 to-red-900/50 rounded-xl p-4 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-6 h-6 text-amber-400" />
            <div className="text-lg font-semibold text-white">Why Freshness Matters</div>
          </div>
          <p className="text-amber-200 text-sm sm:text-base">
            <strong>Stale snapshots = longer sync times.</strong> A 24-hour-old snapshot 
            means your node needs to process an extra day of blocks. With Ultra's 6-hour 
            snapshots, you're always close to the chain tip.
          </p>
        </div>
        
        {/* 24-Hour Timeline Visualization */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white text-center">
            24-Hour Snapshot Schedule
          </h3>
          
          {/* Timeline Grid */}
          <div className="bg-slate-900/50 rounded-xl p-4 overflow-x-auto">
            <div className="min-w-full">
              {/* Hour Labels */}
              <div className="flex justify-between text-xs text-slate-400 mb-2 min-w-[600px]">
                {timeSlots.map(hour => (
                  <div key={hour} className="text-center w-6">
                    {hour.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
              
              {/* Tier Timelines */}
              <div className="space-y-4">
                {snapshotSchedules.map((schedule, scheduleIndex) => (
                  <motion.div
                    key={schedule.tier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: scheduleIndex * 0.2 }}
                    className="space-y-2"
                  >
                    {/* Tier Label */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-sm text-white w-20">
                        {schedule.tier}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {schedule.description}
                      </span>
                    </div>
                    
                    {/* Timeline Bar */}
                    <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden min-w-[600px]">
                      {timeSlots.map(hour => {
                        const isSnapshotTime = schedule.times.some(time => {
                          const snapHour = parseInt(time.split(':')[0]);
                          return snapHour === hour;
                        });
                        
                        return (
                          <div
                            key={hour}
                            className={`absolute top-0 h-full w-6 flex items-center justify-center ${
                              isSnapshotTime
                                ? `${schedule.color} border-l border-r border-white/20`
                                : 'border-r border-slate-700'
                            }`}
                            style={{ left: `${(hour / 24) * 100}%` }}
                          >
                            {isSnapshotTime && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: scheduleIndex * 0.2 + hour * 0.05 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Staleness Indicator */}
                    <div className="text-xs text-slate-400 text-right">
                      Max staleness: <span className="text-white">{schedule.staleness}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Custom Snapshots (Ultra Only) */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🎯</div>
            <div className="text-lg font-semibold text-white">Ultra: Custom Snapshots</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Any Block Height</h4>
              <p className="text-slate-300 text-sm">
                Need a snapshot from a specific block for debugging? 
                Ultra users can request snapshots from any historical block height.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Custom Pruning</h4>
              <p className="text-slate-300 text-sm">
                Choose your pruning strategy: none, default, everything, or custom configurations. 
                Perfect for different node roles.
              </p>
            </div>
          </div>
        </div>
        
        {/* Sync Time Calculator */}
        <div className="bg-slate-700/50 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            ⏱️ Sync Time Impact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-300 mb-1">FREE</div>
              <div className="text-sm text-slate-400">24h staleness</div>
              <div className="text-lg text-white mt-2">+4-6 hours sync</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-300 mb-1">PREMIUM</div>
              <div className="text-sm text-slate-400">12h staleness</div>
              <div className="text-lg text-white mt-2">+2-3 hours sync</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-300 mb-1">ULTRA</div>
              <div className="text-sm text-slate-400">6h staleness</div>
              <div className="text-lg text-white mt-2">+1 hour sync</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
