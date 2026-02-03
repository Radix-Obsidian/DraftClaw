import React from 'react';
import { ThemeToggle } from '../components/ThemeToggle';

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: February 2, 2026
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li><strong>Account Information:</strong> Email address, password (hashed), and optional phone number</li>
              <li><strong>Usage Data:</strong> API calls, feature usage, and interaction patterns</li>
              <li><strong>Device Information:</strong> IP address, browser type, and operating system</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we never store full card numbers)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li>Provide and maintain our service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important account notifications</li>
              <li>Improve our algorithms and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Data Security</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li>All data transmitted over HTTPS/TLS encryption</li>
              <li>Passwords hashed using bcrypt</li>
              <li>JWT tokens with secure expiration</li>
              <li>Regular security audits and updates</li>
              <li>Database encryption at rest (via Supabase)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Third-Party Services</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Sports Data APIs:</strong> Odds and news data</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Each third party has their own privacy policy and security practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Retention</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We retain your data as follows:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li>Account data: Retained until account deletion</li>
              <li>Usage logs: 90 days</li>
              <li>Pick history: 30 days after settlement</li>
              <li>Payment records: 7 years (tax/legal requirements)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Cookies</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use cookies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li>Authenticate users and maintain sessions</li>
              <li>Remember theme preferences (light/dark mode)</li>
              <li>Analyze site usage and performance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              DraftClaw is not intended for users under 21 years of age. We do not knowingly collect 
              information from anyone under 21. If you believe we have collected information from a 
              minor, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For privacy-related questions or to exercise your rights, contact us at{' '}
              <a href="mailto:privacy@draftclaw.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
                privacy@draftclaw.ai
              </a>
            </p>
          </section>
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
