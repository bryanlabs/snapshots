'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserGroupIcon, ChatBubbleLeftRightIcon, PhoneIcon } from '@heroicons/react/24/outline';

const communityTiers = [
  {
    tier: 'FREE',
    level: 'Community Forums',
    icon: <UserGroupIcon className="w-8 h-8" />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/30',
    features: [
      'Public forum access',
      'Community-driven support',
      'Documentation and guides',
      'Best practices sharing',
    ],
    responseTime: '24-48 hours',
    availability: 'Community volunteers',
  },
  {
    tier: 'PREMIUM',
    level: 'Premium Telegram Group',
    icon: <ChatBubbleLeftRightIcon className="w-8 h-8" />,
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-br from-blue-900/30 to-purple-900/30',
    features: [
      'Exclusive Telegram group access',
      'Direct interaction with other pros',
      'Priority forum support',
      'Advanced troubleshooting',
      'Beta feature previews',
    ],
    responseTime: '4-8 hours',
    availability: 'Business hours (Mon-Fri)',
  },
  {
    tier: 'ULTRA',
    level: 'Private Group + Dan',
    icon: <PhoneIcon className="w-8 h-8" />,
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-900/30 to-pink-900/30',
    features: [
      'Private Telegram group with Dan',
      'Direct access to the founder',
      'Phone support (weekdays)',
      'Custom solution consulting',
      'Infrastructure advice',
      'Priority feature requests',
    ],
    responseTime: '1-2 hours',
    availability: '24/7 Telegram, phone on weekdays',
  },
];

export function CommunityAccess() {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
          💬 Community & Support
        </CardTitle>
        <p className="text-slate-300 text-lg">
          Get the help you need, when you need it
        </p>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Why Community Matters */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-xl p-4 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🚀</div>
            <div className="text-lg font-semibold text-white">Why Community Access Matters</div>
          </div>
          <p className="text-emerald-200 text-sm sm:text-base">
            <strong>Blockchain infrastructure is complex.</strong> Having direct access to experts 
            and other professionals can save hours of debugging time. Our Telegram groups aren't 
            just support—they're professional networks where real solutions happen in real-time.
          </p>
        </div>
        
        {/* Support Tier Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {communityTiers.map((support, index) => (
            <motion.div
              key={support.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`rounded-xl p-6 border border-slate-600 ${support.bgColor}`}
            >
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 ${support.color} mb-3`}>
                  {support.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {support.tier}
                </h3>
                <p className={`text-sm ${support.color} font-medium`}>
                  {support.level}
                </p>
              </div>
              
              {/* Features */}
              <div className="space-y-3 mb-6">
                {support.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" style={{ color: support.color.replace('text-', '') }} />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Response Time */}
              <div className="border-t border-slate-600 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Response Time:</span>
                  <span className={`text-sm font-semibold ${support.color}`}>
                    {support.responseTime}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {support.availability}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Dan's Personal Touch */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              D
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Meet Dan, Your Infrastructure Partner
              </h3>
              <p className="text-slate-300 text-sm sm:text-base mb-4">
                Hi! I'm Dan, the founder behind these snapshots. I've been running blockchain 
                infrastructure for years and understand the pain of slow syncs and unreliable data. 
                <strong className="text-purple-300"> Ultra users get direct access to me</strong> 
                — not a support ticket system, but real conversations about your infrastructure challenges.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm font-semibold text-purple-300 mb-1">
                    📨 Telegram: @danbryan80
                  </div>
                  <div className="text-xs text-slate-400">
                    Direct messages for Ultra users • Instant response
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm font-semibold text-purple-300 mb-1">
                    📞 Phone Support
                  </div>
                  <div className="text-xs text-slate-400">
                    Weekdays, for urgent issues
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Community Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              📊 Real Community Value
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <strong className="text-blue-300">“Node won't sync past block 15M?”</strong><br />
                <span className="text-xs text-slate-400">Answered in 20 minutes with specific configs</span>
              </div>
              <div>
                <strong className="text-blue-300">“Best hardware for 50-node setup?”</strong><br />
                <span className="text-xs text-slate-400">Detailed recommendations from other operators</span>
              </div>
              <div>
                <strong className="text-blue-300">“Upgrade strategy for v12 fork?”</strong><br />
                <span className="text-xs text-slate-400">Step-by-step migration guide shared</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700/50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              🌐 Professional Network
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong>100+</strong> validators and operators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span><strong>25+</strong> major blockchain projects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span><strong>Daily</strong> infrastructure discussions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span><strong>First access</strong> to new tools & features</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
