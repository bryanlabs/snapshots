import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WebVitalsDashboard } from '@/components/admin/WebVitalsDashboard';

export const metadata = {
  title: 'Web Vitals Dashboard',
  description: 'Monitor Core Web Vitals and performance metrics',
};

export default async function VitalsPage() {
  const session = await auth();
  
  // Check if user is admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Web Vitals Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor Core Web Vitals and real user performance metrics
          </p>
        </div>

        <WebVitalsDashboard />
      </div>
    </div>
  );
}