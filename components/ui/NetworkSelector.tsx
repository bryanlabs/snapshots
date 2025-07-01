"use client";

import { useState } from "react";

interface NetworkSelectorProps {
  options: string[];
  defaultSelected?: string;
  onSelect?: (network: string) => void;
}

export const NetworkSelector = ({
  options,
  defaultSelected = options[0],
  onSelect,
}: NetworkSelectorProps) => {
  const [selected, setSelected] = useState(defaultSelected);

  const handleSelect = (network: string) => {
    setSelected(network);
    onSelect?.(network);
  };

  return (
    <div className="flex bg-slate-100 rounded-lg p-1 mb-8">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => handleSelect(option)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            selected === option
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
