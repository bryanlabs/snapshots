import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { 
  UserCircleIcon,
  UsersIcon,
  ChartBarIcon,
  KeyIcon,
  CreditCardIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Use centralized tier access validation - supports all premium tiers
  const { getServerTierCapabilities } = require("@/lib/utils/tier");
  const capabilities = getServerTierCapabilities(session.user.tier);

  const navigation = [
    {
      name: 'Account',
      href: '/account',
      icon: UserCircleIcon,
      available: true,
    },
    {
      name: 'Team',
      href: '/account/team',
      icon: UsersIcon,
      available: capabilities.canAccessPremiumFeatures,
    },
    {
      name: 'Analytics',
      href: '/account/analytics',
      icon: ChartBarIcon,
      available: capabilities.canAccessPremiumFeatures,
    },
    {
      name: 'API Keys',
      href: '/account/api-keys',
      icon: KeyIcon,
      available: capabilities.canAccessPremiumFeatures,
    },
    {
      name: 'Credits',
      href: '/account/credits',
      icon: CreditCardIcon,
      available: capabilities.canAccessPremiumFeatures,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {navigation.map((item) => {
                if (!item.available) return null;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors group"
                  >
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              {/* Upgrade Prompt for Free Users */}
              {session.user.tier === 'free' && (
                <div className="mt-6 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-800">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white mb-1">
                        Unlock Premium Features
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        Get 5x faster downloads, custom snapshots, and more
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300"
                      >
                        <span>Upgrade Now</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}