import React from 'react';
import { ThemeToggle } from '../components/ThemeToggle';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: February 2, 2026
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              By accessing or using DraftClaw, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service. You must be at least 
              21 years of age to use DraftClaw.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              DraftClaw is a sports intelligence platform that provides data analysis, odds tracking, 
              and betting insights. We are NOT a sportsbook and do not accept wagers. All information 
              provided is for entertainment and educational purposes only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. No Gambling Advice</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The information provided by DraftClaw does not constitute gambling advice, financial advice, 
              or any recommendation to place bets. All betting decisions are made at your own risk. 
              Past performance does not guarantee future results.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. User Accounts</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials. 
              You agree to notify us immediately of any unauthorized access to your account. 
              We reserve the right to terminate accounts that violate these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Subscription and Billing</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Some features of DraftClaw require a paid subscription. By subscribing, you agree to pay 
              all fees associated with your selected plan. Subscriptions automatically renew unless 
              cancelled. Refunds are provided at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Responsible Gaming</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We promote responsible gaming. If you feel you may have a gambling problem, please:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
              <li>Contact the National Council on Problem Gambling: 1-800-522-4700</li>
              <li>Visit <a href="https://www.ncpgambling.org" className="text-blue-600 dark:text-blue-400 hover:underline">www.ncpgambling.org</a></li>
              <li>Call 1-800-GAMBLER</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              DraftClaw and its affiliates shall not be liable for any losses incurred as a result of 
              using our service, including but not limited to gambling losses, data loss, or service 
              interruptions. Our total liability shall not exceed the amount you paid for our service 
              in the previous 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Changes to Terms</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms. We will notify users of significant 
              changes via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Contact</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Questions about these terms? Contact us at{' '}
              <a href="mailto:legal@draftclaw.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
                legal@draftclaw.ai
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
