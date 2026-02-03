import React from 'react';
import { ThemeToggle } from '../components/ThemeToggle';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="DraftClaw" className="h-10 w-auto" />
              <span className="text-3xl font-bold text-gray-900 dark:text-white">DraftClaw</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          About DraftClaw
        </h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            DraftClaw is the Autonomous Moneyball Engine — a sports intelligence platform that tracks 
            sharp money movements and provides real-time Expected Value calculations against the books.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We believe that informed bettors make better decisions. By tracking line movements, 
            analyzing sharp book prices, and monitoring real-time news, DraftClaw gives you the 
            edge you need to identify value in the market.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Real-Time Odds</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We track odds from multiple sportsbooks 24/7, identifying when sharp lines diverge from retail prices.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">AI Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Our AI processes line movements, news sentiment, and historical data to generate high-confidence picks.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">📰</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Breaking News</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Instant alerts on injuries, lineup changes, and weather that could impact your bets.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            Responsible Gaming
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            DraftClaw is a sports intelligence platform, not a sportsbook. We provide data and analysis 
            to help you make informed decisions. Always gamble responsibly and within your means. 
            If you or someone you know has a gambling problem, call 1-800-GAMBLER.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Have questions or feedback? Reach out to us at{' '}
            <a href="mailto:support@draftclaw.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@draftclaw.ai
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2026 DraftClaw. All rights reserved. 21+ Only. Gamble Responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}
