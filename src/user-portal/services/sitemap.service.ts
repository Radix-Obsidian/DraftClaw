import { Pool } from 'pg';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { createGzip } from 'zlib';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger';

export class SitemapService {
  private pool: Pool;
  private baseUrl: string;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.baseUrl = process.env.DRAFTCLAW_PORTAL_URL || 'https://draftclaw.ai';
  }

  async generateSitemap() {
    try {
      const links = await this.getAllLinks();
      const stream = new SitemapStream({ hostname: this.baseUrl });
      const data = await streamToPromise(Readable.from(links).pipe(stream));
      
      // Save uncompressed sitemap
      await writeFile(
        join(__dirname, '../public/sitemap.xml'),
        data.toString()
      );

      // Save gzipped sitemap
      await writeFile(
        join(__dirname, '../public/sitemap.xml.gz'),
        await this.gzipContent(data)
      );

      logger.info('Sitemap generated successfully');
    } catch (error) {
      logger.error('Error generating sitemap:', error);
      throw error;
    }
  }

  private async getAllLinks() {
    const links = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/picks', changefreq: 'hourly', priority: 0.9 },
      { url: '/news', changefreq: 'hourly', priority: 0.8 },
    ];

    // Add sport-specific pages
    const sports = ['NBA', 'UFC', 'Soccer'];
    for (const sport of sports) {
      links.push(
        { url: `/picks/${sport.toLowerCase()}`, changefreq: 'hourly', priority: 0.8 },
        { url: `/news/${sport.toLowerCase()}`, changefreq: 'daily', priority: 0.7 }
      );
    }

    // Add news article pages
    const { rows: articles } = await this.pool.query(
      'SELECT slug, updated_at FROM news_articles WHERE is_published = true'
    );

    for (const article of articles) {
      links.push({
        url: `/news/${article.slug}`,
        lastmod: article.updated_at.toISOString(),
        changefreq: 'weekly',
        priority: 0.6
      });
    }

    return links;
  }

  private async gzipContent(content: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gzip = createGzip();
      const chunks: Buffer[] = [];
      
      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      
      gzip.write(content);
      gzip.end();
    });
  }
}

export const sitemapService = new SitemapService();
