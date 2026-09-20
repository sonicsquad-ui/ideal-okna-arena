/**
 * ORIENTIRPROF.RU — Основные интерактивные скрипты сайта
 * Марина Бондарева, Профориентолог
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // 1. Mobile Drawer Navigation
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileDrawerClose = document.getElementById('mobileDrawerClose');
  const drawerOverlay = document.getElementById('drawerOverlay');

  function openDrawer() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.add('open');
      drawerOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.remove('open');
      drawerOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
  if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // Close drawer on link click
  document.querySelectorAll('.mobile-nav-link:not(.has-sub), .mobile-sub-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Mobile submenu accordion
  document.querySelectorAll('.mobile-has-sub-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.closest('.mobile-nav-item');
      if (parent) {
        parent.classList.toggle('expanded');
        const sub = parent.querySelector('.mobile-submenu');
        if (sub) {
          sub.style.display = parent.classList.contains('expanded') ? 'flex' : 'none';
        }
      }
    });
  });

  // 2. Modals (Callback / Request)
  const modalBackdrop = document.getElementById('callbackModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTriggers = document.querySelectorAll('[data-open-modal]');

  function openModal(serviceTitle) {
    if (modalBackdrop) {
      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      const serviceInput = modalBackdrop.querySelector('input[name="service"]');
      if (serviceInput && serviceTitle) {
        serviceInput.value = serviceTitle;
      }
      const titleElem = modalBackdrop.querySelector('.modal-service-name');
      if (titleElem) {
        titleElem.textContent = serviceTitle ? `Услуга: ${serviceTitle}` : '';
      }
      const phoneInput = modalBackdrop.querySelector('input[type="tel"]');
      if (phoneInput) setTimeout(() => phoneInput.focus(), 150);
    }
  }

  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  modalTriggers.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const service = this.getAttribute('data-service') || '';
      openModal(service);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
      closeLightbox();
      closeDrawer();
    }
  });

  // 3. Phone Input Mask (+7 (___) ___-__-__)
  function initPhoneMask(input) {
    input.addEventListener('input', function (e) {
      let val = input.value.replace(/\D/g, '');
      if (!val) {
        input.value = '';
        return;
      }
      if (val[0] === '7' || val[0] === '8') {
        val = val.substring(1);
      }
      let formatted = '+7 ';
      if (val.length > 0) formatted += '(' + val.substring(0, 3);
      if (val.length >= 3) formatted += ') ' + val.substring(3, 6);
      if (val.length >= 6) formatted += '-' + val.substring(6, 8);
      if (val.length >= 8) formatted += '-' + val.substring(8, 10);
      input.value = formatted;
    });

    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 ';
    });

    input.addEventListener('blur', function () {
      if (input.value === '+7 ' || input.value === '+7') input.value = '';
    });
  }

  document.querySelectorAll('input[type="tel"]').forEach(initPhoneMask);

  // 4. AJAX Form Submission
  document.querySelectorAll('form[data-ajax-form]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const alertBox = form.querySelector('.form-alert');
      const submitBtn = form.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.innerHTML : '';

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => { data[key] = value; });

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Отправка...</span>';
      }

      try {
        // Try posting to Node endpoint first, fallback to PHP if on shared hosting
        let response;
        try {
          response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } catch (err) {
          response = await fetch('/api/send.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }

        const resJson = await response.json();

        if (resJson.success) {
          form.reset();
          if (alertBox) {
            alertBox.className = 'form-alert success';
            alertBox.textContent = resJson.message || 'Спасибо! Ваша заявка успешно отправлена. Марина Бондарева свяжется с вами в ближайшее время.';
            alertBox.style.display = 'block';
          }
          setTimeout(() => {
            if (form.closest('#callbackModal')) {
              closeModal();
            }
          }, 3500);
        } else {
          throw new Error(resJson.error || 'Произошла ошибка при отправке');
        }
      } catch (error) {
        if (alertBox) {
          alertBox.className = 'form-alert error';
          alertBox.textContent = error.message || 'Ошибка соединения. Пожалуйста, позвоните нам напрямую: +7 (903) 029-34-34';
          alertBox.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      }
    });
  });

  // 5. FAQ Accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close siblings if desired or keep single open
        document.querySelectorAll('.faq-item').forEach(sibling => {
          if (sibling !== item) sibling.classList.remove('active');
        });
        item.classList.toggle('active', !isActive);
      });
    }
  });

  // 6. Scroll to Top Button
  const btnScrollTop = document.getElementById('btnScrollTop');
  if (btnScrollTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 320) {
        btnScrollTop.classList.add('visible');
      } else {
        btnScrollTop.classList.remove('visible');
      }
    }, { passive: true });

    btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 7. Cookie Consent Banner
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAcceptBtn = document.getElementById('cookieAcceptBtn');

  if (cookieBanner && cookieAcceptBtn) {
    const accepted = localStorage.getItem('orientir_cookie_accepted');
    if (!accepted) {
      setTimeout(() => {
        cookieBanner.classList.add('active');
      }, 1200);
    }

    cookieAcceptBtn.addEventListener('click', () => {
      localStorage.setItem('orientir_cookie_accepted', 'true');
      cookieBanner.classList.remove('active');
    });
  }

  // 8. Certificates Lightbox
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src) {
    if (lightboxModal && lightboxImg) {
      lightboxImg.src = src;
      lightboxModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-lightbox]').forEach(card => {
    card.addEventListener('click', function () {
      const src = this.getAttribute('data-lightbox');
      if (src) openLightbox(src);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener('click', function (e) {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // 9. Case Filter Tabs (on Cases page)
  const caseTabs = document.querySelectorAll('.case-tab-btn');
  const caseCards = document.querySelectorAll('.case-item-card');

  if (caseTabs.length > 0) {
    caseTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        caseTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const filter = this.getAttribute('data-filter');

        caseCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
});
