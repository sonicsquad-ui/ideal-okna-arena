/**
 * RSS 2.0 and Sitemap generator for Champion-Tennis.ru
 */

function generateRssXml(newsItems, siteUrl = 'https://champion-tennis.ru') {
  const itemsXml = newsItems.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${siteUrl}/news/${item.category}/${item.slug}</link>
      <guid isPermaLink="true">${siteUrl}/news/${item.category}/${item.slug}</guid>
      <description><![CDATA[${item.excerpt}]]></description>
      <content:encoded><![CDATA[${item.content}]]></content:encoded>
      <category><![CDATA[${item.category_label || item.category}]]></category>
      <pubDate>${new Date(item.published_at || Date.now()).toUTCString()}</pubDate>
      ${item.image ? `<enclosure url="${siteUrl}${item.image}" type="image/jpeg" />` : ''}
    </item>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Чемпион-Теннис | Свежие новости спорта и тенниса</title>
    <link>${siteUrl}</link>
    <description>Оперативные новости тенниса ATP, WTA, турниров Большого шлема, сборной России, падела и пиклбола на портале Чемпион-Теннис.</description>
    <language>ru-RU</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/images/hero-tennis-ball.jpg</url>
      <title>Чемпион-Теннис</title>
      <link>${siteUrl}</link>
    </image>
    ${itemsXml}
  </channel>
</rss>`;
}

function generateNewsRssXml(newsItems, siteUrl = 'https://champion-tennis.ru') {
  const itemsXml = newsItems.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${siteUrl}/news/${item.category}/${item.slug}</link>
      <guid>${siteUrl}/news/${item.category}/${item.slug}</guid>
      <description><![CDATA[${item.excerpt}]]></description>
      <category><![CDATA[Теннис]]></category>
      <pubDate>${new Date(item.published_at || Date.now()).toUTCString()}</pubDate>
      <author>redaction@champion-tennis.ru (Чемпион-Теннис)</author>
      ${item.image ? `<media:content url="${siteUrl}${item.image}" medium="image" />` : ''}
    </item>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Чемпион-Теннис — Срочная новостная лента</title>
    <link>${siteUrl}/news</link>
    <description>Главные теннисные новости за 24 часа. Эксклюзивные репортажи, результаты матчей, комментарии экспертов.</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/news-rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

function generateSitemapXml(urls, siteUrl = 'https://champion-tennis.ru') {
  const today = new Date().toISOString().split('T')[0];
  const urlEntries = urls.map(u => `
  <url>
    <loc>${siteUrl}${u.path}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq || 'daily'}</changefreq>
    <priority>${u.priority || '0.7'}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

module.exports = { generateRssXml, generateNewsRssXml, generateSitemapXml };
