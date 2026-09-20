/**
 * ORIENTIRPROF.RU — Панель управления сайтом (CMS)
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Toast notification helper
  function showToast(msg, isError = false) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.className = 'admin-toast';
      document.body.appendChild(toast);
    }
    toast.style.backgroundColor = isError ? '#991b1b' : '#0f172a';
    toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // Tab switching
  const menuButtons = document.querySelectorAll('.admin-menu-item[data-tab]');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      menuButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');

      const titleEl = document.getElementById('adminPageHeaderTitle');
      if (titleEl) {
        titleEl.textContent = btn.innerText.trim();
      }
    });
  });

  // 1. Pages Editor: Select page to edit
  const pageSelect = document.getElementById('adminPageSelect');
  const pageForm = document.getElementById('adminPageEditForm');

  if (pageSelect && pageForm) {
    pageSelect.addEventListener('change', async function () {
      const pageKey = this.value;
      if (!pageKey) return;
      try {
        const res = await fetch(`/api/admin/get-page?key=${pageKey}`);
        const data = await res.json();
        if (data.success && data.page) {
          const p = data.page;
          pageForm.querySelector('[name="pageKey"]').value = pageKey;
          pageForm.querySelector('[name="title"]').value = p.title || '';
          pageForm.querySelector('[name="description"]').value = p.description || '';
          pageForm.querySelector('[name="keywords"]').value = p.keywords || '';
          pageForm.querySelector('[name="h1"]').value = p.h1 || '';
          pageForm.querySelector('[name="subtitle"]').value = p.subtitle || p.heroSubtitle || '';
          pageForm.querySelector('[name="slug"]').value = p.slug || '';
          
          const contentArea = pageForm.querySelector('[name="content"]');
          if (contentArea) {
            contentArea.value = p.content || '';
          }

          const deleteBtn = document.getElementById('adminDeletePageBtn');
          if (deleteBtn) {
            // Only allow deleting non-system pages
            const systemPages = ['home', 'about', 'konsultaciya', 'test', 'services', 'service-teens', 'service-adults', 'service-career', 'cases', 'blog', 'contacts', 'privacy'];
            deleteBtn.style.display = systemPages.includes(pageKey) ? 'none' : 'inline-flex';
          }
        }
      } catch (err) {
        showToast('Ошибка загрузки данных страницы', true);
      }
    });

    // Save Page Form
    pageForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(pageForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/save-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Страница успешно сохранена и обновлена на сайте!');
        } else {
          showToast(result.error || 'Ошибка при сохранении', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // Create New Page Modal / Form
  const createPageForm = document.getElementById('adminCreatePageForm');
  if (createPageForm) {
    createPageForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(createPageForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/create-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Новая страница успешно создана!');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(result.error || 'Ошибка при создании', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // Delete Page
  const deletePageBtn = document.getElementById('adminDeletePageBtn');
  if (deletePageBtn) {
    deletePageBtn.addEventListener('click', async function () {
      const pageKey = pageForm.querySelector('[name="pageKey"]').value;
      if (!confirm(`Вы действительно хотите удалить страницу ${pageKey}?`)) return;

      try {
        const res = await fetch('/api/admin/delete-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageKey })
        });
        const result = await res.json();
        if (result.success) {
          showToast('Страница удалена');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(result.error || 'Ошибка удаления', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 2. Header & Navigation Form
  const headerForm = document.getElementById('adminHeaderForm');
  if (headerForm) {
    headerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(headerForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/save-header', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Настройки шапки и контактов успешно сохранены!');
        } else {
          showToast(result.error || 'Ошибка сохранения', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 3. Footer Form
  const footerForm = document.getElementById('adminFooterForm');
  if (footerForm) {
    footerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(footerForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/save-footer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Настройки футера успешно сохранены!');
        } else {
          showToast(result.error || 'Ошибка сохранения', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 4. Schema.org Microdata Form
  const schemaForm = document.getElementById('adminSchemaForm');
  if (schemaForm) {
    schemaForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(schemaForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/save-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Микроразметка Schema.org успешно сохранена!');
        } else {
          showToast(result.error || 'Ошибка', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 5. Robots.txt Form
  const robotsForm = document.getElementById('adminRobotsForm');
  if (robotsForm) {
    robotsForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const content = robotsForm.querySelector('[name="robotsContent"]').value;

      try {
        const res = await fetch('/api/admin/save-robots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        const result = await res.json();
        if (result.success) {
          showToast('Файл robots.txt успешно обновлен!');
        } else {
          showToast(result.error || 'Ошибка при сохранении', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 6. Blog Article Form
  const blogForm = document.getElementById('adminBlogForm');
  if (blogForm) {
    blogForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(blogForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/save-blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Статья блога успешно сохранена!');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(result.error || 'Ошибка', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 7. Case Form
  const caseForm = document.getElementById('adminCaseForm');
  if (caseForm) {
    caseForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(caseForm);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });

      try {
        const res = await fetch('/api/admin/save-case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Кейс успешно сохранен!');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(result.error || 'Ошибка', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 8. Lead status update
  document.querySelectorAll('.admin-lead-status-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const leadId = this.getAttribute('data-lead-id');
      try {
        const res = await fetch('/api/admin/toggle-lead-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: leadId })
        });
        const result = await res.json();
        if (result.success) {
          showToast('Статус заявки обновлен');
          setTimeout(() => location.reload(), 600);
        }
      } catch (err) {
        showToast('Ошибка обновления статуса', true);
      }
    });
  });

  // 9. Change Password Form
  const pwdForm = document.getElementById('adminPwdForm');
  if (pwdForm) {
    pwdForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const newPassword = pwdForm.querySelector('[name="newPassword"]').value;
      const confirmPassword = pwdForm.querySelector('[name="confirmPassword"]').value;

      if (newPassword !== confirmPassword) {
        showToast('Пароли не совпадают!', true);
        return;
      }

      try {
        const res = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword })
        });
        const result = await res.json();
        if (result.success) {
          pwdForm.reset();
          showToast('Пароль администратора успешно изменен!');
        } else {
          showToast(result.error || 'Ошибка смены пароля', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      }
    });
  }

  // 10. Rebuild HTML static files button
  const rebuildBtn = document.getElementById('adminRebuildStaticBtn');
  if (rebuildBtn) {
    rebuildBtn.addEventListener('click', async function () {
      rebuildBtn.disabled = true;
      rebuildBtn.innerText = 'Сборка...';
      try {
        const res = await fetch('/api/admin/rebuild-static', { method: 'POST' });
        const result = await res.json();
        if (result.success) {
          showToast('Все статические HTML файлы сайта успешно пересобраны!');
        } else {
          showToast('Ошибка при сборке', true);
        }
      } catch (err) {
        showToast('Ошибка сервера', true);
      } finally {
        rebuildBtn.disabled = false;
        rebuildBtn.innerText = '🔄 Пересобрать статические HTML страницы';
      }
    });
  }
});
