"use client";

import { useState } from "react";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/solid";

export default function ContactPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, itemName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemName);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const contactMethods = [
    {
      name: "Discord",
      username: "danbryan80",
      displayUsername: "danbryan80",
      href: "https://discord.com/users/danbryan80",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      ),
      color: "from-indigo-500 to-purple-600"
    },
    {
      name: "Telegram",
      username: "@danbryan80",
      displayUsername: "@danbryan80",
      href: "https://t.me/danbryan80",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.953l11.57-4.461c.536-.194 1.006.131.823.943z"/>
        </svg>
      ),
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "X",
      username: "@danbryan80",
      displayUsername: "@danbryan80",
      href: "https://x.com/danbryan80",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: "from-gray-600 to-gray-800"
    },
    {
      name: "Email",
      username: "hello@bryanlabs.net",
      displayUsername: "hello@bryanlabs.net",
      href: "mailto:hello@bryanlabs.net",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions about our snapshot service? Want to upgrade to premium? We&apos;re here to help!
          </p>
        </div>

        {/* Schedule a Call */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-600/50">
            <div className="flex items-center justify-center mb-4">
              <CalendarIcon className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Schedule a Quick Call
            </h2>
            <p className="text-gray-300 text-center mb-6">
              Book a quick call and get <span className="font-semibold text-purple-300">1 month of Premium free</span> to discuss your snapshot needs.
            </p>
            <a
              href="https://fantastical.app/bryanlabs/15-minutes"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full max-w-sm mx-auto text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
            >
              Book a 15-minute Call
            </a>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Connect With Us
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactMethods.map((method) => (
              <div
                key={method.name}
                className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${method.color}`}>
                    <div className="text-white">
                      {method.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{method.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-300 font-mono select-all">{method.displayUsername}</span>
                      <button
                        onClick={() => copyToClipboard(method.username, method.name)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedItem === method.name ? (
                          <CheckIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <a
                      href={method.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Open in {method.name}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}