import React from 'react';
import { NewsFeed } from '../components/NewsFeed';
import { PicksFeed } from '../components/PicksFeed';
import { ThemeToggle } from '../components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="DraftClaw" className="h-10 w-auto" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DraftClaw</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  The Autonomous Moneyball Engine
                </p>
              </div>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <h2 className="text-4xl font-bold mb-4">THE DESK IS LIVE.</h2>
          <p className="text-xl mb-6">
            Real-time Expected Value calculation against sharp books. Track the smart money.
          </p>
          <div className="flex gap-4">
            <a
              href="/picks"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Today's Picks
            </a>
            <a
              href="/news"
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Latest News
            </a>
          </div>
        </div>

        {/* Today's Top Picks */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔥 Today's Top Picks
            </h2>
            <a
              href="/picks"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              View All →
            </a>
          </div>
          <PicksFeed limit={6} />
        </section>

        {/* Latest News */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📰 Latest News
            </h2>
            <a
              href="/news"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              View All →
            </a>
          </div>
          <NewsFeed limit={6} showFeatured={false} showThemeToggle={false} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <img src="/logo.png" alt="" className="h-5 w-auto" />
                DraftClaw
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The Autonomous Moneyball Engine. Sharp money moves first. Track it.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/picks" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Picks</a></li>
                <li><a href="/news" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">News</a></li>
                <li><a href="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">About</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</a></li>
                <li><a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              21+ Only. Gamble Responsibly. DraftClaw is a sports intelligence platform, not a sportsbook.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
