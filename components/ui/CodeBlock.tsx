"use client";

import { useState } from "react";
import { CopyIcon } from "../icons";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock = ({
  code,
  language = "bash",
  title,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden mb-4">
      {title && (
        <div className="bg-slate-800 px-4 py-2 text-sm text-slate-300 border-b border-slate-700">
          {title}
        </div>
      )}
      <div className="relative">
        <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
          <code className={`language-${language}`}>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <span className="text-green-400 text-xs">Copied!</span>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>
    </div>
  );
};
