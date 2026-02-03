import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ThemeToggle } from './ThemeToggle';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  sport: string;
  category: string;
  published_at: string;
  is_featured: boolean;
  metadata: Record<string, any>;
}

interface NewsApiResponse {
  success: boolean;
  data?: NewsArticle[];
  error?: string;
}

interface NewsFeedProps {
  sport?: string;
  category?: string;
  limit?: number;
  showFeatured?: boolean;
  showThemeToggle?: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  sport,
  category,
  limit = 10,
  showFeatured = true,
  showThemeToggle = false
}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [sport, category, limit]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sport) params.append('sport', sport);
      if (category) params.append('category', category);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json() as NewsApiResponse;

      if (data.success) {
        setArticles(data.data ?? []);
      } else {
        setError(data.error ?? 'Unknown error');
      }
    } catch (err) {
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'NBA': return 'bg-orange-500';
      case 'UFC': return 'bg-red-500';
      case 'Soccer': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'player': return '👤';
      case 'team': return '🏟️';
      case 'league': return '🏆';
      case 'betting': return '💰';
      default: return '📰';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        <p>{error}</p>
        <button 
          onClick={fetchNews}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Toggle */}
      {showThemeToggle && (
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
      )}
      
      {/* Featured Articles */}
      {showFeatured && articles.filter(a => a.is_featured).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.filter(a => a.is_featured).map(article => (
              <a
                key={article.id}
                href={`/news/${article.slug}`}
                className="block bg-linear-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white hover:shadow-xl transition-shadow"
              >
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getSportColor(article.sport)} mb-2`}>
                  {article.sport}
                </span>
                <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                <p className="text-sm opacity-80">{article.summary}</p>
                <p className="text-xs mt-4 opacity-60">
                  {format(new Date(article.published_at), 'MMM d, yyyy • h:mm a')}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Regular Articles */}
      <div className="space-y-4">
        {articles.filter(a => !a.is_featured).map(article => (
          <a
            key={article.id}
            href={`/news/${article.slug}`}
            className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{getCategoryIcon(article.category)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs text-white rounded-full ${getSportColor(article.sport)}`}>
                    {article.sport}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {article.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {article.summary}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(article.published_at), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
