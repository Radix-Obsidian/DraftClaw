import React from 'react';
import { GetServerSideProps } from 'next';
import { format } from 'date-fns';
import { SEOHead } from '../../components/SEOHead';
import { SchemaMarkup } from '../../components/SchemaMarkup';
import { PlayerNewsCard } from '../../components/PlayerNewsCard';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  source: string;
  source_url: string;
  published_at: string;
  updated_at: string;
  sport: string;
  category: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  metadata: Record<string, any>;
  player_name?: string;
  player_team?: string;
  injury_status?: string;
  status_update?: string;
  impact_analysis?: string;
}

interface ArticlePageProps {
  article: NewsArticle;
  relatedArticles: NewsArticle[];
}

export default function ArticlePage({ article, relatedArticles }: ArticlePageProps) {
  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'NBA': return 'bg-orange-500';
      case 'UFC': return 'bg-red-500';
      case 'Soccer': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <SEOHead
        title={article.seo_title || article.title}
        description={article.seo_description || article.summary}
        canonicalUrl={`/news/${article.slug}`}
        ogType="article"
        publishedTime={article.published_at}
        modifiedTime={article.updated_at}
        tags={article.tags}
      />

      <SchemaMarkup
        type="Article"
        title={article.title}
        description={article.summary}
        url={`/news/${article.slug}`}
        datePublished={article.published_at}
        dateModified={article.updated_at}
      />

      <SchemaMarkup
        type="BreadcrumbList"
        items={[
          { name: 'Home', url: '/' },
          { name: 'News', url: '/news' },
          { name: article.sport, url: `/news/${article.sport.toLowerCase()}` },
          { name: article.title, url: `/news/${article.slug}` }
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><a href="/" className="hover:text-blue-500">Home</a></li>
            <li>/</li>
            <li><a href="/news" className="hover:text-blue-500">News</a></li>
            <li>/</li>
            <li><a href={`/news/${article.sport.toLowerCase()}`} className="hover:text-blue-500">{article.sport}</a></li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 text-sm text-white rounded-full ${getSportColor(article.sport)}`}>
              {article.sport}
            </span>
            <span className="text-sm text-gray-500 capitalize">{article.category}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <time dateTime={article.published_at}>
              {format(new Date(article.published_at), 'MMMM d, yyyy • h:mm a')}
            </time>
            <span>•</span>
            <span>Source: {article.source}</span>
          </div>
        </header>

        {/* Player Info Card (if applicable) */}
        {article.player_name && (
          <div className="mb-8">
            <PlayerNewsCard
              playerName={article.player_name}
              playerTeam={article.player_team}
              injuryStatus={article.injury_status}
              statusUpdate={article.status_update}
              impactAnalysis={article.impact_analysis}
              title={article.title}
              slug={article.slug}
              publishedAt={article.published_at}
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <a
                  key={index}
                  href={`/news?tag=${tag}`}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Source Link */}
        {article.source_url && (
          <div className="mb-12">
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Read original article →
            </a>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-bold mb-6">Related News</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map(related => (
                <a
                  key={related.id}
                  href={`/news/${related.slug}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                >
                  <span className={`inline-block px-2 py-0.5 text-xs text-white rounded-full ${getSportColor(related.sport)} mb-2`}>
                    {related.sport}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {related.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(related.published_at), 'MMM d, yyyy')}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;

  try {
    const response = await fetch(`${process.env.DRAFTCLAW_PORTAL_URL}/api/news/${slug}`);
    const data = await response.json();

    if (!data.success) {
      return { notFound: true };
    }

    // Fetch related articles
    const relatedResponse = await fetch(
      `${process.env.DRAFTCLAW_PORTAL_URL}/api/news?sport=${data.data.sport}&limit=4`
    );
    const relatedData = await relatedResponse.json();
    const relatedArticles = relatedData.success
      ? relatedData.data.filter((a: NewsArticle) => a.slug !== slug).slice(0, 3)
      : [];

    return {
      props: {
        article: data.data,
        relatedArticles
      }
    };
  } catch (error) {
    return { notFound: true };
  }
};
