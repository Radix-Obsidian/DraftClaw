import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get latest news articles
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sport, category, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        na.id,
        na.title,
        na.slug,
        na.summary,
        na.source,
        na.published_at,
        na.sport,
        na.category,
        na.seo_title,
        na.seo_description,
        na.tags,
        na.is_featured,
        na.metadata
      FROM news_articles na
      WHERE na.is_published = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (sport) {
      query += ` AND na.sport = $${paramIndex}`;
      params.push(sport);
      paramIndex++;
    }

    if (category) {
      query += ` AND na.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY na.is_featured DESC, na.published_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM news_articles na
      WHERE na.is_published = true
      ${sport ? `AND na.sport = $1` : ''}
      ${category ? `AND na.category = ${sport ? '$2' : '$1'}` : ''}
    `;
    const countParams = [
      ...(sport ? [sport] : []),
      ...(category ? [category] : [])
    ];
    const { rows: countRows } = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: parseInt(countRows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    logger.error('Error fetching news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

// Get single news article by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { rows } = await pool.query(`
      SELECT 
        na.*,
        pn.player_name,
        pn.player_team,
        pn.injury_status,
        pn.status_update,
        pn.impact_analysis
      FROM news_articles na
      LEFT JOIN player_news pn ON na.id = pn.article_id
      WHERE na.slug = $1 AND na.is_published = true
    `, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch article' });
  }
});

// Get featured news
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        na.id,
        na.title,
        na.slug,
        na.summary,
        na.sport,
        na.published_at,
        na.metadata
      FROM news_articles na
      WHERE na.is_published = true AND na.is_featured = true
      ORDER BY na.published_at DESC
      LIMIT 5
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Error fetching featured news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch featured news' });
  }
});

// Get player news
router.get('/players/:sport', async (req: Request, res: Response) => {
  try {
    const { sport } = req.params;
    const { limit = 10 } = req.query;

    const { rows } = await pool.query(`
      SELECT 
        pn.*,
        na.title,
        na.slug,
        na.published_at
      FROM player_news pn
      JOIN news_articles na ON pn.article_id = na.id
      WHERE na.sport = $1 AND na.is_published = true
      ORDER BY na.published_at DESC
      LIMIT $2
    `, [sport.toUpperCase(), limit]);

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Error fetching player news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch player news' });
  }
});

// Search news
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const { rows } = await pool.query(`
      SELECT 
        na.id,
        na.title,
        na.slug,
        na.summary,
        na.sport,
        na.category,
        na.published_at,
        ts_rank(to_tsvector('english', na.title || ' ' || na.content), plainto_tsquery('english', $1)) as rank
      FROM news_articles na
      WHERE na.is_published = true
        AND (
          to_tsvector('english', na.title || ' ' || na.content) @@ plainto_tsquery('english', $1)
          OR na.title ILIKE $2
        )
      ORDER BY rank DESC, na.published_at DESC
      LIMIT $3
    `, [q, `%${q}%`, limit]);

    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Error searching news:', error);
    res.status(500).json({ success: false, error: 'Failed to search news' });
  }
});

export default router;
