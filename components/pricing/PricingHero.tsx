'use client';

import { motion } from 'framer-motion';

export function PricingHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      {/* Desktop-first professional heading */}
      <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
        Enterprise Blockchain
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
          Infrastructure Tiers
        </span>
      </h1>
      
      <p className="text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
        Professional snapshot services for validator operators, DevOps teams, and Cosmos developers.
        <span className="block mt-3 text-blue-300 font-medium">
          Performance guarantees, priority support, and enterprise-grade reliability.
        </span>
      </p>
      
      {/* Target Audience Highlight - Professional focus */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="text-3xl mb-3">🔧</div>
          <div className="text-lg font-semibold text-white mb-2">Validator Operators</div>
          <p className="text-slate-300 text-sm">
            Fast node setup with fresh snapshots and guaranteed bandwidth for critical infrastructure.
          </p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="text-3xl mb-3">⚙️</div>
          <div className="text-lg font-semibold text-white mb-2">DevOps Teams</div>
          <p className="text-slate-300 text-sm">
            Automated workflows with API access, priority processing, and professional support channels.
          </p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="text-3xl mb-3">💻</div>
          <div className="text-lg font-semibold text-white mb-2">Cosmos Developers</div>
          <p className="text-slate-300 text-sm">
            Custom snapshots, advanced analytics, and direct access to infrastructure expertise.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
