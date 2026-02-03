import { Pool } from 'pg';
import axios from 'axios';
import { logger } from '../utils/logger';
import { SportsDataApiService } from './sportsdata-api.service';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  sport: string;
  category: string;
  metadata: Record<string, any>;
}

interface PlayerNews {
  articleId: string;
  playerName: string;
  playerTeam?: string;
  injuryStatus?: string;
  statusUpdate?: string;
  impactAnalysis?: string;
}

export class NewsFeedService {
  private pool: Pool;
  private sportsDataApi: SportsDataApiService;
  private syncInterval: NodeJS.Timeout | null;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.sportsDataApi = new SportsDataApiService();
    this.syncInterval = null;
  }

  async start() {
    if (this.syncInterval) {
      return;
    }

    const interval = parseInt(process.env.NEWS_UPDATE_INTERVAL || '900000', 10); // 15 minutes
    this.syncInterval = setInterval(() => this.syncNews(), interval);
    
    // Initial sync
    await this.syncNews();
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncNews() {
    try {
      const sports = ['NBA', 'UFC', 'Soccer', 'NCAAB', 'NCAAW'];
      
      for (const sport of sports) {
        // Fetch news articles
        const articles = await this.fetchSportNews(sport);
        await this.saveArticles(articles);

        // Fetch player news if available
        if (sport === 'NBA' || sport === 'NCAAB' || sport === 'NCAAW') {
          const playerNews = await this.fetchPlayerNews(sport);
          await this.savePlayerNews(playerNews);
        }
      }

      logger.info('News sync completed successfully');
    } catch (error) {
      logger.error('Error syncing news:', error);
    }
  }

  private async fetchSportNews(sport: string): Promise<NewsArticle[]> {
    try {
      const response = await axios.get(`${process.env.SPORTSDATA_API_HOST}/v3/${sport}/news-rotoballer/json/RotoBallerArticles`, {
        params: {
          key: process.env.SPORTSDATA_API_KEY
        }
      });

      return response.data.map((article: any) => ({
        id: article.ArticleID,
        title: article.Title,
        content: article.Content,
        source: 'SportsData.io',
        sourceUrl: article.Url,
        publishedAt: new Date(article.Updated),
        sport,
        category: this.determineCategory(article),
        metadata: {
          author: article.Author,
          categories: article.Categories,
          originalSource: article.Source
        }
      }));
    } catch (error) {
      logger.error(`Error fetching ${sport} news:`, error);
      return [];
    }
  }

  private async fetchPlayerNews(sport: string): Promise<PlayerNews[]> {
    try {
      const response = await axios.get(`${process.env.SPORTSDATA_API_HOST}/v3/${sport}/injuries/json/Injuries`, {
        params: {
          key: process.env.SPORTSDATA_API_KEY
        }
      });

      return response.data.map((injury: any) => ({
        articleId: injury.NewsID,
        playerName: injury.Name,
        playerTeam: injury.Team,
        injuryStatus: injury.Status,
        statusUpdate: injury.StatusUpdate,
        impactAnalysis: injury.InjuryAnalysis
      }));
    } catch (error) {
      logger.error(`Error fetching ${sport} player news:`, error);
      return [];
    }
  }

  private async saveArticles(articles: NewsArticle[]) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const article of articles) {
        const seoTitle = this.generateSEOTitle(article.title, article.sport);
        const seoDescription = this.generateSEODescription(article.content);
        const tags = this.generateTags(article);

        await client.query(
          `INSERT INTO news_articles (
            title, slug, content, summary, source, source_url,
            published_at, sport, category, metadata,
            seo_title, seo_description, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (slug) DO UPDATE SET
            content = EXCLUDED.content,
            summary = EXCLUDED.summary,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()`,
          [
            article.title,
            this.generateSlug(article.title),
            article.content,
            this.generateSummary(article.content),
            article.source,
            article.sourceUrl,
            article.publishedAt,
            article.sport,
            article.category,
            article.metadata,
            seoTitle,
            seoDescription,
            tags
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async savePlayerNews(newsItems: PlayerNews[]) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const news of newsItems) {
        await client.query(
          `INSERT INTO player_news (
            article_id, player_name, player_team,
            injury_status, status_update, impact_analysis
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (article_id) DO UPDATE SET
            injury_status = EXCLUDED.injury_status,
            status_update = EXCLUDED.status_update,
            impact_analysis = EXCLUDED.impact_analysis,
            updated_at = NOW()`,
          [
            news.articleId,
            news.playerName,
            news.playerTeam,
            news.injuryStatus,
            news.statusUpdate,
            news.impactAnalysis
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private generateSummary(content: string): string {
    return content.substring(0, 200) + '...';
  }

  private generateSEOTitle(title: string, sport: string): string {
    return `${title} | ${sport} News | DraftClaw`;
  }

  private generateSEODescription(content: string): string {
    return content.substring(0, 155) + '...';
  }

  private generateTags(article: NewsArticle): string[] {
    const tags = [
      article.sport,
      article.category,
      ...Object.keys(article.metadata)
    ];
    return Array.from(new Set(tags));
  }

  private determineCategory(article: any): string {
    if (article.Categories?.includes('Injuries')) return 'player';
    if (article.Categories?.includes('Team')) return 'team';
    if (article.Categories?.includes('League')) return 'league';
    if (article.Title.toLowerCase().includes('odds') || 
        article.Title.toLowerCase().includes('betting')) return 'betting';
    return 'general';
  }

  async getLatestNews(sport?: string, category?: string, limit: number = 10) {
    const query = `
      SELECT 
        na.*,
        pn.player_name,
        pn.injury_status,
        pn.status_update,
        pn.impact_analysis
      FROM news_articles na
      LEFT JOIN player_news pn ON na.id = pn.article_id
      WHERE is_published = true
      ${sport ? 'AND na.sport = $1' : ''}
      ${category ? `AND na.category = ${sport ? '$2' : '$1'}` : ''}
      ORDER BY na.published_at DESC
      LIMIT ${sport && category ? '$3' : (sport || category ? '$2' : '$1')}
    `;

    const params = [
      ...(sport ? [sport] : []),
      ...(category ? [category] : []),
      limit
    ];

    const { rows } = await this.pool.query(query, params);
    return rows;
  }
}

export const newsFeedService = new NewsFeedService();
