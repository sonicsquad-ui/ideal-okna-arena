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

  searchTriggers.forEach(t => t.addEventListener('click', (e) => {
    e.preventDefault();
    openSearch();
  }));

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

        if (!data.results || data.results.length === 0) {
          resultsContainer.innerHTML = '<div style="padding: 16px 20px; color: #64748b; font-size: 0.875rem;">Ничего не найдено по запросу «' + escapeHtml(q) + '».</div>';
          return;
        }

        let html = '';
        data.results.forEach(item => {
          let badgeColor = '#0a5c36';
          let badgeBg = '#e6f4ea';
          if (item.type_label === 'Новость') { badgeColor = '#0369a1'; badgeBg = '#e0f2fe'; }
          else if (item.type_label === 'Блог') { badgeColor = '#9a3412'; badgeBg = '#ffedd5'; }
          else if (item.type_label === 'Раздел' || item.type_label === 'Страница') { badgeColor = '#065f46'; badgeBg = '#d1fae5'; }
          else if (item.type_label === 'Документ') { badgeColor = '#334155'; badgeBg = '#f1f5f9'; }

          html += `
            <a href="${item.url}" class="search-result-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; border-bottom:1px solid #f1f5f9; text-decoration:none;">
              <div style="flex:1; padding-right:12px;">
                <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 7px; border-radius: 4px; margin-right: 8px;">${item.type_label}</span>
                <strong style="color: #0f172a; font-size:0.9375rem;">${escapeHtml(item.title)}</strong>
                ${item.desc ? `<div style="font-size:0.775rem; color:#64748b; margin-top:2px;">${escapeHtml(item.desc)}</div>` : ''}
              </div>
              <span style="font-size: 0.75rem; color: #94a3b8; white-space:nowrap;">${item.date || 'Перейти'} &rarr;</span>
            </a>
          `;
        });
        html += `<div style="padding: 12px 20px; text-align: center; background:#f8fafc; border-top: 1px solid #e2e8f0;"><a href="/search?q=${encodeURIComponent(q)}" style="font-size: 0.85rem; font-weight: 700; color: #0a5c36; text-decoration:none;">Посмотреть все результаты (${data.total}) &rarr;</a></div>`;
        resultsContainer.innerHTML = html;
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 220);
  });
}

// 6. Interactive AJAX Form Submissions (Newsletter & Contacts)
function initForms() {
  // Newsletter forms
  const newsForms = document.querySelectorAll('.js-newsletter-form');
  newsForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Проверка обязательного чекбокса согласия (Требование 1)
      const agreeBox = form.querySelector('input[type="checkbox"][name="agree"]');
      if (agreeBox && !agreeBox.checked) {
        alert('Поставьте согласие, форма отправляется только при проставлении галочки');
        agreeBox.focus();
        return;
      }

      const input = form.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : '';
      const btn = form.querySelector('button[type="submit"]');

      if (!email) {
        alert('Пожалуйста, введите ваш email');
        return;
      }

      const oldText = btn.textContent;
      btn.textContent = 'Отправка...';
      btn.disabled = true;

      const params = new URLSearchParams();
      params.append('email', email);
      params.append('pageUrl', window.location.href);

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: params.toString()
        });
        const data = await res.json();
        if (data.success) {
          form.innerHTML = '<div style="background: rgba(255,255,255,0.2); padding: 14px 18px; border-radius: 8px; color: #ffffff; font-weight: 700; font-size: 0.9375rem;">✅ Спасибо за подписку! Дайджест будет приходить в 8:00 МСК.</div>';
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

  // Contact & Feedback forms (на /about, /contacts, /site-rules и любых других)
  const contactForms = document.querySelectorAll('form#contactForm, form.js-contact-form');
  contactForms.forEach(contactForm => {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Проверка обязательного чекбокса согласия (Требование 1)
      const agreeBox = contactForm.querySelector('input[type="checkbox"][name="agree"]');
      if (agreeBox && !agreeBox.checked) {
        alert('Поставьте согласие, форма отправляется только при проставлении галочки');
        agreeBox.focus();
        return;
      }

      const formData = new FormData(contactForm);
      const name = (formData.get('name') || '').toString().trim();
      const contact = (formData.get('contact') || '').toString().trim();
      const subject = (formData.get('subject') || '').toString().trim();
      const message = (formData.get('message') || '').toString().trim();
      const formType = (formData.get('form_type') || 'Обращение с сайта').toString().trim();

      if (!contact || !message) {
        alert('Пожалуйста, заполните обязательные поля: Контакт для связи и Текст сообщения.');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Отправить';
      if (submitBtn) {
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
      }

      // Отправляем как urlencoded для 100% совместимости с любым PHP-хостингом
      const params = new URLSearchParams();
      params.append('name', name || 'Посетитель сайта');
      params.append('contact', contact);
      params.append('subject', subject || 'Обращение с сайта Champion-Tennis.ru');
      params.append('message', message);
      params.append('form_type', formType);
      params.append('pageUrl', window.location.href);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json'
          },
          body: params.toString()
        });
        const data = await res.json();
        if (data.success) {
          contactForm.innerHTML = `
            <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 24px; border-radius: 8px; text-align: center; margin: 12px 0;">
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 8px;">✅ Ваше обращение успешно отправлено!</h3>
              <p style="font-size: 0.95rem; margin: 0;">Дежурный редактор свяжется с вами по указанным контактам в течение рабочего дня.</p>
            </div>
          `;
        } else {
          alert('Ошибка: ' + (data.error || 'Не удалось отправить форму'));
          if (submitBtn) {
            submitBtn.textContent = origText;
            submitBtn.disabled = false;
          }
        }
      } catch (err) {
        alert('Ошибка связи с сервером. Пожалуйста, попробуйте еще раз.');
        if (submitBtn) {
          submitBtn.textContent = origText;
          submitBtn.disabled = false;
        }
      }
    });
  });
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

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
}

// 8. Social Share Buttons (Telegram, VK, OK, Мой Мир, MAX, Copy Link)
function initShareButtons() {
  window.copyPageUrl = function(button, url) {
    const textToCopy = url || window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showCopySuccess(button);
      }).catch(() => fallbackCopy(button, textToCopy));
    } else {
      fallbackCopy(button, textToCopy);
    }
  };

  function fallbackCopy(button, text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showCopySuccess(button);
    } catch (err) {
      alert('Ссылка для копирования: ' + text);
    }
    document.body.removeChild(tempInput);
  }

  function showCopySuccess(button) {
    if (!button) return;
    const orig = button.innerHTML;
    button.innerHTML = '✅ Скопировано!';
    setTimeout(() => {
      button.innerHTML = orig;
    }, 2500);
  }

  window.shareToMax = function(url, title) {
    const targetUrl = url || window.location.href;
    const targetTitle = title || document.title;
    if (navigator.share) {
      navigator.share({
        title: targetTitle,
        url: targetUrl
      }).catch(() => {});
    } else {
      window.open('https://max.ru/share?url=' + encodeURIComponent(targetUrl) + '&text=' + encodeURIComponent(targetTitle), '_blank');
    }
  };
}

// 9. Glossary Term Filter
function initGlossaryFilter() {
  const filterInput = document.getElementById('glossaryFilterInput');
  const termCards = document.querySelectorAll('.glossary-term-card');

  if (!filterInput || !termCards.length) return;

  filterInput.addEventListener('input', () => {
    const q = filterInput.value.toLowerCase().trim();
    termCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
