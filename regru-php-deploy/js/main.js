/**
 * Champion-Tennis.ru — Клиентские скрипты сайта
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollTop();
  initCookieBanner();
  initRankingsWidget();
  initMatchesWidget();
  initGlobalSearch();
  initForms();
  initMobileDrawer();
  initShareButtons();
  initGlossaryFilter();
});

// 1. Floating Scroll To Top Button
function initScrollTop() {
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (!scrollBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// 2. Cookie Consent Banner (Only for new visitors)
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const accepted = localStorage.getItem('champion_cookie_consent');
  if (!accepted) {
    setTimeout(() => {
      banner.style.display = 'block';
    }, 1200);
  }

  const btnAccept = document.getElementById('cookieAcceptBtn');
  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      localStorage.setItem('champion_cookie_consent', 'accepted');
      banner.style.display = 'none';
    });
  }

  const btnSettings = document.getElementById('cookieSettingsBtn');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      localStorage.setItem('champion_cookie_consent', 'essential_only');
      banner.style.display = 'none';
      alert('Приняты только технически необходимые файлы cookie.');
    });
  }
}

// 3. Rankings ATP/WTA Tab Switcher
function initRankingsWidget() {
  const tabBtns = document.querySelectorAll('.rank-tab-btn');
  const atpList = document.getElementById('rankingsAtpList');
  const wtaList = document.getElementById('rankingsWtaList');

  if (!tabBtns.length || !atpList || !wtaList) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.tab;
      if (target === 'atp') {
        atpList.style.display = 'block';
        wtaList.style.display = 'none';
      } else {
        atpList.style.display = 'none';
        wtaList.style.display = 'block';
      }
    });
  });
}

// 4. Matches Today Tab Filter
function initMatchesWidget() {
  const matchTabs = document.querySelectorAll('.match-tab-btn');
  const matchItems = document.querySelectorAll('.match-row-item');

  if (!matchTabs.length) return;

  matchTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      matchTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter; // all, live, finished, soon
      matchItems.forEach(item => {
        const status = item.dataset.status;
        if (filter === 'all' || status === filter) {
          item.style.display = 'grid';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

// 5. Global Search Modal & Live Suggestions
function initGlobalSearch() {
  const searchTriggers = document.querySelectorAll('.js-search-trigger');
  const searchModal = document.getElementById('searchModal');
  const searchClose = document.getElementById('searchModalClose');
  const searchInput = document.getElementById('globalSearchInput');
  const resultsContainer = document.getElementById('searchLiveResults');

  if (!searchModal || !searchInput) return;

  function openSearch() {
    searchModal.classList.add('open');
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeSearch() {
    searchModal.classList.remove('open');
  }

  searchTriggers.forEach(t => t.addEventListener('click', openSearch));
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal.classList.contains('open')) {
      closeSearch();
    }
    // Press '/' to search
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openSearch();
    }
  });

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      if (resultsContainer) resultsContainer.innerHTML = '<div style="padding: 16px 20px; color: #94a3b8; font-size: 0.875rem;">Введите минимум 2 символа для поиска...</div>';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if (!resultsContainer) return;

        if (data.results.length === 0) {
          resultsContainer.innerHTML = '<div style="padding: 16px 20px; color: #64748b; font-size: 0.875rem;">Ничего не найдено по запросу «' + escapeHtml(q) + '».</div>';
          return;
        }

        let html = '';
        data.results.forEach(item => {
          html += `
            <a href="${item.url}" class="search-result-item">
              <div>
                <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${item.type_label}</span>
                <strong style="color: #0f172a;">${escapeHtml(item.title)}</strong>
              </div>
              <span style="font-size: 0.75rem; color: #94a3b8;">${item.date || ''} &rarr;</span>
            </a>
          `;
        });
        html += `<div style="padding: 10px 20px; text-align: center; border-top: 1px solid #f1f5f9;"><a href="/search?q=${encodeURIComponent(q)}" style="font-size: 0.8125rem; font-weight: 700; color: #0a5c36;">Посмотреть все результаты (${data.total}) &rarr;</a></div>`;
        resultsContainer.innerHTML = html;
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);
  });
}

// 6. Interactive AJAX Form Submissions (Newsletter & Contacts)
function initForms() {
  // Newsletter forms
  const newsForms = document.querySelectorAll('.js-newsletter-form');
  newsForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : '';
      const btn = form.querySelector('button[type="submit"]');

      if (!email) return;

      const oldText = btn.textContent;
      btn.textContent = 'Отправка...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, pageUrl: window.location.href })
        });
        const data = await res.json();
        if (data.success) {
          form.innerHTML = '<div style="background: rgba(255,255,255,0.2); padding: 12px 18px; border-radius: 6px; color: #ffffff; font-weight: 700; font-size: 0.9375rem;">✅ Спасибо за подписку! Дайджест будет приходить в 8:00 МСК.</div>';
        } else {
          alert('Ошибка: ' + (data.error || 'Попробуйте позже'));
          btn.textContent = oldText;
          btn.disabled = false;
        }
      } catch (err) {
        alert('Сетевая ошибка при отправке. Пожалуйста, попробуйте еще раз.');
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });
  });

  // Contact & Advertising form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const payload = {
        name: formData.get('name'),
        contact: formData.get('contact'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        form_type: formData.get('form_type') || 'contact',
        pageUrl: window.location.href
      };

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const origText = submitBtn.textContent;
      submitBtn.textContent = 'Отправка...';
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          contactForm.innerHTML = `
            <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 24px; border-radius: 8px; text-align: center;">
              <h3 style="margin-bottom: 8px;">✅ Ваше обращение успешно отправлено!</h3>
              <p>Дежурный редактор свяжется с вами по указанным контактам в течение рабочего дня.</p>
            </div>
          `;
        } else {
          alert('Ошибка: ' + (data.error || 'Не удалось отправить форму'));
          submitBtn.textContent = origText;
          submitBtn.disabled = false;
        }
      } catch (err) {
        alert('Ошибка связи с сервером');
        submitBtn.textContent = origText;
        submitBtn.disabled = false;
      }
    });
  }
}

// 7. Mobile Drawer Navigation
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('mobileDrawerClose');

  if (!toggleBtn || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
}

// 8. Social Share Buttons
function initShareButtons() {
  const copyBtn = document.querySelector('.js-copy-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '✅ Скопировано!';
        setTimeout(() => copyBtn.innerHTML = orig, 2000);
      });
    });
  }
}

// 9. Glossary Letter Filter
function initGlossaryFilter() {
  const letterButtons = document.querySelectorAll('.js-gloss-letter');
  const glossItems = document.querySelectorAll('.glossary-item');

  if (!letterButtons.length) return;

  letterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      letterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const letter = btn.dataset.letter;
      glossItems.forEach(item => {
        if (letter === 'ALL' || item.dataset.letter === letter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
