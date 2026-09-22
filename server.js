/**
 * Champion-Tennis.ru (Чемпион-Теннис)
 * Главный многостраничный адаптивный портал новостей тенниса, турниров, рейтингов и блога
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const { db } = require('./db/database');
const { transliterate } = require('./lib/translit');
const { forwardSubmission } = require('./lib/mailer');
const { runNewsAggregation } = require('./lib/news_aggregator');
const { generateRssXml, generateNewsRssXml, generateSitemapXml } = require('./lib/rss_builder');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Multer for admin image uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Session for Admin authentication
app.use(session({
  secret: 'champion-tennis-secret-2026-secure-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Helper to get global site settings
function getGlobalSettings() {
  const settings = {};
  const rows = db.prepare('SELECT key, value_json FROM global_blocks').all();
  for (const r of rows) {
    try {
      settings[r.key] = JSON.parse(r.value_json);
    } catch (e) {
      settings[r.key] = {};
    }
  }
  return settings;
}

// Make global blocks available in all views
app.use((req, res, next) => {
  res.locals.globalSettings = getGlobalSettings();
  res.locals.currentPath = req.path;
  next();
});

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }
  res.redirect('/admin/login');
}

// Helper: Format date in Russian (Moscow timezone)
function formatDateRu(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ' ' + d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==========================================================================
// 1. PUBLIC ROUTES: HOMEPAGE (SXO Architecture)
// ==========================================================================

app.get('/', (req, res) => {
  // 1. Live Matches today
  const liveMatches = db.prepare('SELECT * FROM live_matches ORDER BY is_live DESC, id ASC').all();

  // 2. Top-3 News for the last 24h
  const rawTop24 = db.prepare(`
    SELECT * FROM news 
    WHERE is_hot_24h = 1 OR is_featured = 1
    ORDER BY published_at DESC 
    LIMIT 3
  `).all();
  const top24News = rawTop24.map(n => ({
    ...n,
    published_at_formatted: formatDateRu(n.published_at)
  }));

  // 3. Editors Choice (Top 3 blog articles)
  const rawEditors = db.prepare(`
    SELECT * FROM articles 
    WHERE is_editors_choice = 1
    ORDER BY published_at DESC 
    LIMIT 3
  `).all();
  const editorsArticles = rawEditors.map(a => ({
    ...a,
    published_at_formatted: formatDateRu(a.published_at)
  }));

  // 4. ATP Top-5 and WTA Top-5
  const top5Atp = db.prepare("SELECT * FROM players WHERE gender = 'M' ORDER BY rank ASC LIMIT 5").all();
  const top5Wta = db.prepare("SELECT * FROM players WHERE gender = 'F' ORDER BY rank ASC LIMIT 5").all();

  // 5. Russian Stars spotlight
  const russianStars = db.prepare("SELECT * FROM players WHERE country_code = 'RUS' ORDER BY rank ASC LIMIT 4").all();

  res.render('pages/index', {
    title: 'Чемпион-Теннис | Главный портал тенниса России — Новости, Рейтинги, Турниры',
    meta_description: 'Все новости тенниса сегодня: результаты матчей ATP и WTA, турниры Большого шлема, аналитика, календарь, рейтинги игроков и мир падела на champion-tennis.ru.',
    liveMatches,
    top24News,
    editorsArticles,
    top5Atp,
    top5Wta,
    russianStars
  });
});

// ==========================================================================
// 2. PUBLIC ROUTES: NEWS HUB & SINGLE NEWS
// ==========================================================================

const NEWS_CATEGORIES = {
  'atp': 'ATP Тур (Мужчины)',
  'wta': 'WTA Тур (Женщины)',
  'grand-slam': 'Турниры Большого шлема',
  'team-russia': 'Сборная России / РТТ',
  'padel-pickleball': 'Падел и Пиклбол'
};

// News Hub (/news or /news/:category)
app.get(['/news', '/news/:category'], (req, res, next) => {
  const categoryParam = req.params.category;
  
  // If param is a known category or 'all'
  let currentCategory = 'all';
  let categoryTitle = 'Все новости тенниса';
  
  if (categoryParam) {
    if (NEWS_CATEGORIES[categoryParam]) {
      currentCategory = categoryParam;
      categoryTitle = NEWS_CATEGORIES[categoryParam];
    } else {
      // If it doesn't match a known category, let next handler check
      return next();
    }
  }

  const sort = req.query.sort === 'views' ? 'views' : 'date';
  const orderClause = sort === 'views' ? 'ORDER BY views DESC' : 'ORDER BY published_at DESC';

  let rawNews;
  if (currentCategory === 'all') {
    rawNews = db.prepare(`SELECT * FROM news ${orderClause} LIMIT 50`).all();
  } else {
    rawNews = db.prepare(`SELECT * FROM news WHERE category = ? ${orderClause} LIMIT 50`).all(currentCategory);
  }

  const newsList = rawNews.map(n => ({
    ...n,
    published_at_formatted: formatDateRu(n.published_at)
  }));

  const breadcrumbs = [
    { title: 'Новости', url: '/news' }
  ];
  if (currentCategory !== 'all') {
    breadcrumbs.push({ title: categoryTitle, url: `/news/${currentCategory}` });
  }

  res.render('pages/news_hub', {
    title: `${categoryTitle} — Новости тенниса | Чемпион-Теннис`,
    meta_description: `Свежие новости тенниса: ${categoryTitle}. Оперативные результаты, эксклюзивные репортажи и интервью на champion-tennis.ru.`,
    newsList,
    currentCategory,
    categoryTitle,
    currentSort: sort,
    breadcrumbs
  });
});

// Single News Item: /news/:category/:slug
app.get('/news/:category/:slug', (req, res) => {
  const { category, slug } = req.params;

  const newsItem = db.prepare('SELECT * FROM news WHERE slug = ?').get(slug);
  if (!newsItem) {
    return res.status(404).send('Новость не найдена');
  }

  // Increment views
  db.prepare('UPDATE news SET views = views + 1 WHERE id = ?').run(newsItem.id);
  newsItem.views += 1;
  newsItem.published_at_formatted = formatDateRu(newsItem.published_at);

  const categoryLabel = NEWS_CATEGORIES[newsItem.category] || 'Новости';

  // Related news
  const rawRelated = db.prepare(`
    SELECT * FROM news 
    WHERE category = ? AND id != ?
    ORDER BY published_at DESC 
    LIMIT 3
  `).all(newsItem.category, newsItem.id);
  const relatedNews = rawRelated.map(n => ({
    ...n,
    published_at_formatted: formatDateRu(n.published_at)
  }));

  const breadcrumbs = [
    { title: 'Новости', url: '/news' },
    { title: categoryLabel, url: `/news/${newsItem.category}` },
    { title: newsItem.title, url: `/news/${newsItem.category}/${newsItem.slug}` }
  ];

  res.render('pages/news_single', {
    newsItem,
    categoryLabel,
    relatedNews,
    breadcrumbs
  });
});

// ==========================================================================
// 3. PUBLIC ROUTES: TOURNAMENTS & CALENDAR
// ==========================================================================

app.get('/tournaments', (req, res) => {
  const tournaments = db.prepare('SELECT * FROM tournaments ORDER BY id ASC').all();
  const liveMatches = db.prepare('SELECT * FROM live_matches ORDER BY is_live DESC, id ASC').all();

  const breadcrumbs = [
    { title: 'Турниры и календарь', url: '/tournaments' }
  ];

  res.render('pages/tournaments', {
    tournaments,
    liveMatches,
    breadcrumbs
  });
});

// ==========================================================================
// 4. PUBLIC ROUTES: RANKINGS & PLAYERS & H2H
// ==========================================================================

app.get('/rankings', (req, res) => {
  const type = req.query.type === 'wta' ? 'wta' : 'atp';
  const gender = type === 'wta' ? 'F' : 'M';
  const playersList = db.prepare('SELECT * FROM players WHERE gender = ? ORDER BY rank ASC').all(gender);

  const breadcrumbs = [
    { title: 'Рейтинги', url: '/rankings' }
  ];

  res.render('pages/rankings', {
    playersList,
    currentType: type,
    breadcrumbs
  });
});

app.get('/players', (req, res) => {
  const players = db.prepare('SELECT * FROM players ORDER BY rank ASC').all();

  const breadcrumbs = [
    { title: 'Игроки и H2H', url: '/players' }
  ];

  res.render('pages/players', {
    players,
    breadcrumbs
  });
});

app.get('/players/:slug', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE slug = ?').get(req.params.slug);
  if (!player) {
    return res.status(404).send('Игрок не найден');
  }

  let h2hList = [];
  try {
    h2hList = JSON.parse(player.h2h_data || '[]');
  } catch (e) {
    h2hList = [];
  }

  // Related news mentioning this player
  const rawRelated = db.prepare(`
    SELECT * FROM news 
    WHERE title LIKE ? OR content LIKE ?
    ORDER BY published_at DESC 
    LIMIT 3
  `).all(`%${player.name}%`, `%${player.name}%`);
  const relatedNews = rawRelated.map(n => ({
    ...n,
    published_at_formatted: formatDateRu(n.published_at)
  }));

  const breadcrumbs = [
    { title: 'Игроки', url: '/players' },
    { title: player.name, url: `/players/${player.slug}` }
  ];

  res.render('pages/player_single', {
    player,
    h2hList,
    relatedNews,
    breadcrumbs
  });
});

// ==========================================================================
// 5. PUBLIC ROUTES: BLOG & ANALYTICS
// ==========================================================================

const BLOG_CATEGORIES = {
  'previews': 'Превью и прогнозы',
  'tactics': 'Разбор тактики и техники',
  'interviews': 'Эксклюзивные интервью',
  'reviews': 'Обзоры прошедших турниров'
};

// Blog Hub (/blog or /blog/:category)
app.get(['/blog', '/blog/:category'], (req, res, next) => {
  const categoryParam = req.params.category;
  let currentCategory = 'all';
  let categoryTitle = 'Все статьи блога';

  if (categoryParam) {
    if (BLOG_CATEGORIES[categoryParam]) {
      currentCategory = categoryParam;
      categoryTitle = BLOG_CATEGORIES[categoryParam];
    } else {
      return next();
    }
  }

  let rawArticles;
  if (currentCategory === 'all') {
    rawArticles = db.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
  } else {
    rawArticles = db.prepare('SELECT * FROM articles WHERE category = ? ORDER BY published_at DESC').all(currentCategory);
  }

  const articles = rawArticles.map(a => ({
    ...a,
    published_at_formatted: formatDateRu(a.published_at)
  }));

  const breadcrumbs = [
    { title: 'Аналитика и Блог', url: '/blog' }
  ];
  if (currentCategory !== 'all') {
    breadcrumbs.push({ title: categoryTitle, url: `/blog/${currentCategory}` });
  }

  res.render('pages/blog_hub', {
    articles,
    currentCategory,
    categoryTitle,
    breadcrumbs
  });
});

// Single Blog Article: /blog/:category/:slug
app.get('/blog/:category/:slug', (req, res) => {
  const { category, slug } = req.params;

  const article = db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);
  if (!article) {
    return res.status(404).send('Статья не найдена');
  }

  // Increment views
  db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);
  article.views += 1;
  article.published_at_formatted = formatDateRu(article.published_at);

  const categoryLabel = BLOG_CATEGORIES[article.category] || 'Аналитика';

  const rawRelated = db.prepare(`
    SELECT * FROM articles 
    WHERE category = ? AND id != ?
    ORDER BY published_at DESC 
    LIMIT 3
  `).all(article.category, article.id);
  const relatedArticles = rawRelated.map(a => ({
    ...a,
    published_at_formatted: formatDateRu(a.published_at)
  }));

  const breadcrumbs = [
    { title: 'Аналитика и Блог', url: '/blog' },
    { title: categoryLabel, url: `/blog/${article.category}` },
    { title: article.title, url: `/blog/${article.category}/${article.slug}` }
  ];

  res.render('pages/blog_single', {
    article,
    categoryLabel,
    relatedArticles,
    breadcrumbs
  });
});

// ==========================================================================
// 6. PUBLIC ROUTES: GEAR & GLOSSARY
// ==========================================================================

app.get('/gear', (req, res) => {
  const rawGear = db.prepare('SELECT * FROM gear_reviews ORDER BY id ASC').all();
  const gearList = rawGear.map(g => {
    let specs = {};
    let pros_cons = {};
    try { specs = JSON.parse(g.specs_json || '{}'); } catch(e){}
    try { pros_cons = JSON.parse(g.pros_cons_json || '{}'); } catch(e){}
    return { ...g, specs, pros_cons };
  });

  const breadcrumbs = [
    { title: 'Экипировка и Ракетки', url: '/gear' }
  ];

  res.render('pages/gear', {
    gearList,
    breadcrumbs
  });
});

app.get('/glossary', (req, res) => {
  const glossary = db.prepare('SELECT * FROM glossary ORDER BY term ASC').all();
  const lettersSet = new Set(glossary.map(g => g.letter));
  const letters = Array.from(lettersSet).sort();

  const breadcrumbs = [
    { title: 'Экипировка и Обучение', url: '/gear' },
    { title: 'Глоссарий терминов', url: '/glossary' }
  ];

  res.render('pages/glossary', {
    glossary,
    letters,
    breadcrumbs
  });
});

// ==========================================================================
// 7. PUBLIC ROUTES: LEGAL & STATIC PAGES
// ==========================================================================

app.get('/about', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'about'").get();
  const breadcrumbs = [{ title: 'О проекте и Редакция', url: '/about' }];
  res.render('pages/about', { page, breadcrumbs });
});

app.get('/contacts', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'contacts'").get();
  const breadcrumbs = [{ title: 'Контакты и Реклама', url: '/contacts' }];
  res.render('pages/contacts', { page, breadcrumbs });
});

app.get('/user-agreement', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'user-agreement'").get();
  const breadcrumbs = [{ title: 'Пользовательское соглашение', url: '/user-agreement' }];
  res.render('pages/user_agreement', { page, breadcrumbs });
});

app.get('/privacy-policy', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'privacy-policy'").get();
  const breadcrumbs = [{ title: 'Политика конфиденциальности', url: '/privacy-policy' }];
  res.render('pages/privacy_policy', { page, breadcrumbs });
});

app.get('/site-rules', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'site-rules'").get();
  const breadcrumbs = [{ title: 'Правила пользования сайтом', url: '/site-rules' }];
  res.render('pages/site_rules', { page, breadcrumbs });
});

app.get('/sitemap', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'sitemap'").get();
  const breadcrumbs = [{ title: 'Карта сайта', url: '/sitemap' }];
  res.render('pages/sitemap', { page, breadcrumbs });
});

// ==========================================================================
// 8. PUBLIC ROUTES: RSS & XML SITEMAPS
// ==========================================================================

app.get('/rss.xml', (req, res) => {
  const news = db.prepare('SELECT * FROM news ORDER BY published_at DESC LIMIT 30').all();
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(generateRssXml(news));
});

app.get('/news-rss.xml', (req, res) => {
  const news = db.prepare('SELECT * FROM news ORDER BY published_at DESC LIMIT 30').all();
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(generateNewsRssXml(news));
});

app.get('/sitemap.xml', (req, res) => {
  const urls = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/news', priority: '0.9', changefreq: 'hourly' },
    { path: '/news/atp', priority: '0.8', changefreq: 'daily' },
    { path: '/news/wta', priority: '0.8', changefreq: 'daily' },
    { path: '/news/grand-slam', priority: '0.8', changefreq: 'daily' },
    { path: '/news/team-russia', priority: '0.8', changefreq: 'daily' },
    { path: '/news/padel-pickleball', priority: '0.8', changefreq: 'daily' },
    { path: '/tournaments', priority: '0.9', changefreq: 'daily' },
    { path: '/rankings', priority: '0.9', changefreq: 'weekly' },
    { path: '/players', priority: '0.8', changefreq: 'weekly' },
    { path: '/blog', priority: '0.8', changefreq: 'daily' },
    { path: '/gear', priority: '0.8', changefreq: 'weekly' },
    { path: '/glossary', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/contacts', priority: '0.6', changefreq: 'monthly' },
    { path: '/user-agreement', priority: '0.4', changefreq: 'yearly' },
    { path: '/privacy-policy', priority: '0.4', changefreq: 'yearly' },
    { path: '/site-rules', priority: '0.4', changefreq: 'yearly' },
    { path: '/sitemap', priority: '0.5', changefreq: 'weekly' }
  ];

  // Add all news items
  const news = db.prepare('SELECT category, slug, published_at FROM news').all();
  for (const n of news) {
    urls.push({
      path: `/news/${n.category}/${n.slug}`,
      lastmod: (n.published_at || '').split(' ')[0],
      priority: '0.7',
      changefreq: 'monthly'
    });
  }

  // Add all blog articles
  const articles = db.prepare('SELECT category, slug, published_at FROM articles').all();
  for (const a of articles) {
    urls.push({
      path: `/blog/${a.category}/${a.slug}`,
      lastmod: (a.published_at || '').split(' ')[0],
      priority: '0.8',
      changefreq: 'monthly'
    });
  }

  // Add players
  const players = db.prepare('SELECT slug FROM players').all();
  for (const p of players) {
    urls.push({
      path: `/players/${p.slug}`,
      priority: '0.7',
      changefreq: 'weekly'
    });
  }

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.send(generateSitemapXml(urls));
});

// ==========================================================================
// 9. PUBLIC APIS: SEARCH & FORMS
// ==========================================================================

// Global Site-Wide Search
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    return res.json({ results: [], total: 0 });
  }

  const queryLike = `%${q}%`;
  const results = [];

  // 1. Search News
  const newsMatches = db.prepare(`
    SELECT title, category, slug, published_at 
    FROM news 
    WHERE title LIKE ? OR excerpt LIKE ? 
    ORDER BY published_at DESC LIMIT 4
  `).all(queryLike, queryLike);

  for (const n of newsMatches) {
    results.push({
      title: n.title,
      type_label: 'Новость',
      url: `/news/${n.category}/${n.slug}`,
      date: formatDateRu(n.published_at)
    });
  }

  // 2. Search Blog Articles
  const blogMatches = db.prepare(`
    SELECT title, category, slug, published_at 
    FROM articles 
    WHERE title LIKE ? OR excerpt LIKE ? 
    ORDER BY published_at DESC LIMIT 3
  `).all(queryLike, queryLike);

  for (const a of blogMatches) {
    results.push({
      title: a.title,
      type_label: 'Статья',
      url: `/blog/${a.category}/${a.slug}`,
      date: formatDateRu(a.published_at)
    });
  }

  // 3. Search Players
  const playerMatches = db.prepare(`
    SELECT name, name_en, slug 
    FROM players 
    WHERE name LIKE ? OR name_en LIKE ? 
    LIMIT 3
  `).all(queryLike, queryLike);

  for (const p of playerMatches) {
    results.push({
      title: `${p.name} (${p.name_en})`,
      type_label: 'Игрок',
      url: `/players/${p.slug}`,
      date: 'Досье'
    });
  }

  res.json({ results, total: results.length });
});

// Search Page
app.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  const queryLike = `%${q}%`;
  const results = [];

  if (q.length >= 2) {
    const newsMatches = db.prepare(`SELECT * FROM news WHERE title LIKE ? OR excerpt LIKE ? LIMIT 15`).all(queryLike, queryLike);
    for (const n of newsMatches) {
      results.push({
        title: n.title,
        type_label: 'Новость',
        url: `/news/${n.category}/${n.slug}`,
        date: formatDateRu(n.published_at),
        snippet: n.excerpt
      });
    }

    const blogMatches = db.prepare(`SELECT * FROM articles WHERE title LIKE ? OR excerpt LIKE ? LIMIT 10`).all(queryLike, queryLike);
    for (const a of blogMatches) {
      results.push({
        title: a.title,
        type_label: 'Статья блога',
        url: `/blog/${a.category}/${a.slug}`,
        date: formatDateRu(a.published_at),
        snippet: a.excerpt
      });
    }

    const playerMatches = db.prepare(`SELECT * FROM players WHERE name LIKE ? OR name_en LIKE ? OR bio LIKE ? LIMIT 8`).all(queryLike, queryLike, queryLike);
    for (const p of playerMatches) {
      results.push({
        title: `${p.name} (${p.name_en}) — Рейтинг #${p.rank}`,
        type_label: 'Профиль игрока',
        url: `/players/${p.slug}`,
        date: `Рейтинг #${p.rank}`,
        snippet: p.bio
      });
    }
  }

  const breadcrumbs = [
    { title: 'Поиск по сайту', url: '/search' }
  ];

  res.render('pages/search_results', {
    query: q,
    results,
    breadcrumbs
  });
});

// Newsletter subscription API
app.post('/api/subscribe', async (req, res) => {
  const email = (req.body.email || '').trim();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Укажите корректный email адрес' });
  }

  const pageUrl = req.body.pageUrl || 'https://champion-tennis.ru/';

  db.prepare(`
    INSERT INTO form_submissions (form_type, name, contact_info, subject, message, source_url, forwarded_to)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'newsletter',
    'Подписчик',
    email,
    'Подписка на ежедневный дайджест 8:00 МСК',
    'Пользователь запросил получение утренней теннисной рассылки',
    pageUrl,
    'sonicsquad@mail.ru'
  );

  // Background dispatch to sonicsquad@mail.ru
  forwardSubmission({
    type: 'Подписка на утренний теннисный дайджест',
    name: 'Подписчик рассылки',
    contact: email,
    subject: 'Новая подписка на ежедневную рассылку',
    message: 'Пользователь подписался на утренний дайджест 8:00 МСК',
    pageUrl
  });

  res.json({ success: true, message: 'Вы успешно подписались на рассылку' });
});

// Contact & Advertising inquiry API
app.post('/api/contact', async (req, res) => {
  const { name, contact, subject, message, form_type, pageUrl } = req.body;
  if (!contact || !message) {
    return res.status(400).json({ success: false, error: 'Пожалуйста, заполните обязательные поля' });
  }

  db.prepare(`
    INSERT INTO form_submissions (form_type, name, contact_info, subject, message, source_url, forwarded_to)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    form_type || 'contact',
    name || 'Не указано',
    contact,
    subject || 'Обращение с сайта',
    message,
    pageUrl || 'https://champion-tennis.ru/contacts',
    'sonicsquad@mail.ru'
  );

  // Background dispatch to sonicsquad@mail.ru
  forwardSubmission({
    type: form_type || 'Обратная связь',
    name,
    contact,
    subject,
    message,
    pageUrl
  });

  res.json({ success: true, message: 'Сообщение успешно отправлено в редакцию' });
});

// ==========================================================================
// 10. ADMIN PANEL CONTROLLER (/admin)
// ==========================================================================

// Admin Login
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin');
  }
  res.render('admin/login');
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('admin/login', { error: 'Неверный логин или пароль администратора' });
  }

  // Update last login
  db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  req.session.adminUser = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  res.redirect('/admin');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Helper for admin statistics
function getAdminStats() {
  return {
    pagesCount: db.prepare('SELECT COUNT(*) as c FROM pages').get().c,
    articlesCount: db.prepare('SELECT COUNT(*) as c FROM articles').get().c,
    newsCount: db.prepare('SELECT COUNT(*) as c FROM news').get().c,
    submissionsCount: db.prepare('SELECT COUNT(*) as c FROM form_submissions').get().c
  };
}

// Admin Dashboard
app.get('/admin', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const recentSubmissions = db.prepare('SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 6').all();
  
  const cronRow = db.prepare("SELECT value_json FROM global_blocks WHERE key = 'news_cron_status'").get();
  let cronStatus = {};
  if (cronRow) {
    try { cronStatus = JSON.parse(cronRow.value_json); } catch(e){}
  }

  res.render('admin/dashboard', {
    stats,
    recentSubmissions,
    cronStatus
  });
});

// --- Admin Pages Management ---

app.get('/admin/pages', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const pages = db.prepare('SELECT * FROM pages ORDER BY is_system DESC, id ASC').all();
  res.render('admin/pages_list', { stats, pages });
});

app.get('/admin/pages/new', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  res.render('admin/page_edit', { stats, isNew: true, page: null });
});

app.post('/admin/pages/new', requireAdmin, (req, res) => {
  let { title, slug, meta_title, meta_description, meta_keywords, content } = req.body;
  if (!slug) {
    slug = transliterate(title);
  } else {
    slug = transliterate(slug);
  }

  try {
    db.prepare(`
      INSERT INTO pages (slug, title, meta_title, meta_description, meta_keywords, content, is_system)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(slug, title, meta_title || title, meta_description || '', meta_keywords || '', content || '');
    res.redirect('/admin/pages');
  } catch (err) {
    res.status(400).send('Ошибка создания страницы: URL slug уже существует');
  }
});

app.get('/admin/pages/edit/:id', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).send('Страница не найдена');
  res.render('admin/page_edit', { stats, isNew: false, page });
});

app.post('/admin/pages/edit/:id', requireAdmin, (req, res) => {
  const { title, slug, meta_title, meta_description, meta_keywords, content } = req.body;
  const pageId = req.params.id;
  const existing = db.prepare('SELECT * FROM pages WHERE id = ?').get(pageId);

  // If page is system, keep slug fixed to protect routing
  const finalSlug = existing && existing.is_system ? existing.slug : (transliterate(slug) || existing.slug);

  db.prepare(`
    UPDATE pages 
    SET title = ?, slug = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, finalSlug, meta_title, meta_description, meta_keywords, content, pageId);

  res.redirect('/admin/pages');
});

// Page Duplication (Копирование страниц)
app.get('/admin/pages/duplicate/:id', requireAdmin, (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (page) {
    const newSlug = page.slug + '-copy-' + Math.floor(Math.random() * 1000);
    const newTitle = page.title + ' (Копия)';
    db.prepare(`
      INSERT INTO pages (slug, title, meta_title, meta_description, meta_keywords, content, is_system)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(newSlug, newTitle, page.meta_title, page.meta_description, page.meta_keywords, page.content);
  }
  res.redirect('/admin/pages');
});

// Page Deletion
app.post('/admin/pages/delete/:id', requireAdmin, (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (page && !page.is_system) {
    db.prepare('DELETE FROM pages WHERE id = ?').run(page.id);
  }
  res.redirect('/admin/pages');
});

// --- Admin Blog Management ---

app.get('/admin/blog', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const articles = db.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
  res.render('admin/blog_list', { stats, articles });
});

app.get('/admin/blog/new', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  res.render('admin/blog_edit', { stats, isNew: true, article: null });
});

app.post('/admin/blog/new', requireAdmin, upload.single('image_file'), (req, res) => {
  let { title, slug, category, excerpt, content, image, author_name, author_role, reading_time, is_editors_choice, meta_title, meta_description } = req.body;
  if (!slug) slug = transliterate(title);
  else slug = transliterate(slug);

  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }

  db.prepare(`
    INSERT INTO articles (
      category, slug, title, excerpt, content, image,
      author_name, author_role, author_avatar, reading_time,
      is_editors_choice, meta_title, meta_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category, slug, title, excerpt, content, image || '/images/blog-tactics.jpg',
    author_name, author_role, '/images/author-coach.jpg', parseInt(reading_time || '5', 10),
    is_editors_choice ? 1 : 0, meta_title || title, meta_description || excerpt
  );

  res.redirect('/admin/blog');
});

app.get('/admin/blog/edit/:id', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).send('Статья не найдена');
  res.render('admin/blog_edit', { stats, isNew: false, article });
});

app.post('/admin/blog/edit/:id', requireAdmin, upload.single('image_file'), (req, res) => {
  let { title, slug, category, excerpt, content, image, author_name, author_role, reading_time, is_editors_choice, meta_title, meta_description } = req.body;
  const articleId = req.params.id;

  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }

  db.prepare(`
    UPDATE articles 
    SET category = ?, slug = ?, title = ?, excerpt = ?, content = ?, image = ?,
        author_name = ?, author_role = ?, reading_time = ?, is_editors_choice = ?,
        meta_title = ?, meta_description = ?
    WHERE id = ?
  `).run(
    category, transliterate(slug), title, excerpt, content, image,
    author_name, author_role, parseInt(reading_time || '5', 10),
    is_editors_choice ? 1 : 0, meta_title, meta_description, articleId
  );

  res.redirect('/admin/blog');
});

app.post('/admin/blog/delete/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.redirect('/admin/blog');
});

// --- Admin News Management ---

app.get('/admin/news', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const newsList = db.prepare('SELECT * FROM news ORDER BY published_at DESC').all();
  res.render('admin/news_list', { stats, newsList });
});

app.get('/admin/news/new', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  res.render('admin/news_edit', { stats, isNew: true, newsItem: null });
});

app.post('/admin/news/new', requireAdmin, upload.single('image_file'), (req, res) => {
  let { title, slug, category, excerpt, content, image, source_name, author, is_hot_24h, meta_title, meta_description } = req.body;
  if (!slug) slug = transliterate(title);
  else slug = transliterate(slug);

  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }

  db.prepare(`
    INSERT INTO news (
      category, slug, title, excerpt, content, image,
      source_name, author, is_hot_24h, meta_title, meta_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category, slug, title, excerpt, content, image || '/images/hero-tennis-ball.jpg',
    source_name || 'Редакция', author || 'Редакция Champion-Tennis.ru',
    is_hot_24h ? 1 : 0, meta_title || title, meta_description || excerpt
  );

  res.redirect('/admin/news');
});

app.get('/admin/news/edit/:id', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const newsItem = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!newsItem) return res.status(404).send('Новость не найдена');
  res.render('admin/news_edit', { stats, isNew: false, newsItem });
});

app.post('/admin/news/edit/:id', requireAdmin, upload.single('image_file'), (req, res) => {
  let { title, slug, category, excerpt, content, image, source_name, author, is_hot_24h, meta_title, meta_description } = req.body;
  const newsId = req.params.id;

  if (req.file) {
    image = '/uploads/' + req.file.filename;
  }

  db.prepare(`
    UPDATE news 
    SET category = ?, slug = ?, title = ?, excerpt = ?, content = ?, image = ?,
        source_name = ?, author = ?, is_hot_24h = ?, meta_title = ?, meta_description = ?
    WHERE id = ?
  `).run(
    category, transliterate(slug), title, excerpt, content, image,
    source_name, author, is_hot_24h ? 1 : 0,
    meta_title, meta_description, newsId
  );

  res.redirect('/admin/news');
});

app.post('/admin/news/delete/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  res.redirect('/admin/news');
});

// Trigger News Aggregation API
app.post('/admin/api/trigger-news-update', requireAdmin, (req, res) => {
  try {
    const info = runNewsAggregation(db);
    res.json({ success: true, info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Admin Global Blocks Management ---

app.get('/admin/global-blocks', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const blocks = getGlobalSettings();
  res.render('admin/global_blocks', { stats, blocks, successMsg: req.query.saved ? 'Изменения успешно сохранены!' : null });
});

app.post('/admin/global-blocks', requireAdmin, (req, res) => {
  const {
    site_name, slogan, ticker_text, social_tg, social_vk,
    footer_about, footer_copyright, footer_disclaimer,
    newsletter_title, newsletter_subtitle, newsletter_btn,
    cookie_text, cookie_btn_accept
  } = req.body;

  const currentSettings = getGlobalSettings();

  currentSettings.header.site_name = site_name || currentSettings.header.site_name;
  currentSettings.header.slogan = slogan || currentSettings.header.slogan;
  currentSettings.header.ticker_text = ticker_text || currentSettings.header.ticker_text;
  currentSettings.header.social_tg = social_tg || currentSettings.header.social_tg;
  currentSettings.header.social_vk = social_vk || currentSettings.header.social_vk;

  currentSettings.footer.about_text = footer_about || currentSettings.footer.about_text;
  currentSettings.footer.copyright = footer_copyright || currentSettings.footer.copyright;
  currentSettings.footer.disclaimer = footer_disclaimer || currentSettings.footer.disclaimer;

  currentSettings.newsletter_cta.title = newsletter_title || currentSettings.newsletter_cta.title;
  currentSettings.newsletter_cta.subtitle = newsletter_subtitle || currentSettings.newsletter_cta.subtitle;
  currentSettings.newsletter_cta.btn_text = newsletter_btn || currentSettings.newsletter_cta.btn_text;

  currentSettings.cookie_banner.text = cookie_text || currentSettings.cookie_banner.text;
  currentSettings.cookie_banner.btn_accept = cookie_btn_accept || currentSettings.cookie_banner.btn_accept;

  const updateStmt = db.prepare(`
    INSERT INTO global_blocks (key, value_json)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
  `);

  for (const [key, val] of Object.entries(currentSettings)) {
    updateStmt.run(key, JSON.stringify(val));
  }

  res.redirect('/admin/global-blocks?saved=1');
});

// --- Admin Form Submissions Log ---

app.get('/admin/submissions', requireAdmin, (req, res) => {
  const stats = getAdminStats();
  const submissions = db.prepare('SELECT * FROM form_submissions ORDER BY created_at DESC').all();
  res.render('admin/submissions', { stats, submissions });
});

// ==========================================================================
// 11. DYNAMIC USER PAGES ROUTE (Catch-all for custom pages created in admin)
// ==========================================================================

app.get('/:slug', (req, res, next) => {
  const slug = req.params.slug;
  const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);

  if (!page) {
    return next(); // Pass to 404 handler
  }

  const breadcrumbs = [
    { title: page.title, url: `/${page.slug}` }
  ];

  res.render('pages/custom_page', {
    page,
    breadcrumbs
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('pages/custom_page', {
    page: {
      title: 'Страница не найдена (404)',
      meta_title: '404 — Страница не найдена | Чемпион-Теннис',
      meta_description: 'Запрашиваемая страница не существует или была перемещена.',
      content: `
        <h2>Ошибка 404</h2>
        <p>К сожалению, запрашиваемая вами страница не найдена.</p>
        <p><a href="/" class="btn-read-more" style="display:inline-block; padding:10px 20px; background:#0a5c36; color:#ffffff; border-radius:6px; font-weight:700;">Вернуться на главную страницу &rarr;</a></p>
      `,
      updated_at: '2026'
    },
    breadcrumbs: [{ title: '404 Ошибка', url: '#' }]
  });
});

// Background News Updater (runs every 24h at 8:00 MSK or startup)
function scheduleDailyNewsCheck() {
  setInterval(() => {
    const now = new Date();
    // Get Moscow hour (UTC+3)
    const mskHour = (now.getUTCHours() + 3) % 24;
    const mskMinute = now.getUTCMinutes();
    
    // Check around 8:00 MSK
    if (mskHour === 8 && mskMinute === 0) {
      console.log('[CRON 8:00 MSK] Running automatic tennis news aggregation...');
      runNewsAggregation(db);
    }
  }, 60 * 1000);
}

scheduleDailyNewsCheck();

// Start Server on 0.0.0.0 for live preview
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🎾 Чемпион-Теннис (Champion-Tennis.ru) запущен!`);
  console.log(`🌐 Сервер слушает на http://0.0.0.0:${PORT}`);
  console.log(`🔑 Админ-панель: http://0.0.0.0:${PORT}/admin`);
  console.log(`👤 Логин: admin | Пароль: champion2026tennis`);
  console.log(`📧 Почтовые уведомления маршрутизируются на: sonicsquad@mail.ru`);
  console.log(`=======================================================`);
});
