import React from 'react';
import type { Pick } from '../picks/service';

interface PickCardProps {
  pick: Pick;
  onClick: (pickId: string) => void;
}

export const PickCard: React.FC<PickCardProps> = ({ pick, onClick }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lock': return 'bg-green-500';
      case 'longshot': return 'bg-yellow-500';
      case 'trap': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'NBA': return 'bg-orange-500';
      case 'NFL': return 'bg-blue-500';
      case 'UFC': return 'bg-red-600';
      case 'Soccer': return 'bg-green-500';
      case 'MLB': return 'bg-blue-400';
      case 'NHL': return 'bg-blue-700';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      onClick={() => onClick(pick.id)}
      className="bg-white dark:bg-gray-800 rounded-xl p-5 hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(pick.id);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs text-white rounded-full ${getSportColor(pick.sport)}`}>
            {pick.sport}
          </span>
          <span className={`px-2 py-1 text-xs text-white rounded-full ${getTypeColor(pick.type)}`}>
            {pick.type.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {pick.clawEdge}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Claw Edge</div>
        </div>
      </div>

      {/* Matchup */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {pick.matchup}
      </h3>

      {/* Selection */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {pick.selection}
        </span>
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {pick.odds}
        </span>
      </div>

      {/* Confidence Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Confidence</span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">{pick.confidence}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all"
            style={{ width: `${pick.confidence}%` }}
          />
        </div>
      </div>

      {/* Anchor's Take Preview */}
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 italic">
        "{pick.anchorTake}"
      </p>

      {/* Game Time */}
      {pick.gameTime && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🕐 {pick.gameTime}
          </p>
        </div>
      )}

      {/* Click indicator */}
      <div className="mt-3 flex items-center justify-end text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>View Details</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default PickCard;
