"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "circle" | "rectangle";
  width?: string | number;
  height?: string | number;
  animationDelay?: number;
}

export const SkeletonLoader = ({
  className = "",
  variant = "rectangle",
  width,
  height,
  animationDelay = 0,
}: SkeletonLoaderProps) => {
  const baseClasses = "bg-slate-200 animate-pulse";

  const variantClasses = {
    text: "h-4 rounded",
    circle: "rounded-full",
    rectangle: "rounded-lg",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: animationDelay,
        ease: "easeInOut",
      }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
};

// Predefined skeleton patterns
export const SkeletonCard = ({ index = 0 }: { index?: number }) => (
  <div
    className="bg-white rounded-xl border border-border p-6"
    role="status"
    aria-label="Loading chain data"
  >
    <div className="flex items-start gap-4 mb-4">
      <SkeletonLoader
        variant="circle"
        width={48}
        height={48}
        animationDelay={index * 0.1}
      />
      <div className="flex-1">
        <SkeletonLoader
          width="75%"
          height={24}
          animationDelay={index * 0.1 + 0.1}
          className="mb-2"
        />
        <SkeletonLoader
          width="50%"
          height={16}
          animationDelay={index * 0.1 + 0.2}
        />
      </div>
    </div>

    <div className="space-y-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <SkeletonLoader
            width="33%"
            height={16}
            animationDelay={index * 0.1 + i * 0.05}
          />
          <SkeletonLoader
            width="25%"
            height={16}
            animationDelay={index * 0.1 + i * 0.05 + 0.1}
          />
        </div>
      ))}
    </div>

    <div className="flex gap-3">
      <SkeletonLoader
        className="flex-1"
        height={40}
        animationDelay={index * 0.1 + 0.3}
      />
      <SkeletonLoader
        width={80}
        height={40}
        animationDelay={index * 0.1 + 0.4}
      />
    </div>
  </div>
);

export const SkeletonStats = ({ count = 2 }: { count?: number }) => (
  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16 max-w-4xl mx-auto">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="text-center">
        <SkeletonLoader
          width={64}
          height={48}
          animationDelay={index * 0.2}
          className="mx-auto mb-2"
        />
        <SkeletonLoader
          width={80}
          height={16}
          animationDelay={index * 0.2 + 0.1}
          className="mx-auto"
        />
      </div>
    ))}
  </div>
);

export const SkeletonSnapshotTable = () => (
  <div className="bg-white rounded-xl border border-border overflow-hidden mb-12">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-border">
          <tr>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Time
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Block Height
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Size
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Last Updated
            </th>
            <th className="text-left py-4 px-6 font-semibold text-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors">
            <td className="py-4 px-6">
              <SkeletonLoader width="80%" height={20} animationDelay={0.1} />
            </td>
            <td className="py-4 px-6">
              <SkeletonLoader
                width="90%"
                height={20}
                animationDelay={0.2}
                className="font-mono"
              />
            </td>
            <td className="py-4 px-6">
              <SkeletonLoader width="60%" height={20} animationDelay={0.3} />
            </td>
            <td className="py-4 px-6">
              <SkeletonLoader width="70%" height={20} animationDelay={0.4} />
            </td>
            <td className="py-4 px-6">
              <SkeletonLoader
                width={100}
                height={40}
                animationDelay={0.5}
                className="rounded-lg"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonSnapshotCard = ({ index = 0 }: { index?: number }) => (
  <div
    className="bg-white rounded-xl border border-border p-6"
    role="status"
    aria-label="Loading snapshot data"
  >
    {/* Header with icon and title */}
    <div className="flex items-start gap-4 mb-4">
      <SkeletonLoader
        variant="circle"
        width={32}
        height={32}
        animationDelay={index * 0.1}
      />
      <div className="flex-1">
        <SkeletonLoader
          width="70%"
          height={24}
          animationDelay={index * 0.1 + 0.1}
          className="mb-1"
        />
        <SkeletonLoader
          width="50%"
          height={16}
          animationDelay={index * 0.1 + 0.2}
        />
      </div>
    </div>

    {/* Data rows */}
    <div className="space-y-3 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <SkeletonLoader
            width="40%"
            height={16}
            animationDelay={index * 0.1 + i * 0.05 + 0.3}
          />
          <SkeletonLoader
            width="30%"
            height={16}
            animationDelay={index * 0.1 + i * 0.05 + 0.35}
          />
        </div>
      ))}
    </div>

    {/* Buttons */}
    <div className="flex gap-3">
      <SkeletonLoader
        className="flex-1"
        height={42}
        animationDelay={index * 0.1 + 0.5}
      />
      <SkeletonLoader
        width={90}
        height={42}
        animationDelay={index * 0.1 + 0.6}
      />
    </div>
  </div>
);
