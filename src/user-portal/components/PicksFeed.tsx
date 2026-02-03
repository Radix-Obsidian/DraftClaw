import React, { useState, useEffect } from 'react';
import { PickCard } from './PickCard';
import { PickDetailDrawer } from './PickDetailDrawer';
import type { Pick } from '../picks/service';

interface PicksFeedProps {
  sport?: string;
  type?: string;
  limit?: number;
}

export const PicksFeed: React.FC<PicksFeedProps> = ({ sport, type, limit = 20 }) => {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPickId, setSelectedPickId] = useState<string | null>(null);

  useEffect(() => {
    fetchPicks();
  }, [sport, type, limit]);

  const fetchPicks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sport) params.append('sport', sport);
      if (type) params.append('type', type);
      
      const endpoint = sport 
        ? `/api/picks/${sport.toLowerCase()}`
        : type 
        ? `/api/picks/${type}s`
        : '/api/picks';

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      if (data.success) {
        setPicks(data.data.slice(0, limit));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch picks');
    } finally {
      setLoading(false);
    }
  };

  const handlePickClick = (pickId: string) => {
    setSelectedPickId(pickId);
  };

  const handleCloseDrawer = () => {
    setSelectedPickId(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={fetchPicks}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No active picks available at the moment.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {picks.map((pick) => (
          <PickCard key={pick.id} pick={pick} onClick={handlePickClick} />
        ))}
      </div>

      {selectedPickId && (
        <PickDetailDrawer
          pickId={selectedPickId}
          isOpen={!!selectedPickId}
          onClose={handleCloseDrawer}
        />
      )}
    </>
  );
};

export default PicksFeed;
