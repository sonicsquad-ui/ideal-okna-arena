/**
 * ORIENTIRPROF.RU — Генератор интерфейса административной панели
 */

const fs = require('fs');
const path = require('path');
const { getSettings, getPages, getBlog, getCases, getIcon } = require('./renderer');

function getLeads() {
  const file = path.join(__dirname, '..', 'data', 'leads.json');
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function getRobotsTxt() {
  const file = path.join(__dirname, '..', 'public', 'robots.txt');
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8');
  }
  return 'User-agent: *\nAllow: /\nDisallow: /admin/\n';
}

function renderAdminLogin(error = '') {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход в панель управления | orientirprof.ru</title>
  <link rel="icon" type="image/svg+xml" href="/images/logo-compass.svg">
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
  <div class="admin-login-wrap">
    <div class="admin-login-box">
      <img class="admin-login-logo" src="/images/logo-compass.svg" alt="ОриентирПроф">
      <h1 class="admin-login-title">Вход в панель управления</h1>
      <p class="admin-login-sub">Сайт профориентолога Марины Бондаревой</p>

      ${error ? `<div style="background:#fee2e2;color:#991b1b;padding:12px;border-radius:8px;font-size:0.88rem;margin-bottom:18px;">${error}</div>` : ''}

      <form method="POST" action="/admin/login">
        <div style="margin-bottom:16px;text-align:left;">
          <label class="form-label">Логин администратора</label>
          <input class="form-control" type="text" name="username" required autofocus placeholder="admin">
        </div>
        <div style="margin-bottom:24px;text-align:left;">
          <label class="form-label">Пароль</label>
          <input class="form-control" type="password" name="password" required placeholder="••••••••">
        </div>
        <button class="form-control" type="submit" style="background:#2563eb;color:#fff;font-weight:700;cursor:pointer;padding:12px;border:none;">
          Войти в панель
        </button>
      </form>
      <div style="margin-top:20px;">
        <a href="/" style="font-size:0.84rem;color:#64748b;text-decoration:none;">← Вернуться на сайт</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderAdminDashboard() {
  const settings = getSettings();
  const pages = getPages();
  const blog = getBlog();
  const cases = getCases();
  const leads = getLeads();
  const robotsTxt = getRobotsTxt();

  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const pageKeys = Object.keys(pages);

  // Leads table rows
  const leadsRowsHtml = leads.slice().reverse().map((lead, idx) => `
    <tr>
      <td>${lead.date || new Date().toLocaleString('ru-RU')}</td>
      <td><strong>${lead.name || 'Без имени'}</strong></td>
      <td><a href="tel:${(lead.phone || '').replace(/\D/g, '')}">${lead.phone || '—'}</a></td>
      <td>${lead.service || lead.formType || 'Заявка'}</td>
      <td style="max-width:280px;font-size:0.84rem;">${lead.message || lead.testSummary || '—'}</td>
      <td>
        <span class="status-badge ${lead.status === 'done' ? 'status-done' : 'status-new'}">
          ${lead.status === 'done' ? 'Обработана' : 'Новая'}
        </span>
      </td>
      <td>
        <button class="admin-lead-status-btn" data-lead-id="${lead.id || idx}" style="background:#f1f5f9;border:1px solid #cbd5e1;padding:4px 8px;border-radius:4px;font-size:0.78rem;cursor:pointer;">
          ${lead.status === 'done' ? 'В новые' : 'Завершить'}
        </button>
      </td>
    </tr>
  `).join('');

  // Page select options
  const pageOptionsHtml = pageKeys.map(k => `
    <option value="${k}" ${k === 'home' ? 'selected' : ''}>${pages[k].title || k} (${pages[k].slug})</option>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Панель управления CMS | orientirprof.ru</title>
  <link rel="icon" type="image/svg+xml" href="/images/logo-compass.svg">
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
  <!-- Sidebar -->
  <aside class="admin-sidebar">
    <div class="admin-sidebar-brand">
      <img src="/images/logo-compass.svg" alt="ОриентирПроф" width="36" height="36">
      <div>
        <div style="font-weight:800;font-size:1.05rem;color:#fff;">ОриентирПроф</div>
        <div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;">Панель управления</div>
      </div>
    </div>

    <nav class="admin-sidebar-menu">
      <button class="admin-menu-item active" data-tab="tab-dashboard">
        ${getIcon('award')} Дашборд
      </button>
      <button class="admin-menu-item" data-tab="tab-pages">
        ${getIcon('compass')} Страницы сайта
      </button>
      <button class="admin-menu-item" data-tab="tab-header">
        ${getIcon('phone')} Шапка и меню
      </button>
      <button class="admin-menu-item" data-tab="tab-footer">
        ${getIcon('mail')} Футер и контакты
      </button>
      <button class="admin-menu-item" data-tab="tab-robots">
        ${getIcon('key')} robots.txt
      </button>
      <button class="admin-menu-item" data-tab="tab-schema">
        ${getIcon('star')} Schema.org
      </button>
      <button class="admin-menu-item" data-tab="tab-blog">
        ${getIcon('award')} Блог и статьи
      </button>
      <button class="admin-menu-item" data-tab="tab-cases">
        ${getIcon('star')} Кейсы клиентов
      </button>
      <button class="admin-menu-item" data-tab="tab-leads">
        ${getIcon('mail')} Заявки
        ${newLeadsCount > 0 ? `<span class="admin-badge-count">${newLeadsCount}</span>` : ''}
      </button>
      <button class="admin-menu-item" data-tab="tab-hosting" style="color:#38bdf8;">
        📦 Экспорт для хостинга
      </button>
      <button class="admin-menu-item" data-tab="tab-password">
        🔑 Смена пароля
      </button>
    </nav>

    <div class="admin-sidebar-footer">
      <a href="/" target="_blank" style="font-size:0.84rem;color:#94a3b8;text-decoration:none;">
        На сайт ↗
      </a>
      <a href="/admin/logout" style="font-size:0.84rem;color:#ef4444;text-decoration:none;">
        Выйти
      </a>
    </div>
  </aside>

  <!-- Main View -->
  <div class="admin-main">
    <div class="admin-topbar">
      <h2 class="admin-topbar-title" id="adminPageHeaderTitle">Дашборд</h2>
      <div class="admin-topbar-actions">
        <a class="form-control" href="/" target="_blank" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-weight:600;padding:8px 16px;background:#f8fafc;">
          Открыть сайт ↗
        </a>
        <a class="form-control" href="/api/admin/download-zip" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-weight:700;padding:8px 16px;background:#2563eb;color:#fff;">
          📦 Скачать ZIP для хостинга
        </a>
      </div>
    </div>

    <div class="admin-content-area">
      <!-- 1. DASHBOARD TAB -->
      <div class="admin-tab-pane active" id="tab-dashboard">
        <div class="admin-grid-3" style="margin-bottom:28px;">
          <div class="admin-stat-card">
            <div class="admin-stat-icon">${getIcon('compass')}</div>
            <div>
              <div class="admin-stat-val">${pageKeys.length}</div>
              <div class="admin-stat-label">Страниц сайта</div>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-icon">${getIcon('award')}</div>
            <div>
              <div class="admin-stat-val">${blog.length}</div>
              <div class="admin-stat-label">Статей в блоге</div>
            </div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-icon">${getIcon('mail')}</div>
            <div>
              <div class="admin-stat-val">${leads.length}</div>
              <div class="admin-stat-label">Всего заявок с форм (${newLeadsCount} новых)</div>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Быстрые действия</h3>
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;">
            <button class="form-control" style="width:auto;background:#2563eb;color:#fff;font-weight:600;cursor:pointer;padding:10px 18px;" onclick="document.querySelector('[data-tab=\\'tab-pages\\']').click()">
              Редактировать страницы сайта
            </button>
            <button class="form-control" style="width:auto;background:#0d9488;color:#fff;font-weight:600;cursor:pointer;padding:10px 18px;" onclick="document.querySelector('[data-tab=\\'tab-hosting\\']').click()">
              Инструкция по развертыванию на хостинге
            </button>
            <button class="form-control" id="adminRebuildStaticBtn" style="width:auto;background:#f1f5f9;border:1px solid #cbd5e1;font-weight:600;cursor:pointer;padding:10px 18px;">
              🔄 Пересобрать статические HTML страницы
            </button>
          </div>
        </div>

        <!-- Latest Leads -->
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Последние входящие заявки</h3>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Тип / Услуга</th>
                  <th>Сообщение</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                ${leadsRowsHtml || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8;">Пока нет заявок. Отправьте тестовую форму на сайте!</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 2. PAGES TAB -->
      <div class="admin-tab-pane" id="tab-pages">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Визуальный редактор страниц</h3>
            <button class="form-control" type="button" style="width:auto;background:#16a34a;color:#fff;font-weight:600;cursor:pointer;padding:8px 14px;" onclick="document.getElementById('adminCreatePageCard').style.display = 'block'">
              + Создать новую страницу
            </button>
          </div>

          <div style="margin-bottom:20px;">
            <label class="form-label">Выберите страницу для редактирования:</label>
            <select class="form-control" id="adminPageSelect">
              ${pageOptionsHtml}
            </select>
          </div>

          <!-- Edit Page Form -->
          <form id="adminPageEditForm">
            <input type="hidden" name="pageKey" value="home">

            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Title страницы (Тег &lt;title&gt;) *</label>
                <input class="form-control" type="text" name="title" required value="${pages.home.title || ''}">
                <div class="form-help">Отображается во вкладке браузера и в выдаче Яндекса/Google</div>
              </div>

              <div style="margin-bottom:16px;">
                <label class="form-label">URL Slug (путь) *</label>
                <input class="form-control" type="text" name="slug" required value="${pages.home.slug || '/'}" readonly style="background:#f1f5f9;">
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label class="form-label">Meta Description (краткое описание для поисковиков) *</label>
              <textarea class="form-control" name="description" rows="2">${pages.home.description || ''}</textarea>
            </div>

            <div style="margin-bottom:16px;">
              <label class="form-label">Meta Keywords (ключевые слова через запятую)</label>
              <input class="form-control" type="text" name="keywords" value="${pages.home.keywords || ''}">
            </div>

            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Главный заголовок H1</label>
                <input class="form-control" type="text" name="h1" value="${pages.home.h1 || ''}">
              </div>

              <div style="margin-bottom:16px;">
                <label class="form-label">Подзаголовок / дескриптор</label>
                <input class="form-control" type="text" name="subtitle" value="${pages.home.heroSubtitle || ''}">
              </div>
            </div>

            <div style="margin-bottom:24px;">
              <label class="form-label">Основной текст / Контент страницы (HTML или текст)</label>
              <textarea class="form-control" name="content" rows="6" placeholder="Контент страницы...">${pages.home.content || ''}</textarea>
              <div class="form-help">Для системных страниц структура блоков настроена автоматически. Для созданных страниц здесь задается полный текст.</div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;">
              <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:12px 28px;cursor:pointer;">
                💾 Сохранить изменения страницы
              </button>
              <button class="form-control" type="button" id="adminDeletePageBtn" style="width:auto;background:#fee2e2;color:#991b1b;border-color:#fca5a5;display:none;cursor:pointer;">
                Удалить эту страницу
              </button>
            </div>
          </form>
        </div>

        <!-- Create Page Form (Collapsible) -->
        <div class="admin-card" id="adminCreatePageCard" style="display:none;background:#f0fdf4;border-color:#bbf7d0;">
          <div class="admin-card-header">
            <h3 class="admin-card-title" style="color:#166534;">Создание новой страницы сайта</h3>
            <button type="button" onclick="document.getElementById('adminCreatePageCard').style.display = 'none'" style="cursor:pointer;border:none;background:none;font-weight:700;color:#166534;">✕ Закрыть</button>
          </div>
          <form id="adminCreatePageForm">
            <div class="admin-grid-2">
              <div style="margin-bottom:14px;">
                <label class="form-label">URL Slug (например, /onlayn-kursy/) *</label>
                <input class="form-control" type="text" name="slug" required placeholder="/novaya-stranica/">
              </div>
              <div style="margin-bottom:14px;">
                <label class="form-label">Название страницы в меню *</label>
                <input class="form-control" type="text" name="menuTitle" required placeholder="Онлайн-курсы">
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label">Title (Заголовок во вкладке браузера) *</label>
              <input class="form-control" type="text" name="title" required placeholder="Курсы профориентации в Орле | Марина Бондарева">
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label">Meta Description</label>
              <input class="form-control" type="text" name="description" placeholder="Краткое описание страницы...">
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label">Главный заголовок H1</label>
              <input class="form-control" type="text" name="h1" placeholder="Заголовок H1 на странице">
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label">Контент страницы (текст, параграфы, списки)</label>
              <textarea class="form-control" name="content" rows="6" placeholder="<p>Текст новой страницы...</p>"></textarea>
            </div>

            <label style="display:flex;align-items:center;gap:8px;font-size:0.88rem;margin-bottom:18px;cursor:pointer;">
              <input type="checkbox" name="addToMenu" value="yes" checked>
              <span>Автоматически добавить пункт в навигационное меню сайта</span>
            </label>

            <button class="form-control" type="submit" style="width:auto;background:#16a34a;color:#fff;font-weight:700;padding:10px 24px;cursor:pointer;">
              ✓ Создать и опубликовать страницу
            </button>
          </form>
        </div>
      </div>

      <!-- 3. HEADER & MENU TAB -->
      <div class="admin-tab-pane" id="tab-header">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Настройки сквозного блока: Шапка сайта</h3>
          </div>
          <form id="adminHeaderForm">
            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Основной телефон (кликабельный) *</label>
                <input class="form-control" type="text" name="phone" required value="${settings.contacts.phone}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Второй телефон</label>
                <input class="form-control" type="text" name="phoneSecondary" value="${settings.contacts.phoneSecondary || ''}">
              </div>
            </div>

            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Режим работы *</label>
                <input class="form-control" type="text" name="workHours" required value="${settings.contacts.workHours}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Адрес *</label>
                <input class="form-control" type="text" name="address" required value="${settings.contacts.address}">
              </div>
            </div>

            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Текст кнопки в шапке</label>
                <input class="form-control" type="text" name="ctaButtonText" value="${settings.header.ctaButtonText || 'Заказать звонок'}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Электронная почта (Email) *</label>
                <input class="form-control" type="email" name="email" required value="${settings.contacts.email}">
              </div>
            </div>

            <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:12px 28px;cursor:pointer;">
              💾 Сохранить настройки шапки
            </button>
          </form>
        </div>
      </div>

      <!-- 4. FOOTER TAB -->
      <div class="admin-tab-pane" id="tab-footer">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Настройки сквозного блока: Футер сайта</h3>
          </div>
          <form id="adminFooterForm">
            <div style="margin-bottom:16px;">
              <label class="form-label">Краткое описание в футере</label>
              <textarea class="form-control" name="aboutText" rows="3">${settings.footer.aboutText}</textarea>
            </div>

            <div class="admin-grid-3">
              <div style="margin-bottom:16px;">
                <label class="form-label">Ссылка WhatsApp</label>
                <input class="form-control" type="text" name="whatsapp" value="${settings.contacts.whatsapp}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Ссылка Telegram</label>
                <input class="form-control" type="text" name="telegram" value="${settings.contacts.telegram}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Ссылка ВКонтакте</label>
                <input class="form-control" type="text" name="vk" value="${settings.contacts.vk}">
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label class="form-label">Текст копирайта ({YEAR} заменяется автоматически)</label>
              <input class="form-control" type="text" name="copyrightText" value="${settings.footer.copyrightText}">
            </div>

            <div style="margin-bottom:24px;">
              <label class="form-label">Текст баннера Cookies</label>
              <textarea class="form-control" name="cookieText" rows="2">${settings.cookieNotice.text}</textarea>
            </div>

            <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:12px 28px;cursor:pointer;">
              💾 Сохранить настройки футера
            </button>
          </form>
        </div>
      </div>

      <!-- 5. ROBOTS.TXT TAB -->
      <div class="admin-tab-pane" id="tab-robots">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Редактор файла robots.txt</h3>
          </div>
          <p style="color:#64748b;font-size:0.88rem;margin-bottom:16px;">
            Файл robots.txt управляет индексацией сайта поисковыми роботами (Яндекс, Google, Mail.ru). После сохранения файл сразу доступен по адресу: <code>https://orientirprof.ru/robots.txt</code>.
          </p>
          <form id="adminRobotsForm">
            <div style="margin-bottom:20px;">
              <textarea class="form-control" name="robotsContent" rows="12" style="font-family:monospace;font-size:0.92rem;line-height:1.5;">${robotsTxt}</textarea>
            </div>
            <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:12px 28px;cursor:pointer;">
              💾 Сохранить файл robots.txt
            </button>
          </form>
        </div>
      </div>

      <!-- 6. SCHEMA.ORG TAB -->
      <div class="admin-tab-pane" id="tab-schema">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Микроразметка Schema.org (JSON-LD)</h3>
          </div>
          <p style="color:#64748b;font-size:0.88rem;margin-bottom:16px;">
            Структурированные данные помогают сайту получать расширенные сниппеты в поисковой выдаче Яндекса и Google с адресом, телефоном и отзывами.
          </p>
          <form id="adminSchemaForm">
            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Название организации / бренда</label>
                <input class="form-control" type="text" name="orgName" value="${settings.schema.orgName}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Имя специалиста</label>
                <input class="form-control" type="text" name="specialistName" value="${settings.schema.specialistName}">
              </div>
            </div>

            <div class="admin-grid-2">
              <div style="margin-bottom:16px;">
                <label class="form-label">Должность / Квалификация</label>
                <input class="form-control" type="text" name="jobTitle" value="${settings.schema.jobTitle}">
              </div>
              <div style="margin-bottom:16px;">
                <label class="form-label">Ценовой диапазон (PriceRange)</label>
                <input class="form-control" type="text" name="priceRange" value="${settings.schema.priceRange}">
              </div>
            </div>

            <div class="admin-grid-2">
              <div style="margin-bottom:20px;">
                <label class="form-label">Широта (Latitude)</label>
                <input class="form-control" type="text" name="latitude" value="${settings.schema.geo.latitude}">
              </div>
              <div style="margin-bottom:20px;">
                <label class="form-label">Долгота (Longitude)</label>
                <input class="form-control" type="text" name="longitude" value="${settings.schema.geo.longitude}">
              </div>
            </div>

            <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:12px 28px;cursor:pointer;">
              💾 Сохранить настройки микроразметки
            </button>
          </form>
        </div>
      </div>

      <!-- 7. BLOG TAB -->
      <div class="admin-tab-pane" id="tab-blog">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Управление блогом и статьями</h3>
            <button class="form-control" type="button" style="width:auto;background:#16a34a;color:#fff;font-weight:600;cursor:pointer;padding:8px 14px;" onclick="document.getElementById('adminAddBlogCard').style.display='block'">
              + Написать новую статью
            </button>
          </div>

          <!-- Add / Edit article form -->
          <div id="adminAddBlogCard" style="display:none;background:#f8fafc;padding:20px;border-radius:10px;margin-bottom:24px;border:1px solid #cbd5e1;">
            <h4 style="margin:0 0 14px;font-size:1.1rem;">Новая статья блога</h4>
            <form id="adminBlogForm">
              <div class="admin-grid-2">
                <div style="margin-bottom:12px;">
                  <label class="form-label">Заголовок статьи *</label>
                  <input class="form-control" type="text" name="title" required placeholder="Например: Как выбрать профессию...">
                </div>
                <div style="margin-bottom:12px;">
                  <label class="form-label">URL Slug (латиницей) *</label>
                  <input class="form-control" type="text" name="slug" required placeholder="kak-vybrat-professiyu">
                </div>
              </div>

              <div class="admin-grid-3">
                <div style="margin-bottom:12px;">
                  <label class="form-label">Категория</label>
                  <input class="form-control" type="text" name="category" placeholder="Подросткам / Взрослым">
                </div>
                <div style="margin-bottom:12px;">
                  <label class="form-label">Время чтения</label>
                  <input class="form-control" type="text" name="readTime" placeholder="6 мин">
                </div>
                <div style="margin-bottom:12px;">
                  <label class="form-label">URL обложки</label>
                  <input class="form-control" type="text" name="image" value="/images/career-consulting.jpg">
                </div>
              </div>

              <div style="margin-bottom:12px;">
                <label class="form-label">Краткий анонс (excerpt)</label>
                <textarea class="form-control" name="excerpt" rows="2" placeholder="Краткое описание..."></textarea>
              </div>

              <div style="margin-bottom:16px;">
                <label class="form-label">Текст статьи (HTML поддерживается)</label>
                <textarea class="form-control" name="content" rows="8" placeholder="<p>Текст статьи...</p>"></textarea>
              </div>

              <div style="display:flex;gap:12px;">
                <button class="form-control" type="submit" style="width:auto;background:#16a34a;color:#fff;font-weight:700;padding:10px 24px;cursor:pointer;">
                  ✓ Опубликовать статью
                </button>
                <button type="button" class="form-control" style="width:auto;cursor:pointer;" onclick="document.getElementById('adminAddBlogCard').style.display='none'">
                  Отмена
                </button>
              </div>
            </form>
          </div>

          <!-- Existing Articles Table -->
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Заголовок</th>
                  <th>Категория</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                ${blog.map(b => `
                  <tr>
                    <td>${b.id}</td>
                    <td><strong>${b.title}</strong></td>
                    <td>${b.category}</td>
                    <td>${b.date}</td>
                    <td>
                      <a href="/blog/${b.slug}/" target="_blank" style="color:#2563eb;margin-right:10px;text-decoration:none;font-weight:600;">Просмотр ↗</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 8. CASES TAB -->
      <div class="admin-tab-pane" id="tab-cases">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Кейсы клиентов</h3>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Категория</th>
                  <th>Заголовок</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                ${cases.map(c => `
                  <tr>
                    <td><strong>${c.client}</strong></td>
                    <td>${c.categoryLabel}</td>
                    <td>${c.title}</td>
                    <td style="max-width:300px;font-size:0.84rem;">${c.result}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 9. LEADS TAB -->
      <div class="admin-tab-pane" id="tab-leads">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Все входящие заявки (${leads.length})</h3>
            <a href="/api/admin/export-leads-csv" class="form-control" style="width:auto;text-decoration:none;padding:8px 14px;background:#f8fafc;">
              Экспорт в CSV
            </a>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Услуга / Источник</th>
                  <th>Сообщение / Данные</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                ${leadsRowsHtml || '<tr><td colspan="7" style="text-align:center;padding:24px;">Нет заявок</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 10. HOSTING EXPORT TAB -->
      <div class="admin-tab-pane" id="tab-hosting">
        <div class="admin-card">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Развертывание сайта на простом хостинге (без VPS)</h3>
          </div>
          
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="font-size:1.25rem;font-weight:800;color:#1e3a8a;margin-bottom:10px;">
              📦 Готовый архив для простого хостинга
            </div>
            <p style="color:#334155;line-height:1.6;margin-bottom:18px;">
              Сайт полностью подготовлен для моментального развертывания на любом стандартном российском хостинге (Beget, TimeWeb, Reg.ru, Spaceweb, cPanel и др.) с поддержкой PHP 7.4 / 8.x. Никакого VPS, Docker или командной строки не требуется!
            </p>
            <a class="btn btn-primary btn-lg" href="/api/admin/download-zip" style="text-decoration:none;display:inline-flex;">
              📦 Скачать полный ZIP-архив сайта для хостинга
            </a>
          </div>

          <h4 style="font-size:1.2rem;font-weight:800;color:#0f172a;margin-bottom:16px;">
            Пошаговая инструкция по запуску сайта на хостинге:
          </h4>
          <ol style="display:flex;flex-direction:column;gap:16px;padding-left:20px;line-height:1.6;color:#334155;font-size:0.95rem;">
            <li>
              <strong>Шаг 1. Скачайте ZIP-архив</strong> по синей кнопке выше.
            </li>
            <li>
              <strong>Шаг 2. Войдите в панель управления вашего хостинга</strong> (например, Beget, TimeWeb или Reg.ru).
            </li>
            <li>
              <strong>Шаг 3. Откройте «Файловый менеджер»</strong> и перейдите в корневую директорию сайта (обычно называется <code>public_html</code> или <code>orientirprof.ru/public_html</code>).
            </li>
            <li>
              <strong>Шаг 4. Загрузите скачанный ZIP-архив и нажмите «Распаковать»</strong>. Все файлы сайта, стили, картинки и скрипты займут свои места.
            </li>
            <li>
              <strong>Шаг 5. Привязка домена https://orientirprof.ru/:</strong> В настройках домена на хостинге убедитесь, что домен прикреплен к этой папке. В панели регистратора домена укажите DNS-серверы вашего хостинга (или А-запись).
            </li>
            <li>
              <strong>Шаг 6. Отправка заявок:</strong> В архив встроен готовый скрипт <code>send.php</code>, который сразу отправляет все заявки на ваш email <code>sunvard@yandex.ru</code> и дублирует их в локальную базу данных заявок!
            </li>
            <li>
              <strong>Шаг 7. Панель управления на хостинге:</strong> Доступна по адресу <code>https://orientirprof.ru/admin/</code> с тем же логином и паролем.
            </li>
          </ol>
        </div>
      </div>

      <!-- 11. CHANGE PASSWORD TAB -->
      <div class="admin-tab-pane" id="tab-password">
        <div class="admin-card" style="max-width:500px;">
          <div class="admin-card-header">
            <h3 class="admin-card-title">Смена пароля администратора</h3>
          </div>
          <form id="adminPwdForm">
            <div style="margin-bottom:16px;">
              <label class="form-label">Новый пароль *</label>
              <input class="form-control" type="password" name="newPassword" required placeholder="Введите новый надежный пароль">
            </div>
            <div style="margin-bottom:20px;">
              <label class="form-label">Повторите новый пароль *</label>
              <input class="form-control" type="password" name="confirmPassword" required placeholder="Повторите пароль">
            </div>
            <button class="form-control" type="submit" style="background:#2563eb;color:#fff;font-weight:700;cursor:pointer;padding:10px 20px;">
              Обновить пароль
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <script src="/js/admin.js"></script>
</body>
</html>`;
}

module.exports = {
  renderAdminLogin,
  renderAdminDashboard
};
