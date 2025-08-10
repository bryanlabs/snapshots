'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    category: 'Pricing & Billing',
    questions: [
      {
        question: 'How do I upgrade to Premium or Ultra?',
        answer: 'Contact us through email (hello@bryanlabs.net) or Telegram (@danbryan80). We\'ll manually upgrade your account within 24 hours. Automated billing via Stripe is coming soon for instant upgrades.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'Currently we accept cryptocurrency payments (BTC, ETH, USDC) and bank transfers. Once Stripe integration is complete, we\'ll accept all major credit cards. Enterprise customers can arrange for invoicing.',
      },
      {
        question: 'Can I cancel anytime?',
        answer: 'Yes! Premium and Ultra subscriptions can be cancelled at any time. You\'ll retain full access until the end of your billing period, then automatically downgrade to the free tier.',
      },
      {
        question: 'Do you offer annual discounts?',
        answer: 'Yes! Annual subscriptions receive a 20% discount. Premium becomes $240/year (save $60) and Ultra becomes $1,200/year (save $300). Contact us to set up annual billing.',
      },
    ],
  },
  {
    category: 'Technical Features',
    questions: [
      {
        question: 'How are bandwidth limits enforced?',
        answer: 'Each tier has a dedicated bandwidth pool. Free users share a 50 Mbps pool, Premium users share a 250 Mbps pool, and Ultra users share a 500 Mbps pool. These are guarantees, not limits—you may get faster speeds during off-peak times.',
      },
      {
        question: 'What\'s included in "custom snapshots"?',
        answer: 'Ultra users can request snapshots from any block height with custom pruning configurations (none, default, everything, or custom). Processing time is typically 2-6 hours depending on chain size and complexity.',
      },
      {
        question: 'How do API rate limits work?',
        answer: 'API limits are enforced per hour with burst capacity. Free: 50/hour (10 burst), Premium: 500/hour (100 burst), Ultra: 2,000/hour (500 burst). Burst allows temporary spikes above your hourly rate.',
      },
      {
        question: 'Which blockchains are supported?',
        answer: 'All tiers support the same blockchains: Cosmos Hub, Osmosis, Juno, Terra, Noble, Kujira, Thorchain, and more. We add new chains based on community demand and validator adoption.',
      },
    ],
  },
  {
    category: 'Support & Community',
    questions: [
      {
        question: 'What\'s the difference between support tiers?',
        answer: 'Free users access community forums. Premium users join an exclusive Telegram group with other professionals. Ultra users get private Telegram access to Dan (the founder) plus phone support during business hours.',
      },
      {
        question: 'How quickly will I get help?',
        answer: 'Free: 24-48 hours via community. Premium: 4-8 hours via Telegram during business hours. Ultra: 1-2 hours via private Telegram, with phone support for urgent issues on weekdays.',
      },
      {
        question: 'Can I switch tiers anytime?',
        answer: 'Yes! Upgrades are instant once processed. Downgrades take effect at the end of your current billing period. You\'ll never lose access mid-cycle.',
      },
    ],
  },
  {
    category: 'Enterprise & Teams',
    questions: [
      {
        question: 'Do you offer enterprise plans?',
        answer: 'Yes! For teams managing 50+ nodes or requiring custom SLAs, we offer enterprise plans starting at $500/month. This includes dedicated bandwidth, custom snapshot schedules, and direct integration support.',
      },
      {
        question: 'Can multiple team members share an account?',
        answer: 'Individual accounts are designed for personal use. For team access, we recommend our enterprise plans which include multi-user dashboards, usage analytics, and centralized billing.',
      },
      {
        question: 'Do you provide infrastructure consulting?',
        answer: 'Ultra and enterprise customers receive infrastructure consulting as part of their support. This includes architecture reviews, optimization recommendations, and help with complex deployment scenarios.',
      },
    ],
  },
];

export function PricingFAQ() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
          ❓ Frequently Asked Questions
        </CardTitle>
        <p className="text-slate-300 text-lg">
          Everything you need to know about our pricing and features
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {faqs.map((category, categoryIndex) => (
          <div key={category.category} className="space-y-4">
            {/* Category Header */}
            <button
              onClick={() => setOpenCategory(
                openCategory === category.category ? null : category.category
              )}
              className="w-full flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white text-left">
                {category.category}
              </h3>
              <ChevronDownIcon 
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  openCategory === category.category ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {/* Category Questions */}
            <AnimatePresence>
              {openCategory === category.category && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {category.questions.map((faq, questionIndex) => {
                    const questionKey = `${category.category}-${questionIndex}`;
                    
                    return (
                      <div
                        key={questionKey}
                        className="bg-slate-800/50 rounded-lg border border-slate-600/50"
                      >
                        <button
                          onClick={() => setOpenQuestion(
                            openQuestion === questionKey ? null : questionKey
                          )}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
                        >
                          <span className="text-white font-medium pr-4">
                            {faq.question}
                          </span>
                          <ChevronDownIcon 
                            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                              openQuestion === questionKey ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                        
                        <AnimatePresence>
                          {openQuestion === questionKey && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 pb-4"
                            >
                              <div className="text-slate-300 leading-relaxed">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        
        {/* Still have questions? */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Still have questions?
          </h3>
          <p className="text-slate-300 mb-4">
            Our team is here to help! Reach out through any of these channels:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="mailto:hello@bryanlabs.net"
              className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors text-blue-300 hover:text-blue-200"
            >
              <span>📧</span>
              <span>Email Support</span>
            </a>
            <a
              href="https://t.me/danbryan80"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors text-blue-300 hover:text-blue-200"
            >
              <span>📨</span>
              <span>Telegram</span>
            </a>
            <a
              href="/contact"
              className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors text-blue-300 hover:text-blue-200"
            >
              <span>📞</span>
              <span>Contact Form</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
