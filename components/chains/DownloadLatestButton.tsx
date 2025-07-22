'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface DownloadLatestButtonProps {
  chainId: string;
  size: number;
  accentColor?: string;
}

export function DownloadLatestButton({ chainId, size, accentColor = '#3b82f6' }: DownloadLatestButtonProps) {
  const router = useRouter();
  
  const sizeInGB = (size / (1024 * 1024 * 1024)).toFixed(1);

  const handleClick = () => {
    router.push(`/chains/${chainId}?download=latest`);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transform transition-all duration-200"
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.25), 0 10px 10px -5px rgba(59, 130, 246, 0.2)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
      Download Latest
      <span className="text-sm opacity-90">
        ({sizeInGB} GB)
      </span>
    </motion.button>
  );
}