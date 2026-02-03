import React from 'react';
import { format } from 'date-fns';

interface PlayerNewsProps {
  playerName: string;
  playerTeam?: string;
  injuryStatus?: string;
  statusUpdate?: string;
  impactAnalysis?: string;
  title: string;
  slug: string;
  publishedAt: string;
}

export const PlayerNewsCard: React.FC<PlayerNewsProps> = ({
  playerName,
  playerTeam,
  injuryStatus,
  statusUpdate,
  impactAnalysis,
  title,
  slug,
  publishedAt
}) => {
  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('out')) return 'bg-red-500';
    if (statusLower.includes('doubtful')) return 'bg-orange-500';
    if (statusLower.includes('questionable')) return 'bg-yellow-500';
    if (statusLower.includes('probable')) return 'bg-green-400';
    return 'bg-green-500';
  };

  return (
    <a
      href={`/news/${slug}`}
      className="block bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start gap-4">
        {/* Player Avatar Placeholder */}
        <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {playerName.split(' ').map(n => n[0]).join('')}
        </div>

        <div className="flex-1">
          {/* Player Info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 dark:text-white">
              {playerName}
            </span>
            {playerTeam && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {playerTeam}
              </span>
            )}
          </div>

          {/* Injury Status Badge */}
          {injuryStatus && (
            <span className={`inline-block px-2 py-0.5 text-xs text-white rounded-full ${getStatusColor(injuryStatus)} mb-2`}>
              {injuryStatus}
            </span>
          )}

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {title}
          </h3>

          {/* Status Update */}
          {statusUpdate && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {statusUpdate}
            </p>
          )}

          {/* Impact Analysis */}
          {impactAnalysis && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mt-2">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Impact:</span> {impactAnalysis}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mt-2">
            {format(new Date(publishedAt), 'MMM d, yyyy • h:mm a')}
          </p>
        </div>
      </div>
    </a>
  );
};

export default PlayerNewsCard;
