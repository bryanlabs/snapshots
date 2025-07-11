import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  
  // Admin routes require authentication
  if (!user) {
    redirect('/login');
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Admin Dashboard
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Logged in as: {user.email}
            </span>
          </div>
        </div>
      </div>
      
      {/* Admin content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}