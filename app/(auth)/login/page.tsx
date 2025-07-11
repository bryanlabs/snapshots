import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to access premium features',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            BryanLabs Snapshots
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to access premium features
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}