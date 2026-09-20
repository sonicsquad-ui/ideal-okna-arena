/**
 * ORIENTIRPROF.RU — Сервер разработки и предпросмотра
 * Персональный сайт профориентолога Марины Бондаревой
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { buildPageBySlug } = require('./lib/pageBuilder');
const { getSettings, getPages, getBlog, getCases } = require('./lib/renderer');
const { renderAdminLogin, renderAdminDashboard } = require('./lib/adminRenderer');
const { exportSite } = require('./export');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser('orientir_cookie_secret_2026'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Helper to check admin authentication
function isAdminAuth(req) {
  const token = req.cookies.orientir_admin_session;
  return token === 'authenticated_admin_2026';
}

// -------------------------------------------------------------
// CLIENT API: Form submission & Lead Capture
// -------------------------------------------------------------
app.post(['/api/send', '/api/send.php'], (req, res) => {
  const data = req.body || {};
  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();
  const service = (data.service || data.formType || 'Заявка с сайта').trim();
  const message = (data.message || '').trim();
  const audience = (data.audience || '').trim();
  const testSummary = (data.testSummary || '').trim();

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      error: 'Пожалуйста, заполните обязательные поля: имя и номер телефона.'
    });
  }

  // Save to data/leads.json
  const leadsFile = path.join(__dirname, 'data', 'leads.json');
  let leads = [];
  if (fs.existsSync(leadsFile)) {
    try {
      leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
    } catch (e) {
      leads = [];
    }
  }

  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newLead = {
    id: Date.now().toString(),
    date: formattedDate,
    name,
    phone,
    service,
    message,
    audience,
    testSummary,
    status: 'new'
  };

  leads.push(newLead);
  fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), 'utf8');

  console.log(`[LEAD] Получена новая заявка: ${name} (${phone}) -> ${service}`);

  return res.json({
    success: true,
    message: 'Спасибо! Ваша заявка успешно отправлена. Марина Бондарева свяжется с вами в ближайшее время.'
  });
});

// -------------------------------------------------------------
// ADMIN PANEL ROUTES
// -------------------------------------------------------------
app.get('/admin', (req, res) => {
  if (isAdminAuth(req)) {
    return res.send(renderAdminDashboard());
  }
  return res.send(renderAdminLogin());
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const usersFile = path.join(__dirname, 'data', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

  if (users[username]) {
    const user = users[username];
    const salt = user.salt || 'orientir_salt_2026';
    const hash = crypto.createHash('sha256').update(password + salt).digest('hex');

    if (hash === user.passwordHash) {
      res.cookie('orientir_admin_session', 'authenticated_admin_2026', {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      return res.redirect('/admin');
    }
  }

  return res.send(renderAdminLogin('Неверный логин или пароль администратора. Проверьте правильность ввода.'));
});

app.get('/admin/logout', (req, res) => {
  res.clearCookie('orientir_admin_session');
  res.redirect('/admin');
});

// Admin API: get page data
app.get('/api/admin/get-page', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const key = req.query.key;
  const pages = getPages();
  if (pages[key]) {
    return res.json({ success: true, page: pages[key] });
  }
  return res.status(404).json({ error: 'Page not found' });
});

// Admin API: save page
app.post('/api/admin/save-page', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { pageKey, title, description, keywords, h1, subtitle, content } = req.body;
  const pagesFile = path.join(__dirname, 'data', 'pages.json');
  const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));

  if (!pages[pageKey]) {
    return res.status(404).json({ error: 'Страница не найдена' });
  }

  pages[pageKey].title = title || pages[pageKey].title;
  pages[pageKey].description = description || pages[pageKey].description;
  pages[pageKey].keywords = keywords !== undefined ? keywords : pages[pageKey].keywords;
  pages[pageKey].h1 = h1 || pages[pageKey].h1;
  if (pages[pageKey].heroSubtitle !== undefined) {
    pages[pageKey].heroSubtitle = subtitle;
  } else {
    pages[pageKey].subtitle = subtitle;
  }
  if (content !== undefined) {
    pages[pageKey].content = content;
  }

  fs.writeFileSync(pagesFile, JSON.stringify(pages, null, 2), 'utf8');

  // Async rebuild static files
  exportSite().catch(console.error);

  return res.json({ success: true, message: 'Страница успешно обновлена' });
});

// Admin API: create new page
app.post('/api/admin/create-page', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  let { slug, menuTitle, title, description, h1, content, addToMenu } = req.body;

  if (!slug || !title) {
    return res.status(400).json({ error: 'Укажите URL slug и Title страницы' });
  }

  if (!slug.startsWith('/')) slug = '/' + slug;
  if (!slug.endsWith('/')) slug = slug + '/';

  const key = slug.replace(/\//g, '-').replace(/^-|-$/g, '') || 'page-' + Date.now();
  const pagesFile = path.join(__dirname, 'data', 'pages.json');
  const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));

  pages[key] = {
    slug,
    title,
    description: description || '',
    keywords: '',
    ogImage: '/images/marina-bondareva-hero.jpg',
    h1: h1 || title,
    subtitle: '',
    content: content || '<p>Текст новой страницы.</p>',
    breadcrumbs: [
      { title: 'Главная', url: '/' },
      { title: menuTitle || title, url: slug }
    ]
  };

  fs.writeFileSync(pagesFile, JSON.stringify(pages, null, 2), 'utf8');

  // Optionally add to menu
  if (addToMenu === 'yes') {
    const settingsFile = path.join(__dirname, 'data', 'settings.json');
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    settings.header.menu.push({
      title: menuTitle || title,
      url: slug
    });
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
  }

  exportSite().catch(console.error);

  return res.json({ success: true, message: 'Страница создана' });
});

// Admin API: delete custom page
app.post('/api/admin/delete-page', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { pageKey } = req.body;
  const pagesFile = path.join(__dirname, 'data', 'pages.json');
  const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));

  if (pages[pageKey]) {
    delete pages[pageKey];
    fs.writeFileSync(pagesFile, JSON.stringify(pages, null, 2), 'utf8');
    exportSite().catch(console.error);
    return res.json({ success: true, message: 'Страница удалена' });
  }

  return res.status(404).json({ error: 'Страница не найдена' });
});

// Admin API: save header
app.post('/api/admin/save-header', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const settingsFile = path.join(__dirname, 'data', 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

  settings.contacts.phone = req.body.phone || settings.contacts.phone;
  settings.contacts.phoneRaw = (req.body.phone || '').replace(/\D/g, '') ? '+' + (req.body.phone || '').replace(/\D/g, '') : settings.contacts.phoneRaw;
  settings.contacts.phoneSecondary = req.body.phoneSecondary || settings.contacts.phoneSecondary;
  settings.contacts.workHours = req.body.workHours || settings.contacts.workHours;
  settings.contacts.address = req.body.address || settings.contacts.address;
  settings.contacts.email = req.body.email || settings.contacts.email;
  settings.header.ctaButtonText = req.body.ctaButtonText || settings.header.ctaButtonText;

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
  exportSite().catch(console.error);

  return res.json({ success: true });
});

// Admin API: save footer
app.post('/api/admin/save-footer', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const settingsFile = path.join(__dirname, 'data', 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

  settings.footer.aboutText = req.body.aboutText || settings.footer.aboutText;
  settings.contacts.whatsapp = req.body.whatsapp || settings.contacts.whatsapp;
  settings.contacts.telegram = req.body.telegram || settings.contacts.telegram;
  settings.contacts.vk = req.body.vk || settings.contacts.vk;
  settings.footer.copyrightText = req.body.copyrightText || settings.footer.copyrightText;
  settings.cookieNotice.text = req.body.cookieText || settings.cookieNotice.text;

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
  exportSite().catch(console.error);

  return res.json({ success: true });
});

// Admin API: save robots.txt
app.post('/api/admin/save-robots', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const content = req.body.content || '';
  fs.writeFileSync(path.join(__dirname, 'public', 'robots.txt'), content, 'utf8');
  exportSite().catch(console.error);
  return res.json({ success: true });
});

// Admin API: save Schema.org microdata
app.post('/api/admin/save-schema', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const settingsFile = path.join(__dirname, 'data', 'settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));

  settings.schema.orgName = req.body.orgName || settings.schema.orgName;
  settings.schema.specialistName = req.body.specialistName || settings.schema.specialistName;
  settings.schema.jobTitle = req.body.jobTitle || settings.schema.jobTitle;
  settings.schema.priceRange = req.body.priceRange || settings.schema.priceRange;
  settings.schema.geo.latitude = parseFloat(req.body.latitude) || settings.schema.geo.latitude;
  settings.schema.geo.longitude = parseFloat(req.body.longitude) || settings.schema.geo.longitude;

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
  exportSite().catch(console.error);
  return res.json({ success: true });
});

// Admin API: save blog
app.post('/api/admin/save-blog', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const blogFile = path.join(__dirname, 'data', 'blog.json');
  const blog = JSON.parse(fs.readFileSync(blogFile, 'utf8'));

  const { title, slug, category, readTime, image, excerpt, content } = req.body;

  const newPost = {
    id: Date.now(),
    title,
    slug: slug.replace(/^\/|\/$/g, ''),
    date: new Date().toISOString().split('T')[0],
    category: category || 'Советы эксперта',
    readTime: readTime || '5 мин',
    image: image || '/images/career-consulting.jpg',
    excerpt: excerpt || '',
    content: content || ''
  };

  blog.unshift(newPost);
  fs.writeFileSync(blogFile, JSON.stringify(blog, null, 2), 'utf8');
  exportSite().catch(console.error);

  return res.json({ success: true });
});

// Admin API: save case
app.post('/api/admin/save-case', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const casesFile = path.join(__dirname, 'data', 'cases.json');
  const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));

  const { client, category, categoryLabel, title, request, process, solution, result, quote, author } = req.body;

  const newCase = {
    id: Date.now(),
    client,
    category: category || 'teens',
    categoryLabel: categoryLabel || 'Подростки',
    title,
    request,
    process,
    solution,
    result,
    quote,
    author: author || client
  };

  cases.unshift(newCase);
  fs.writeFileSync(casesFile, JSON.stringify(cases, null, 2), 'utf8');
  exportSite().catch(console.error);

  return res.json({ success: true });
});

// Admin API: toggle lead status
app.post('/api/admin/toggle-lead-status', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const leadsFile = path.join(__dirname, 'data', 'leads.json');
  const leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  const id = req.body.id;

  const lead = leads.find((l, idx) => l.id == id || idx == id);
  if (lead) {
    lead.status = lead.status === 'done' ? 'new' : 'done';
    fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), 'utf8');
    return res.json({ success: true });
  }

  return res.status(404).json({ error: 'Lead not found' });
});

// Admin API: export leads to CSV
app.get('/api/admin/export-leads-csv', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).send('Unauthorized');
  const leadsFile = path.join(__dirname, 'data', 'leads.json');
  const leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));

  let csv = '\uFEFFДата;Имя;Телефон;Услуга;Сообщение;Статус\r\n';
  leads.forEach(l => {
    const d = (l.date || '').replace(/;/g, ' ');
    const n = (l.name || '').replace(/;/g, ' ');
    const p = (l.phone || '').replace(/;/g, ' ');
    const s = (l.service || '').replace(/;/g, ' ');
    const m = (l.message || l.testSummary || '').replace(/;/g, ' ').replace(/\r|\n/g, ' ');
    const st = l.status === 'done' ? 'Обработана' : 'Новая';
    csv += `"${d}";"${n}";"${p}";"${s}";"${m}";"${st}"\r\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads-orientirprof.csv"');
  return res.send(csv);
});

// Admin API: download zip
app.get('/api/admin/download-zip', (req, res) => {
  const zipPath = path.join(__dirname, 'public', 'orientirprof-site.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="orientirprof-site.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).send('ZIP-архив еще генерируется. Пожалуйста, подождите несколько секунд и обновите.');
});

// Admin API: rebuild static
app.post('/api/admin/rebuild-static', async (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await exportSite();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin API: change password
app.post('/api/admin/change-password', (req, res) => {
  if (!isAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
  }

  const usersFile = path.join(__dirname, 'data', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

  const salt = 'orientir_salt_2026';
  const newHash = crypto.createHash('sha256').update(newPassword + salt).digest('hex');

  users.admin.passwordHash = newHash;
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');

  return res.json({ success: true, message: 'Пароль успешно обновлен' });
});

// -------------------------------------------------------------
// DYNAMIC PAGE ROUTING (All pages & articles)
// -------------------------------------------------------------
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  let reqPath = req.path;
  if (!reqPath.endsWith('/') && !path.extname(reqPath)) {
    reqPath += '/';
  }

  const html = buildPageBySlug(reqPath);
  if (html) {
    return res.send(html);
  }

  // Fallback 404
  return res.status(404).send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Страница не найдена — 404 | orientirprof.ru</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;">
    <div>
      <h1 style="font-size:4rem;font-weight:900;color:var(--color-primary);margin-bottom:12px;">404</h1>
      <h2 style="font-size:1.6rem;margin-bottom:16px;">Страница не найдена</h2>
      <p style="color:var(--color-slate-600);margin-bottom:28px;">Возможно, страница была перемещена или адрес введен с ошибкой.</p>
      <a class="btn btn-primary" href="/">На главную страницу</a>
    </div>
  </div>
</body>
</html>`);
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер orientirprof.ru успешно запущен на http://0.0.0.0:${PORT}`);
});
