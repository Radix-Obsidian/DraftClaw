import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { PickDetail } from '../picks/service';

interface PickDetailDrawerProps {
  pickId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PickDetailDrawer: React.FC<PickDetailDrawerProps> = ({ pickId, isOpen, onClose }) => {
  const [pick, setPick] = useState<PickDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pickId) {
      fetchPickDetails();
    }
  }, [isOpen, pickId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchPickDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/picks/${pickId}`);
      const data = await response.json();
      
      if (data.success) {
        setPick(data.data);
      } else {
        setError(data.error || 'Failed to load pick details');
      }
    } catch (err) {
      setError('Unable to load pick details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (result: string | null) => {
    if (!result || result === 'pending') {
      return <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">ACTIVE</span>;
    }
    if (result === 'won') {
      return <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">WON</span>;
    }
    if (result === 'lost') {
      return <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">LOST</span>;
    }
    return <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">{result.toUpperCase()}</span>;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pick Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close drawer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchPickDetails}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}

          {pick && !loading && (
            <div className="space-y-6">
              {/* Matchup Header */}
              <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-bold">{pick.matchup}</h3>
                  {getStatusBadge(pick.result)}
                </div>
                <p className="text-xl font-semibold mb-1">{pick.selection}</p>
                {pick.gameTime && (
                  <p className="text-sm opacity-80">{pick.gameTime}</p>
                )}
                {pick.event && (
                  <p className="text-xs opacity-70 mt-2">
                    {pick.event.league} • {format(new Date(pick.event.commenceTime), 'MMM d, yyyy • h:mm a')}
                  </p>
                )}
              </div>

              {/* The Edge Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🦞 The Edge</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{pick.clawEdge}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Claw Edge</p>
                  </div>
                  {pick.expectedValue !== null && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {pick.expectedValue > 0 ? '+' : ''}{pick.expectedValue.toFixed(3)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Expected Value</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{pick.confidence}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Confidence</p>
                  </div>
                </div>
                
                {/* Confidence Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${pick.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* The Lines Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 The Lines</h4>
                <div className="space-y-3">
                  {pick.sharpLine !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Sharp Line (Pinnacle)</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{pick.sharpLine}</span>
                    </div>
                  )}
                  {pick.retailLine !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Retail Line</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{pick.retailLine}</span>
                    </div>
                  )}
                  {pick.bestOdds !== null && pick.bestSportsbook && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Best Odds</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {pick.bestOdds} @ {pick.bestSportsbook}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Current Odds</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{pick.odds}</span>
                  </div>
                  {pick.recommendedUnits !== null && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Recommended Units</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{pick.recommendedUnits}u</span>
                    </div>
                  )}
                </div>
              </div>

              {/* The Anchor's Take */}
              <div className="bg-linear-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border-l-4 border-orange-500">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">🎙️</span> The Anchor's Take
                </h4>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic">
                  "{pick.anchorTake}"
                </p>
              </div>

              {/* Analysis */}
              {pick.analysis && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📈 Deep Analysis</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {pick.analysis}
                  </p>
                </div>
              )}

              {/* Affiliate Links */}
              {Object.keys(pick.affiliateLinks).length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🔗 Place This Bet</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(pick.affiliateLinks).map(([book, link]) => (
                      <a
                        key={book}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
                      >
                        {book}
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    21+ Only. Gamble Responsibly.
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                Generated {format(new Date(pick.generatedAt), 'MMM d, yyyy • h:mm a')}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PickDetailDrawer;
