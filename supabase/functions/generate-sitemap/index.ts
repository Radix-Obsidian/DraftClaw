import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const baseUrl = 'https://draftclaw.ai';
    const sports = ['nba', 'ufc', 'soccer'];

    // Static pages
    const staticLinks = [
      { loc: '/', changefreq: 'daily', priority: '1.0' },
      { loc: '/picks', changefreq: 'hourly', priority: '0.9' },
      { loc: '/news', changefreq: 'hourly', priority: '0.8' },
      { loc: '/pricing', changefreq: 'weekly', priority: '0.7' },
      { loc: '/about', changefreq: 'monthly', priority: '0.5' },
    ];

    // Sport-specific pages
    for (const sport of sports) {
      staticLinks.push(
        { loc: `/picks/${sport}`, changefreq: 'hourly', priority: '0.8' },
        { loc: `/news/${sport}`, changefreq: 'daily', priority: '0.7' }
      );
    }

    // Fetch news articles
    const { data: articles, error } = await supabaseClient
      .from('news_articles')
      .select('slug, updated_at')
      .eq('is_published', true);

    if (error) throw error;

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static links
    for (const link of staticLinks) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${link.loc}</loc>\n`;
      xml += `    <changefreq>${link.changefreq}</changefreq>\n`;
      xml += `    <priority>${link.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add news articles
    for (const article of articles || []) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/news/${article.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += '</urlset>';

    // Store sitemap in Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('public')
      .upload('sitemap.xml', new Blob([xml], { type: 'application/xml' }), {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    return new Response(
      JSON.stringify({ success: true, message: 'Sitemap generated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
