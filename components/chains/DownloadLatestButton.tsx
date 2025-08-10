'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CloudArrowDownIcon } from '@heroicons/react/24/outline';

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
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.25)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      <CloudArrowDownIcon className="w-5 h-5" />
      Download Latest
      <span className="text-sm opacity-90">
        ({sizeInGB} GB)
      </span>
    </motion.button>
  );
}