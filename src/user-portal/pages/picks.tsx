import React from 'react';
import { PicksFeed } from '../components/PicksFeed';
import { ThemeToggle } from '../components/ThemeToggle';

export default function PicksPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🦞 DraftClaw Picks
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sharp money moves. Track the edge.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Picks</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">8</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Claw Edge</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">9.2%</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Win Rate (7D)</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">68%</div>
          </div>
        </div>

        {/* Picks Feed */}
        <PicksFeed />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            21+ Only. Gamble Responsibly. DraftClaw is a sports intelligence platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
