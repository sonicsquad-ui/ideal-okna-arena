/**
 * ORIENTIRPROF.RU — Модуль рендеринга страниц
 * Генерирует валидный семантический HTML с микроразметкой Schema.org и OpenGraph
 */

const fs = require('fs');
const path = require('path');

function getSettings() {
  const file = path.join(__dirname, '..', 'data', 'settings.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getPages() {
  const file = path.join(__dirname, '..', 'data', 'pages.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getBlog() {
  const file = path.join(__dirname, '..', 'data', 'blog.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getCases() {
  const file = path.join(__dirname, '..', 'data', 'cases.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Generate SVG Icons
function getIcon(name) {
  const icons = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15s-.777.978-.953 1.179c-.175.2-.351.225-.652.075s-1.27-.468-2.42-1.494c-.895-.798-1.5-1.784-1.675-2.085-.175-.3-.019-.462.131-.612.136-.135.301-.351.451-.527.151-.175.2-.3.301-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.631-.927-2.233-.244-.587-.492-.507-.677-.517-.175-.008-.376-.01-.577-.01s-.527.075-.802.376c-.276.3-1.053 1.028-1.053 2.508 0 1.479 1.078 2.908 1.229 3.109.15.2 2.121 3.239 5.139 4.542.718.311 1.279.497 1.716.636.721.23 1.377.197 1.896.12.578-.087 1.78-.727 2.03-1.429.251-.702.251-1.304.176-1.43-.075-.125-.276-.201-.577-.351zM12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.32A10 10 0 1 0 12 2z"/></svg>',
    vk: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.162 18.994c.609 0 .858-.406.851-.915-.072-5.32 2.37-5.788 3.515-3.327.353.76.772 1.58 1.378 2.185 1.05 1.05 2.133 1.057 2.133 1.057h2.955c1.037 0 .54-.844.02-1.535-.785-1.042-2.317-2.653-2.376-3.23-.081-.787.683-1.597 1.545-2.736 1.407-1.859 2.146-3.245 2.146-3.245 0-.07-.058-.415-.415-.415h-3.48c-.287 0-.528.163-.64.444 0 0-.687 1.826-1.65 3.39-1.393 2.261-2.029 2.383-2.32 2.196-.684-.442-.516-1.774-.516-2.721 0-2.954.448-4.184-.875-4.502-.438-.105-.762-.174-1.884-.185-1.439-.015-2.656.006-3.344.344-.458.225-.811.727-.595.757.266.037.869.163 1.189.598.413.562.398 1.825.398 1.825s.237 3.479-.554 3.911c-.543.297-1.289-.308-2.891-3.41-.818-1.585-1.438-3.342-1.438-3.342-.083-.186-.231-.416-.549-.416H2.602c-.388 0-.465.18-.465.377 0 .351.45 2.088 2.095 4.394 2.744 3.847 5.869 5.868 8.93 5.868z"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5-3 3L11 7l-2 2L7 7l-5 5a5 5 0 0 0 7 7l5-5 2 2 3-3-1.5-1.5 1.5-1.5 2 2 3-3z"></path></svg>'
  };
  return icons[name] || '';
}

// Generate Topbar & Header HTML
function renderHeader(currentUrl, settings) {
  const currentYear = new Date().getFullYear();
  const menuItems = settings.header.menu.map(item => {
    const isDropdown = item.children && item.children.length > 0;
    const isActive = currentUrl === item.url || (item.url !== '/' && currentUrl.startsWith(item.url));

    if (isDropdown) {
      const subItemsHtml = item.children.map(sub => `
        <li><a class="dropdown-link ${currentUrl === sub.url ? 'active' : ''}" href="${sub.url}">${sub.title}</a></li>
      `).join('');

      return `
        <li class="nav-item nav-dropdown">
          <a class="nav-link ${isActive ? 'active' : ''}" href="${item.url}">
            <span>${item.title}</span>
            <span class="dropdown-arrow">${getIcon('chevronDown')}</span>
          </a>
          <ul class="dropdown-menu">
            ${subItemsHtml}
          </ul>
        </li>
      `;
    }

    return `
      <li class="nav-item">
        <a class="nav-link ${isActive ? 'active' : ''}" href="${item.url}">
          <span>${item.title}</span>
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </a>
      </li>
    `;
  }).join('');

  // Mobile drawer links
  const mobileMenuHtml = settings.header.menu.map(item => {
    const isDropdown = item.children && item.children.length > 0;
    const isActive = currentUrl === item.url || (item.url !== '/' && currentUrl.startsWith(item.url));

    if (isDropdown) {
      const subItemsHtml = item.children.map(sub => `
        <a class="mobile-sub-link ${currentUrl === sub.url ? 'active' : ''}" href="${sub.url}">${sub.title}</a>
      `).join('');

      return `
        <div class="mobile-nav-item">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <a class="mobile-nav-link has-sub ${isActive ? 'active' : ''}" href="${item.url}">${item.title}</a>
            <button class="mobile-has-sub-btn" style="padding:10px 14px;color:var(--color-slate-500);">${getIcon('chevronDown')}</button>
          </div>
          <div class="mobile-submenu" style="display:none;">
            ${subItemsHtml}
          </div>
        </div>
      `;
    }

    return `
      <div class="mobile-nav-item">
        <a class="mobile-nav-link ${isActive ? 'active' : ''}" href="${item.url}">
          <span>${item.title}</span>
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </a>
      </div>
    `;
  }).join('');

  return `
    <!-- Top Contact Bar -->
    <div class="topbar">
      <div class="container topbar-inner">
        <div class="topbar-info">
          <div class="topbar-item">
            ${getIcon('phone')}
            <a href="tel:${settings.contacts.phoneRaw}">${settings.contacts.phone}</a>
          </div>
          <div class="topbar-item">
            ${getIcon('clock')}
            <span>${settings.contacts.workHours}</span>
          </div>
          <div class="topbar-item">
            ${getIcon('mapPin')}
            <span>${settings.contacts.address}</span>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="social-links">
            <a class="social-link" href="${settings.contacts.whatsapp}" target="_blank" rel="noopener noreferrer" title="WhatsApp">${getIcon('wa')}</a>
            <a class="social-link" href="${settings.contacts.telegram}" target="_blank" rel="noopener noreferrer" title="Telegram">${getIcon('tg')}</a>
            <a class="social-link" href="${settings.contacts.vk}" target="_blank" rel="noopener noreferrer" title="ВКонтакте">${getIcon('vk')}</a>
          </div>
          <a class="admin-login-link" href="/admin" title="Вход в панель администратора">${getIcon('key')} Панель</a>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <header class="site-header">
      <div class="container header-inner">
        <!-- Logo -->
        <a class="brand-logo" href="/" title="На главную orientirprof.ru">
          <div class="brand-icon-wrap">
            <img src="/images/logo-compass.svg" alt="ОриентирПроф логотип" width="48" height="48">
          </div>
          <div class="brand-text">
            <span class="brand-name">Марина Бондарева</span>
            <span class="brand-desc">Эксперт Профориентолог</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="site-nav" aria-label="Основное меню">
          <ul class="nav-menu">
            ${menuItems}
          </ul>
        </nav>

        <!-- Right Side Actions -->
        <div class="header-actions">
          <div class="header-phone-box">
            <a class="header-phone" href="tel:${settings.contacts.phoneRaw}">${settings.contacts.phone}</a>
            <span class="header-phone-sub">Бесплатный звонок</span>
          </div>
          <button class="btn btn-primary" data-open-modal data-service="Обратный звонок">
            ${settings.header.ctaButtonText || 'Заказать звонок'}
          </button>
          <button class="mobile-toggle" id="mobileToggle" aria-label="Открыть мобильное меню">
            ${getIcon('menu')}
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Drawer -->
    <div class="drawer-overlay" id="drawerOverlay"></div>
    <div class="mobile-drawer" id="mobileDrawer">
      <div class="mobile-drawer-header">
        <a class="brand-logo" href="/">
          <img src="/images/logo-compass.svg" alt="Логотип" width="38" height="38">
          <div class="brand-text">
            <span class="brand-name" style="font-size:1.05rem;">Марина Бондарева</span>
            <span class="brand-desc" style="font-size:0.7rem;">Профориентолог</span>
          </div>
        </a>
        <button class="mobile-drawer-close" id="mobileDrawerClose" aria-label="Закрыть меню">
          ${getIcon('close')}
        </button>
      </div>
      <div class="mobile-drawer-menu">
        ${mobileMenuHtml}
      </div>
      <div class="mobile-drawer-footer">
        <div style="margin-bottom:12px;">
          <a class="header-phone" href="tel:${settings.contacts.phoneRaw}">${settings.contacts.phone}</a>
          <div style="font-size:0.78rem;color:var(--color-slate-500);margin-top:2px;">${settings.contacts.workHours}</div>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-bottom:14px;" data-open-modal data-service="Заказ звонка из меню">
          Заказать звонок
        </button>
        <div class="social-links" style="justify-content:center;">
          <a class="social-link" href="${settings.contacts.whatsapp}" target="_blank" rel="noopener noreferrer">${getIcon('wa')}</a>
          <a class="social-link" href="${settings.contacts.telegram}" target="_blank" rel="noopener noreferrer">${getIcon('tg')}</a>
          <a class="social-link" href="${settings.contacts.vk}" target="_blank" rel="noopener noreferrer">${getIcon('vk')}</a>
        </div>
      </div>
    </div>
  `;
}

// Generate Footer & Modals HTML
function renderFooter(settings) {
  const currentYear = new Date().getFullYear();
  const copyright = (settings.footer.copyrightText || '').replace('{YEAR}', currentYear);

  const serviceLinksHtml = settings.footer.serviceLinks.map(l => `
    <a class="footer-link" href="${l.url}">${l.title}</a>
  `).join('');

  const infoLinksHtml = settings.footer.infoLinks.map(l => `
    <a class="footer-link" href="${l.url}">${l.title}</a>
  `).join('');

  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <!-- Col 1: Brand & Bio -->
        <div class="footer-brand">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <img src="/images/logo-compass.svg" alt="Компас логотип" width="40" height="40" style="filter:brightness(1.2);">
            <div>
              <div style="font-size:1.15rem;font-weight:800;color:#fff;">Марина Бондарева</div>
              <div style="font-size:0.75rem;color:var(--color-slate-400);text-transform:uppercase;">Эксперт Профориентолог</div>
            </div>
          </div>
          <p>${settings.footer.aboutText}</p>
          <div class="social-links" style="margin-top:16px;">
            <a class="social-link" href="${settings.contacts.whatsapp}" target="_blank" rel="noopener noreferrer" title="WhatsApp">${getIcon('wa')}</a>
            <a class="social-link" href="${settings.contacts.telegram}" target="_blank" rel="noopener noreferrer" title="Telegram">${getIcon('tg')}</a>
            <a class="social-link" href="${settings.contacts.vk}" target="_blank" rel="noopener noreferrer" title="ВКонтакте">${getIcon('vk')}</a>
          </div>
        </div>

        <!-- Col 2: Services -->
        <div>
          <h4 class="footer-col-title">Услуги</h4>
          <div class="footer-links">
            ${serviceLinksHtml}
          </div>
        </div>

        <!-- Col 3: Information -->
        <div>
          <h4 class="footer-col-title">Навигация</h4>
          <div class="footer-links">
            ${infoLinksHtml}
          </div>
        </div>

        <!-- Col 4: Contacts & Call -->
        <div>
          <h4 class="footer-col-title">Контакты</h4>
          <div class="footer-contact-item">
            ${getIcon('phone')}
            <div>
              <a href="tel:${settings.contacts.phoneRaw}" style="font-weight:700;font-size:1.05rem;">${settings.contacts.phone}</a>
              <div style="font-size:0.75rem;color:var(--color-slate-400);">Второй: <a href="tel:+79102028572">+7 910 202 85 72</a></div>
            </div>
          </div>
          <div class="footer-contact-item">
            ${getIcon('mail')}
            <a href="mailto:${settings.contacts.email}">${settings.contacts.email}</a>
          </div>
          <div class="footer-contact-item">
            ${getIcon('clock')}
            <span>${settings.contacts.workHours}</span>
          </div>
          <div class="footer-contact-item">
            ${getIcon('mapPin')}
            <span>${settings.contacts.address}</span>
          </div>
          <div style="margin-top:16px;">
            <button class="btn btn-outline-white btn-sm" style="width:100%;" data-open-modal data-service="Звонок из футера">
              Заказать звонок
            </button>
          </div>
        </div>
      </div>

      <div class="container footer-bottom">
        <div>${copyright}</div>
        <div style="display:flex;gap:18px;">
          <a href="/privacy/">Политика конфиденциальности</a>
          <a href="/sitemap.xml">Карта сайта</a>
        </div>
      </div>
    </footer>

    <!-- Back to Top Button -->
    <button class="btn-scroll-top" id="btnScrollTop" aria-label="Наверх">
      ${getIcon('arrowUp')}
    </button>

    <!-- Cookie Consent Banner -->
    <div class="cookie-banner" id="cookieBanner">
      <div class="cookie-banner-text">
        ${settings.cookieNotice.text}
      </div>
      <div class="cookie-banner-actions">
        <button class="btn btn-primary btn-sm" id="cookieAcceptBtn">
          ${settings.cookieNotice.buttonText || 'Согласен'}
        </button>
        <a href="/privacy/" style="font-size:0.78rem;color:var(--color-slate-400);text-decoration:underline;">Подробнее</a>
      </div>
    </div>

    <!-- Callback / Booking Modal -->
    <div class="modal-backdrop" id="callbackModal">
      <div class="modal-window">
        <button class="modal-close" id="modalCloseBtn" aria-label="Закрыть окно">
          ${getIcon('close')}
        </button>
        <div style="margin-bottom:20px;">
          <div style="font-size:0.78rem;font-weight:700;color:var(--color-primary-light);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">
            Связь с Мариной Бондаревой
          </div>
          <h3 style="font-size:1.5rem;font-weight:800;color:var(--color-slate-900);line-height:1.2;">Заказать звонок</h3>
          <p class="modal-service-name" style="font-size:0.86rem;color:var(--color-slate-500);margin-top:4px;"></p>
        </div>
        <form data-ajax-form>
          <input type="hidden" name="formType" value="callback">
          <input type="hidden" name="service" value="Общая заявка">
          
          <div class="form-alert"></div>

          <div class="form-group">
            <label class="form-label">Ваше имя *</label>
            <input class="form-input" type="text" name="name" required placeholder="Например, Елена">
          </div>

          <div class="form-group">
            <label class="form-label">Номер телефона *</label>
            <input class="form-input" type="tel" name="phone" required placeholder="+7 (___) ___-__-__">
          </div>

          <div class="form-group">
            <label class="form-label">Удобное время для звонка или вопрос</label>
            <textarea class="form-textarea" name="message" placeholder="Например: Подросток 10 класс, выбор предметов ЕГЭ"></textarea>
          </div>

          <label class="form-checkbox-label">
            <input type="checkbox" required checked>
            <span>Согласен на обработку персональных данных в соответствии с <a href="/privacy/" target="_blank">Политикой конфиденциальности</a></span>
          </label>

          <button class="btn btn-primary btn-lg" type="submit" style="width:100%;">
            Отправить заявку
          </button>
        </form>
      </div>
    </div>

    <!-- Certificates Lightbox Modal -->
    <div class="lightbox-modal" id="lightboxModal">
      <div class="lightbox-content">
        <button class="lightbox-close" id="lightboxClose" aria-label="Закрыть">
          ${getIcon('close')}
        </button>
        <img id="lightboxImg" src="" alt="Сертификат профориентолога Марины Бондаревой">
      </div>
    </div>

    <!-- Main scripts -->
    <script src="/js/main.js"></script>
  `;
}

// Breadcrumbs HTML
function renderBreadcrumbs(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length <= 1) return '';
  const itemsHtml = breadcrumbs.map((b, idx) => {
    const isLast = idx === breadcrumbs.length - 1;
    if (isLast) {
      return `<li class="breadcrumb-item breadcrumb-current" aria-current="page">${b.title}</li>`;
    }
    return `
      <li class="breadcrumb-item">
        <a href="${b.url}">${b.title}</a>
        <span class="breadcrumb-separator">/</span>
      </li>
    `;
  }).join('');

  return `
    <nav class="breadcrumbs-wrap" aria-label="Хлебные крошки">
      <div class="container">
        <ol class="breadcrumbs">
          ${itemsHtml}
        </ol>
      </div>
    </nav>
  `;
}

// Generate Schema.org JSON-LD Microdata
function renderSchemaJsonLd(page, settings, breadcrumbs) {
  const schemaList = [];

  // LocalBusiness & Person
  schemaList.push({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": settings.schema.orgName,
    "image": "https://orientirprof.ru/images/marina-bondareva-hero.jpg",
    "@id": "https://orientirprof.ru/#business",
    "url": "https://orientirprof.ru",
    "telephone": settings.contacts.phoneRaw,
    "priceRange": settings.schema.priceRange,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings.contacts.address,
      "addressLocality": settings.contacts.city,
      "addressRegion": "Орловская область",
      "addressCountry": "RU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": settings.schema.geo.latitude,
      "longitude": settings.schema.geo.longitude
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "19:00"
      }
    ],
    "sameAs": [
      settings.contacts.vk,
      settings.contacts.yandexUslugi
    ]
  });

  // Person schema
  schemaList.push({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": settings.schema.specialistName,
    "jobTitle": settings.schema.jobTitle,
    "worksFor": {
      "@type": "Organization",
      "name": "ОриентирПроф"
    },
    "telephone": settings.contacts.phoneRaw,
    "email": settings.contacts.email,
    "url": "https://orientirprof.ru/about/",
    "image": "https://orientirprof.ru/images/marina-bondareva-hero.jpg"
  });

  // Breadcrumbs schema
  if (breadcrumbs && breadcrumbs.length > 1) {
    schemaList.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": b.title,
        "item": b.url === '/' ? 'https://orientirprof.ru/' : `https://orientirprof.ru${b.url}`
      }))
    });
  }

  // FAQ Schema if page has FAQ questions (Home, Services, Teens, Adults)
  if (page.faqList && page.faqList.length > 0) {
    schemaList.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": page.faqList.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    });
  }

  return `<script type="application/ld+json">\n${JSON.stringify(schemaList, null, 2)}\n</script>`;
}

module.exports = {
  getSettings,
  getPages,
  getBlog,
  getCases,
  getIcon,
  renderHeader,
  renderFooter,
  renderBreadcrumbs,
  renderSchemaJsonLd
};
