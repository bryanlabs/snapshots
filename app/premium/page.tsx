import Image from 'next/image';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function PremiumPage() {
  const freeFeatures = [
    '5 downloads per day',
    '50 Mbps download speed',
    'Access to all blockchains'
  ];

  const premiumFeatures = [
    'Unlimited downloads',
    '250 Mbps download speed (5x faster)',
    'Premium support',
    'API access for automation',
    'Dashboard tracking download history',
    'Personal user statistics',
    'Real-time credit balance monitoring',
    'Advanced analytics and insights'
  ];

  const contactMethods = [
    {
      name: 'Discord',
      username: 'danbryan80',
      href: 'https://discord.com/users/danbryan80',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )
    },
    {
      name: 'Telegram',
      username: '@danbryan80',
      href: 'https://t.me/danbryan80',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.953l11.57-4.461c.536-.194 1.006.131.823.943z"/>
        </svg>
      )
    },
    {
      name: 'X',
      username: '@danbryan80',
      href: 'https://x.com/danbryan80',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'Email',
      username: 'hello@bryanlabs.net',
      href: 'mailto:hello@bryanlabs.net',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Premium Access
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock the full potential of blockchain snapshots with premium features and dedicated support
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Tier */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Free Tier</h3>
              <p className="text-gray-400">Perfect for individual node operators</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            
            {/* Free tier - comparison only, no action button */}
          </div>

          {/* Premium Tier */}
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-600/50 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Best for Professionals
              </span>
            </div>
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-gray-400">For professional validators and teams</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">Contact Us</span>
                <span className="text-gray-400 block text-sm mt-1">Custom pricing available</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link
              href="/contact"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
            >
              Contact us to upgrade your account
            </Link>
          </div>
        </div>

        {/* Contact Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Ready to Go Premium?
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Get in touch with us to upgrade your account and unlock premium features
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {contactMethods.map((method) => (
                <a
                  key={method.name}
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
                >
                  <div className="text-gray-400 group-hover:text-white transition-colors">
                    {method.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{method.name}</div>
                    <div className="text-sm text-gray-400">{method.username}</div>
                  </div>
                </a>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-800/50">
              <p className="text-sm text-blue-300 text-center">
                <strong>Coming Soon:</strong> Stripe integration for instant premium upgrades and automated billing
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-2">
                How do I upgrade to Premium?
              </h3>
              <p className="text-gray-400">
                Contact us through any of the methods above and we'll manually upgrade your account. Automated billing via Stripe is coming soon.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400">
                Currently, we accept cryptocurrency payments and bank transfers. Once Stripe integration is complete, we'll accept all major credit cards.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes! Premium subscriptions can be cancelled at any time. You'll retain access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}