import React from 'react';
import Head from 'next/head';

interface OrganizationSchemaProps {
  type: 'Organization';
}

interface ArticleSchemaProps {
  type: 'Article';
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  publisher?: string;
}

interface SportEventSchemaProps {
  type: 'SportsEvent';
  name: string;
  startDate: string;
  location?: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
}

interface BreadcrumbSchemaProps {
  type: 'BreadcrumbList';
  items: Array<{ name: string; url: string }>;
}

interface FAQSchemaProps {
  type: 'FAQPage';
  questions: Array<{ question: string; answer: string }>;
}

type SchemaProps =
  | OrganizationSchemaProps
  | ArticleSchemaProps
  | SportEventSchemaProps
  | BreadcrumbSchemaProps
  | FAQSchemaProps;

export const SchemaMarkup: React.FC<SchemaProps> = (props) => {
  const baseUrl = 'https://draftclaw.ai';

  const generateSchema = () => {
    switch (props.type) {
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'DraftClaw',
          url: baseUrl,
          logo: `${baseUrl}/logo.png`,
          description: 'AI-powered sports betting picks and analysis for NBA, UFC, and Soccer',
          sameAs: [
            'https://twitter.com/draftclaw',
            'https://instagram.com/draftclaw'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: 'English'
          }
        };

      case 'Article':
        return {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: props.title,
          description: props.description,
          url: `${baseUrl}${props.url}`,
          image: props.image || `${baseUrl}/og-image.png`,
          datePublished: props.datePublished,
          dateModified: props.dateModified || props.datePublished,
          author: {
            '@type': 'Organization',
            name: props.author || 'DraftClaw'
          },
          publisher: {
            '@type': 'Organization',
            name: 'DraftClaw',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}${props.url}`
          }
        };

      case 'SportsEvent':
        return {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: props.name,
          startDate: props.startDate,
          location: props.location ? {
            '@type': 'Place',
            name: props.location
          } : undefined,
          competitor: [
            {
              '@type': 'SportsTeam',
              name: props.homeTeam
            },
            {
              '@type': 'SportsTeam',
              name: props.awayTeam
            }
          ],
          sport: props.sport
        };

      case 'BreadcrumbList':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: props.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${baseUrl}${item.url}`
          }))
        };

      case 'FAQPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: props.questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: q.answer
            }
          }))
        };

      default:
        return null;
    }
  };

  const schema = generateSchema();

  if (!schema) return null;

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Head>
  );
};

// Website-wide schema for the homepage
export const WebsiteSchema: React.FC = () => {
  const baseUrl = 'https://draftclaw.ai';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DraftClaw',
    url: baseUrl,
    description: 'AI-powered sports betting picks and analysis',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Head>
  );
};

export default SchemaMarkup;
