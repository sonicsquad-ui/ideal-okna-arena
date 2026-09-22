/**
 * Champion-Tennis.ru — Скрипты Административной Панели
 * Полноценный визуальный WYSIWYG-редактор, вставка HTML, картинок, кнопок и ссылок
 */

document.addEventListener('DOMContentLoaded', () => {
  initWysiwygEditor();
  initNewsAggregatorTrigger();
});

function initWysiwygEditor() {
  const editorArea = document.getElementById('wysiwygEditorArea');
  const htmlArea = document.getElementById('wysiwygHtmlArea');
  const hiddenInput = document.getElementById('contentHiddenInput');
  const toggleHtmlBtn = document.getElementById('toggleHtmlModeBtn');

  if (!editorArea || !hiddenInput) return;

  // Initialize editor content from hidden input or data attribute
  editorArea.innerHTML = hiddenInput.value;
  if (htmlArea) htmlArea.value = hiddenInput.value;

  // Formatting buttons
  const formatButtons = document.querySelectorAll('.js-wysiwyg-cmd');
  formatButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val || null;

      if (cmd === 'createLink') {
        const url = prompt('Введите URL ссылки (например, https://champion-tennis.ru/news):');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } else if (cmd === 'insertImage') {
        const url = prompt('Введите URL изображения (или выберите загруженное, например: /images/news-medvedev.jpg):');
        if (url) {
          document.execCommand('insertImage', false, url);
        }
      } else if (cmd === 'insertButton') {
        const btnText = prompt('Текст кнопки (например, «Читать полный разбор»):', 'Подробнее');
        const btnUrl = prompt('Ссылка кнопки:', 'https://champion-tennis.ru/');
        if (btnText && btnUrl) {
          const btnHtml = `<p><a href="${btnUrl}" class="btn-read-more" style="display:inline-block; padding:10px 20px; background:#0a5c36; color:#ffffff; font-weight:700; border-radius:6px; text-decoration:none;">${btnText} &rarr;</a></p><p></p>`;
          document.execCommand('insertHTML', false, btnHtml);
        }
      } else if (cmd === 'insertHtmlSnippet') {
        const snippet = prompt('Вставьте произвольный HTML код:');
        if (snippet) {
          document.execCommand('insertHTML', false, snippet);
        }
      } else {
        document.execCommand(cmd, false, val);
      }
      syncContent();
    });
  });

  // Toggle between Visual and HTML Mode
  let isHtmlMode = false;
  if (toggleHtmlBtn && htmlArea) {
    toggleHtmlBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isHtmlMode = !isHtmlMode;
      if (isHtmlMode) {
        htmlArea.value = editorArea.innerHTML;
        editorArea.style.display = 'none';
        htmlArea.style.display = 'block';
        toggleHtmlBtn.textContent = '👁️ Визуальный режим';
        toggleHtmlBtn.classList.add('btn-admin-warning');
      } else {
        editorArea.innerHTML = htmlArea.value;
        htmlArea.style.display = 'none';
        editorArea.style.display = 'block';
        toggleHtmlBtn.textContent = '</> HTML код';
        toggleHtmlBtn.classList.remove('btn-admin-warning');
      }
      syncContent();
    });

    htmlArea.addEventListener('input', () => {
      hiddenInput.value = htmlArea.value;
    });
  }

  editorArea.addEventListener('input', syncContent);

  function syncContent() {
    if (isHtmlMode) {
      hiddenInput.value = htmlArea.value;
    } else {
      hiddenInput.value = editorArea.innerHTML;
      if (htmlArea) htmlArea.value = editorArea.innerHTML;
    }
  }

  // Ensure content is synced on form submit
  const form = editorArea.closest('form');
  if (form) {
    form.addEventListener('submit', () => {
      syncContent();
    });
  }
}

// News Aggregation Trigger from Admin UI
function initNewsAggregatorTrigger() {
  const triggerBtn = document.getElementById('triggerAggregatorBtn');
  const statusBadge = document.getElementById('aggregatorStatusBadge');

  if (!triggerBtn) return;

  triggerBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const origText = triggerBtn.textContent;
    triggerBtn.textContent = '⏳ Сбор и рерайтинг новостей...';
    triggerBtn.disabled = true;

    try {
      const res = await fetch('/admin/api/trigger-news-update', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (statusBadge) {
          statusBadge.innerHTML = `✅ Добавлено ${data.info.added_count} уникальных новостей (${data.info.last_run_msk})`;
          statusBadge.style.display = 'inline-block';
        }
        alert(`Успешно! Добавлено уникальных переписанных новостей: ${data.info.added_count}. Лента обновлена.`);
        window.location.reload();
      } else {
        alert('Ошибка при сборе новостей');
      }
    } catch (err) {
      alert('Ошибка соединения с сервером');
    } finally {
      triggerBtn.textContent = origText;
      triggerBtn.disabled = false;
    }
  });
}
