"use client";

import { motion } from "framer-motion";
import { GLOBAL_STATS } from "@/lib/data/chains";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export const HeroStats = () => {
  const stats = [
    { number: `${GLOBAL_STATS.totalChains}+`, label: "Chains Available" },
    { number: GLOBAL_STATS.updateFrequency, label: "Updates" },
    { number: GLOBAL_STATS.uptime, label: "Uptime" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            y: -5,
            transition: { duration: 0.2 },
          }}
          className="text-center group cursor-pointer transition-transform duration-200"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: index * 0.2,
              duration: 0.5,
              type: "spring",
              stiffness: 100,
            }}
            className="text-3xl md:text-4xl font-extrabold text-foreground mb-2 leading-none"
          >
            {stat.number}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.2 + 0.3 }}
            className="text-sm font-medium text-muted uppercase tracking-wider"
          >
            {stat.label}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
};
