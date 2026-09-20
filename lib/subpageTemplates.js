/**
 * ORIENTIRPROF.RU — Шаблоны внутренних страниц сайта
 */

const { getIcon } = require('./renderer');
const { certificates, mediaList, reviewsList, homeFaq } = require('./pageTemplates');

// Render "About" page
function renderAboutPage(page, settings) {
  return `
    <div class="container section">
      <div class="about-preview-grid" style="margin-bottom:56px;">
        <div>
          <span class="section-badge">Обо мне</span>
          <h1 class="section-title" style="margin-bottom:20px;">Профориентолог Марина Бондарева</h1>
          <p style="font-size:1.1rem;line-height:1.7;color:var(--color-slate-700);margin-bottom:18px;">
            Благодаря обучению различным методам профориентации, коучинга и психологии, я обладаю широким арсеналом практических техник для решения вопросов выбора будущей профессии.
          </p>
          <p style="font-size:1.02rem;line-height:1.7;color:var(--color-slate-600);margin-bottom:18px;">
            В своих программах я успешно объединяю педагогические и психологические подходы. Профориентация в моих консультациях всегда ориентирована на истинные интересы и внутреннюю мотивацию самого клиента. Работа по выявлению его уникальных сильных сторон добавляет дополнительный стимул к реализации выбранного профессионального пути.
          </p>
          <div class="quote-box">
            «Моя цель — помочь клиенту, будь то подросток или взрослый, сделать осознанный выбор профессии, подобрать соответствующее образование и реализовать свои способности в профессиональной сфере, опираясь на четкий план действий».
          </div>
          <div style="font-weight:700;color:var(--color-slate-900);margin:20px 0 10px;">
            Опыт работы в сфере профориентирования — более 5 лет.
          </div>
        </div>
        <div class="about-preview-image">
          <img src="/images/marina-about.jpg" alt="Марина Бондарева в кабинете" style="height:520px;">
        </div>
      </div>

      <!-- Principles & Methods -->
      <div class="section-alt" style="padding:48px;border-radius:var(--radius-xl);margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:24px;text-align:center;">
          Принципы моей работы
        </h2>
        <div class="audience-grid">
          <div class="audience-card">
            <div class="audience-icon">${getIcon('compass')}</div>
            <h3 class="audience-title">Индивидуальный подход</h3>
            <p class="audience-text">Никаких шаблонных ответов. Каждый человек — уникальная личность со своим темпераментом, талантами и жизненными обстоятельствами.</p>
          </div>
          <div class="audience-card">
            <div class="audience-icon">${getIcon('award')}</div>
            <h3 class="audience-title">Научная обоснованность</h3>
            <p class="audience-text">Использую валидированные психологические и профориентационные методики (Климов, Холланд, Шейн, Резапкина), проверенные многолетней практикой.</p>
          </div>
          <div class="audience-card">
            <div class="audience-icon">${getIcon('star')}</div>
            <h3 class="audience-title">Актуальность рынка</h3>
            <p class="audience-text">Отслеживаю реальные тренды российского и международного рынка труда, динамику заработных плат и перспективные направления до 2035 года.</p>
          </div>
        </div>
      </div>

      <!-- Diplomas Gallery -->
      <div style="margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:12px;text-align:center;">
          Сертификаты и дипломы
        </h2>
        <p style="text-align:center;color:var(--color-slate-600);margin-bottom:32px;">
          Регулярно повышаю квалификацию в ведущих образовательных центрах и институтах коучинга
        </p>
        <div class="certificates-grid">
          ${certificates.map(c => `
            <div class="cert-card" data-lightbox="${c.img}">
              <img src="${c.img}" alt="${c.title}" loading="lazy">
              <div class="cert-overlay"><div class="cert-zoom-btn">${getIcon('zoom')}</div></div>
              <div class="cert-title">${c.title}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Media Section -->
      <div style="margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:24px;text-align:center;">
          Публикации и участие в экспертных проектах
        </h2>
        <div class="media-grid">
          ${mediaList.map(m => `
            <div class="media-card">
              <div class="media-icon">${getIcon('award')}</div>
              <div class="media-title">${m.name}</div>
              <div class="media-sub">${m.sub}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Testimonials -->
      <div style="margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:32px;text-align:center;">
          Отзывы клиентов
        </h2>
        <div class="reviews-grid">
          ${reviewsList.map(r => `
            <div class="review-card">
              <div class="review-stars">${getIcon('star')}${getIcon('star')}${getIcon('star')}${getIcon('star')}${getIcon('star')}</div>
              <p class="review-text">«${r.text}»</p>
              <div class="review-author">
                <div class="review-avatar">${r.name.charAt(0)}</div>
                <div class="review-info">
                  <div class="review-name">${r.name}</div>
                  <div class="review-role">${r.role}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;background:var(--color-primary-subtle);padding:40px;border-radius:var(--radius-xl);border:1px solid rgba(37,99,235,0.2);">
        <h3 style="font-size:1.6rem;font-weight:800;color:var(--color-slate-900);margin-bottom:12px;">Готовы найти свое профессиональное призвание?</h3>
        <p style="color:var(--color-slate-600);max-width:600px;margin:0 auto 24px;">Запишитесь на бесплатную вводную беседу по телефону или через форму на сайте.</p>
        <button class="btn btn-primary btn-lg" data-open-modal data-service="Беседа со страницы Обо мне">
          Записаться на консультацию
        </button>
      </div>
    </div>
  `;
}

// Render "Consultation" page
function renderConsultationPage(page, settings) {
  return `
    <div class="container section">
      <div class="section-header">
        <span class="section-badge">Программа и формат</span>
        <h1 class="section-title">Консультация профориентолога и программа</h1>
        <p class="section-desc">Глубокая структурированная работа, которая помогает избавиться от сомнений и построить четкий карьерный маршрут</p>
      </div>

      <!-- 4 Stages -->
      <div style="margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:28px;text-align:center;">
          Как проходит консультация (4 ключевых этапа)
        </h2>
        <div class="stages-grid">
          <div class="stage-card">
            <span class="stage-number">01</span>
            <h3 class="stage-title">Первичная встреча</h3>
            <p class="stage-text">На первой встрече специалист собирает подробную информацию о клиенте: его интересах, школьных предметах, хобби, страхах и жизненных целях.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">02</span>
            <h3 class="stage-title">Проведение тестов</h3>
            <p class="stage-text">Профориентолог предлагает пройти батарею специализированных методик для объективного выявления способностей и ведущего типа мышления.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">03</span>
            <h3 class="stage-title">Анализ результатов</h3>
            <p class="stage-text">Подробно интерпретируем данные вместе с клиентом, рассматриваем варианты карьерных траекторий и сопоставляем их с требованиями рынка.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">04</span>
            <h3 class="stage-title">Разработка плана действий</h3>
            <p class="stage-text">Составляется персональная дорожная карта с конкретными шагами: выбор предметов ОГЭ/ЕГЭ, список целевых ВУЗов или курсов переквалификации.</p>
          </div>
        </div>
      </div>

      <!-- Individual vs Group -->
      <div class="about-preview-grid" style="margin-bottom:56px;">
        <div style="background:var(--color-slate-50);padding:36px;border-radius:var(--radius-xl);border:1px solid var(--color-slate-200);">
          <div class="audience-icon">${getIcon('compass')}</div>
          <h3 style="font-size:1.4rem;font-weight:700;color:var(--color-slate-900);margin-bottom:12px;">Индивидуальные консультации</h3>
          <p style="font-size:0.95rem;color:var(--color-slate-600);line-height:1.6;margin-bottom:16px;">
            Самый глубокий и персонализированный формат. Все внимание эксперта сосредоточено на вашей ситуации:
          </p>
          <ul style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
            <li style="display:flex;gap:8px;font-size:0.9rem;">${getIcon('check')} <span>100% персонализированный план и психологическая поддержка</span></li>
            <li style="display:flex;gap:8px;font-size:0.9rem;">${getIcon('check')} <span>Гибкий график: удобное время очно в Орле или онлайн по видеосвязи</span></li>
            <li style="display:flex;gap:8px;font-size:0.9rem;">${getIcon('check')} <span>Продолжительность сессии: 60–90 минут (или 2 часа)</span></li>
          </ul>
          <button class="btn btn-primary" style="width:100%;" data-open-modal data-service="Индивидуальная консультация">
            Записаться индивидуально
          </button>
        </div>

        <div style="background:var(--color-slate-50);padding:36px;border-radius:var(--radius-xl);border:1px solid var(--color-slate-200);">
          <div class="audience-icon">${getIcon('award')}</div>
          <h3 style="font-size:1.4rem;font-weight:700;color:var(--color-slate-900);margin-bottom:12px;">Групповые занятия и тренинги</h3>
          <p style="font-size:0.95rem;color:var(--color-slate-600);line-height:1.6;margin-bottom:16px;">
            Отличный формат для школьников и подростков, чтобы обмениваться опытом и погружаться в мир профессий:
          </p>
          <ul style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
            <li style="display:flex;gap:8px;font-size:0.9rem;">${getIcon('check')} <span>Профориентационные деловые игры и квесты</span></li>
            <li style="display:flex;gap:8px;font-size:0.9rem;">${getIcon('check')} <span>Развитие ключевых Soft Skills: коммуникация, командная работа</span></li>
            <li style="display:flex;gap:8px;font-size:0.9rem;">${getIcon('check')} <span>Доступная групповая стоимость от 1 000 ₽ с участника</span></li>
          </ul>
          <button class="btn btn-outline" style="width:100%;" data-open-modal data-service="Групповой тренинг">
            Узнать расписание групп
          </button>
        </div>
      </div>

      <!-- Pricing Block -->
      <div class="section-alt" style="padding:48px;border-radius:var(--radius-xl);margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:12px;text-align:center;">
          Стоимость услуг профориентолога
        </h2>
        <p style="text-align:center;color:var(--color-slate-600);margin-bottom:36px;">
          Инвестиция в профессиональное будущее, которая окупается с первых месяцев работы
        </p>
        <div class="services-grid">
          <div class="service-card">
            <h3 class="service-title">Экспресс-диагностика</h3>
            <p class="service-desc">Одна сессия для разбора конкретного точечного вопроса (выбор между 2 ВУЗами или профессиями).</p>
            <div class="service-price-box">
              <div class="service-price-value">3 500 ₽</div>
              <div class="service-price-period">сессия 60 минут</div>
            </div>
            <button class="btn btn-outline" style="width:100%;" data-open-modal data-service="Экспресс-диагностика">Выбрать тариф</button>
          </div>

          <div class="service-card featured">
            <span class="service-ribbon">Оптимум</span>
            <h3 class="service-title">Комплексная программа</h3>
            <p class="service-desc">Полный цикл профориентации: 2 сессии, батарея тестов, карта ВУЗов и совместная встреча с родителями.</p>
            <div class="service-price-box">
              <div class="service-price-value">6 500 ₽</div>
              <div class="service-price-period">за весь курс под ключ</div>
            </div>
            <button class="btn btn-primary" style="width:100%;" data-open-modal data-service="Комплексная программа">Выбрать тариф</button>
          </div>

          <div class="service-card">
            <h3 class="service-title">Премиум-сопровождение</h3>
            <p class="service-desc">Индивидуальное ведение абитуриента до момента приказа о зачислении в ВУЗ.</p>
            <div class="service-price-box">
              <div class="service-price-value">12 000 ₽</div>
              <div class="service-price-period">сопровождение 3 месяца</div>
            </div>
            <button class="btn btn-outline" style="width:100%;" data-open-modal data-service="Премиум-сопровождение">Выбрать тариф</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render "Test" page
function renderTestPage(page, settings) {
  return `
    <div class="container section">
      <div class="section-header">
        <span class="section-badge">Онлайн-диагностика</span>
        <h1 class="section-title">Тест на профориентацию онлайн: какая профессия вам подходит?</h1>
        <p class="section-desc">
          Научно обоснованная методика на основе классификаций Е.А. Климова и Дж. Холланда. 10 вопросов помогут определить ведущий тип мышления, сильные стороны и сферы реализации.
        </p>
      </div>

      <!-- Quiz Widget -->
      <div class="quiz-container" id="interactiveQuiz">
        <!-- Question Screen -->
        <div id="quizQuestionBox">
          <div class="quiz-header">
            <div class="quiz-progress-bar-wrap">
              <div class="quiz-progress-bar" id="quizProgressBar"></div>
            </div>
            <div class="quiz-step-info">
              <span id="quizStepText">Вопрос 1 из 10</span>
              <span>Экспресс-тест</span>
            </div>
          </div>

          <h2 class="quiz-question-text" id="quizQuestionText">
            Загрузка вопроса...
          </h2>

          <div class="quiz-options-list" id="quizOptionsList">
            <!-- Rendered by JS -->
          </div>

          <div class="quiz-actions">
            <button class="btn btn-outline btn-sm" id="quizPrevBtn" style="display:none;">
              ← Назад
            </button>
            <button class="btn btn-primary" id="quizNextBtn" disabled>
              Следующий вопрос →
            </button>
          </div>
        </div>

        <!-- Result Screen -->
        <div class="quiz-result-box" id="quizResultBox">
          <span class="result-badge" id="resBadge">Ваш ведущий профиль</span>
          <h2 class="result-title" id="resTitle">Определение профиля...</h2>
          <p class="result-summary" id="resSummary"></p>

          <div class="result-bars-grid" id="resBarsContainer">
            <!-- Rendered bars -->
          </div>

          <div class="professions-recommend-box">
            <h4>Рекомендуемые современные профессии:</h4>
            <div class="professions-tags" id="resProfList"></div>
          </div>

          <div style="background:var(--color-slate-50);padding:20px;border-radius:var(--radius-md);margin-bottom:28px;">
            <div style="font-weight:700;color:var(--color-slate-900);margin-bottom:6px;">Совет эксперта:</div>
            <p id="resTips" style="font-size:0.92rem;color:var(--color-slate-700);line-height:1.5;"></p>
          </div>

          <!-- Lead capture form inside result -->
          <div class="form-card" style="border:1px solid var(--color-slate-200);box-shadow:none;padding:28px;background:var(--color-primary-subtle);">
            <h3 style="font-size:1.3rem;font-weight:800;color:var(--color-slate-900);margin-bottom:6px;">
              Хотите персональный разбор результатов от Марины Бондаревой?
            </h3>
            <p style="font-size:0.88rem;color:var(--color-slate-600);margin-bottom:18px;">
              Оставьте контактные данные: Марина бесплатно проанализирует ваши баллы и пришлет персональные рекомендации по ВУЗам и предметам экзаменов.
            </p>
            <form data-ajax-form>
              <input type="hidden" name="formType" value="test_results">
              <input type="hidden" name="testSummary" id="testResultSummaryInput" value="">
              <div class="form-alert"></div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <input class="form-input" type="text" name="name" required placeholder="Ваше имя">
                <input class="form-input" type="tel" name="phone" required placeholder="+7 (___) ___-__-__">
              </div>

              <label class="form-checkbox-label">
                <input type="checkbox" required checked>
                <span>Согласен на обработку данных по <a href="/privacy/" target="_blank">Политике конфиденциальности</a></span>
              </label>

              <button class="btn btn-primary" type="submit" style="width:100%;">
                Получить персональный разбор результатов
              </button>
            </form>
          </div>

          <div style="text-align:center;margin-top:24px;">
            <button class="btn btn-outline btn-sm" id="quizRetakeBtn">
              Пройти тест заново
            </button>
          </div>
        </div>
      </div>

      <!-- Test Guide & FAQ -->
      <div style="max-width:840px;margin:56px auto 0;">
        <h3 style="font-size:1.6rem;font-weight:800;color:var(--color-slate-900);margin-bottom:16px;">
          Как работает авторский профориентационный тест
        </h3>
        <p style="color:var(--color-slate-600);line-height:1.7;margin-bottom:18px;">
          Тест оценивает направленность интересов по 5 ключевым векторам взаимодействия человека с окружающим миром: люди (коммуникация), техника (механизмы и алгоритмы), знаковые системы (цифры и анализ), художественные образы (творчество и визуал) и живая природа.
        </p>
        <p style="color:var(--color-slate-600);line-height:1.7;margin-bottom:18px;">
          Важно помнить, что любой онлайн-тест дает первичную диагностическую гипотезу. Чтобы превратить эти данные в уверенную жизненную траекторию, рекомендуется обсудить результаты на индивидуальной сессии с профориентологом.
        </p>
      </div>
    </div>
    <script src="/js/test.js"></script>
  `;
}

// Render "Services Hub" page
function renderServicesHubPage(page, settings) {
  return `
    <div class="container section">
      <div class="section-header">
        <span class="section-badge">Каталог услуг</span>
        <h1 class="section-title">Услуги и цены по профориентации</h1>
        <p class="section-desc">Полный спектр профессиональных консультаций для школьников, абитуриентов, студентов и взрослых специалистов</p>
      </div>

      <div class="services-grid" style="margin-bottom:56px;">
        <!-- Service 1 -->
        <div class="service-card featured">
          <span class="service-ribbon">Для школы</span>
          <div class="service-icon">${getIcon('compass')}</div>
          <h3 class="service-title">Профориентация подростков (8–11 классы)</h3>
          <p class="service-desc">Выбор будущей профессии, профильного класса, предметов ОГЭ/ЕГЭ и подбор 3–5 целевых ВУЗов или колледжей.</p>
          <div class="service-price-box">
            <div class="service-price-value">от 4 500 ₽</div>
            <div class="service-price-period">2 консультации + диагностика + отчет</div>
          </div>
          <div class="service-features">
            <div class="service-feature-item">${getIcon('check')} <span>Тестирование способностей и склонностей</span></div>
            <div class="service-feature-item">${getIcon('check')} <span>Анализ проходных баллов в ВУЗы РФ</span></div>
            <div class="service-feature-item">${getIcon('check')} <span>Совместная консультация с родителями</span></div>
          </div>
          <div class="service-card-actions">
            <a class="btn btn-primary" href="/proforientaciya-dlya-podrostkov/">Подробнее о программе</a>
            <button class="btn btn-outline btn-sm" data-open-modal data-service="Профориентация подростков">Записаться</button>
          </div>
        </div>

        <!-- Service 2 -->
        <div class="service-card">
          <div class="service-icon">${getIcon('award')}</div>
          <h3 class="service-title">Профориентация для взрослых</h3>
          <p class="service-desc">Для тех, кто чувствует выгорание, хочет сменить сферу деятельности, найти свое истинное призвание или вырасти в доходе.</p>
          <div class="service-price-box">
            <div class="service-price-value">от 5 000 ₽</div>
            <div class="service-price-period">интенсивная сессия (90-120 мин)</div>
          </div>
          <div class="service-features">
            <div class="service-feature-item">${getIcon('check')} <span>Аудит компетенций и накопленного опыта</span></div>
            <div class="service-feature-item">${getIcon('check')} <span>Мягкий карьерный переход без увольнения в никуда</span></div>
            <div class="service-feature-item">${getIcon('check')} <span>Подбор курсов и программ переподготовки</span></div>
          </div>
          <div class="service-card-actions">
            <a class="btn btn-primary" href="/proforientaciya-dlya-vzroslyh/">Подробнее о программе</a>
            <button class="btn btn-outline btn-sm" data-open-modal data-service="Профориентация взрослых">Записаться</button>
          </div>
        </div>

        <!-- Service 3 -->
        <div class="service-card">
          <div class="service-icon">${getIcon('phone')}</div>
          <h3 class="service-title">Карьерное консультирование</h3>
          <p class="service-desc">Создание продающего резюме, подготовка к сложным собеседованиям, стратегический план карьерного продвижения.</p>
          <div class="service-price-box">
            <div class="service-price-value">от 3 500 ₽</div>
            <div class="service-price-period">сессия 60–90 минут</div>
          </div>
          <div class="service-features">
            <div class="service-feature-item">${getIcon('check')} <span>Аудит резюме и профиля HeadHunter/LinkedIn</span></div>
            <div class="service-feature-item">${getIcon('check')} <span>Тренинг самопрезентации (Mock Interview)</span></div>
            <div class="service-feature-item">${getIcon('check')} <span>Переговоры о повышении зарплаты</span></div>
          </div>
          <div class="service-card-actions">
            <a class="btn btn-primary" href="/karernoe-konsultirovanie/">Подробнее о программе</a>
            <button class="btn btn-outline btn-sm" data-open-modal data-service="Карьерное консультирование">Записаться</button>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div style="max-width:860px;margin:0 auto 56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:28px;text-align:center;">
          Частые вопросы по услугам
        </h2>
        <div class="faq-wrap">
          <div class="faq-item active">
            <button class="faq-question" type="button">
              <span>Сколько стоит услуга профориентолога?</span>
              <span class="faq-icon">${getIcon('chevronDown')}</span>
            </button>
            <div class="faq-answer">
              <p>Стоимость зависит от формата: разовые сессии от 3 500 ₽, комплексные программы с подбором ВУЗа от 4 500 до 6 500 ₽. Мы предлагаем различные пакеты, чтобы каждый мог подобрать оптимальный вариант под свой бюджет.</p>
            </div>
          </div>
          <div class="faq-item">
            <button class="faq-question" type="button">
              <span>Что включает в себя программа профориентации?</span>
              <span class="faq-icon">${getIcon('chevronDown')}</span>
            </button>
            <div class="faq-answer">
              <p>Диагностику интересов и склонностей, персональные беседы, анализ рынка труда, подбор учебных заведений, формирование дорожной карты и постоянную поддержку на период поступления.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render "Teens" page
function renderTeensPage(page, settings) {
  return `
    <div class="container section">
      <div class="about-preview-grid" style="margin-bottom:56px;">
        <div>
          <span class="section-badge">Для старшеклассников 14–17 лет</span>
          <h1 class="section-title">Профориентация для школьников и подростков</h1>
          <p style="font-size:1.1rem;line-height:1.6;color:var(--color-slate-700);margin-bottom:18px;">
            Помогу вашему ребенку сделать осознанный выбор профессии, определить профильный класс, выбрать предметы для ОГЭ/ЕГЭ и поступить в ВУЗ мечты без стресса и семейных ссор.
          </p>
          <div class="hero-bullets" style="margin-bottom:24px;">
            <div class="hero-bullet-item">${getIcon('check')} <span>Определение склонностей: гуманитарные, технические, IT, естественно-научные</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Составление списка из 3–5 конкретных ВУЗов или колледжей с проходными баллами</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Мотивация к учебе: ребенок четко понимает, зачем он сдает экзамены</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Совместная консультация с родителями по итогам диагностики</span></div>
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-lg" data-open-modal data-service="Профориентация школьников (8-11 класс)">
              Записать подростка
            </button>
            <a class="btn btn-accent btn-lg" href="/test/">
              Пройти тест онлайн
            </a>
          </div>
        </div>
        <div class="about-preview-image">
          <img src="/images/proforientation-teens.jpg" alt="Профориентация подростков Марина Бондарева" style="height:480px;">
        </div>
      </div>

      <!-- Why important for teens -->
      <div class="section-alt" style="padding:48px;border-radius:var(--radius-xl);margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:24px;text-align:center;">
          Почему профориентация критически важна в 8–11 классах?
        </h2>
        <div class="audience-grid">
          <div class="audience-card">
            <h3 class="audience-title">Экономия времени и денег</h3>
            <p class="audience-text">Ошибочное поступление не на ту специальность оборачивается потерей 4–6 лет и сотен тысяч рублей на репетиторов и платное обучение.</p>
          </div>
          <div class="audience-card">
            <h3 class="audience-title">Снижение тревожности</h3>
            <p class="audience-text">Когда у подростка есть четкая цель, страх перед ЕГЭ сменяется спокойной планомерной подготовкой к конкретным предметам.</p>
          </div>
          <div class="audience-card">
            <h3 class="audience-title">Гармония в семье</h3>
            <p class="audience-text">Независимый эксперт помогает снять конфликт поколений и найти компромисс между желаниями ребенка и ожиданиями родителей.</p>
          </div>
        </div>
      </div>

      <!-- Program Tariffs for Teens -->
      <div style="margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:32px;text-align:center;">
          Тарифы для школьников
        </h2>
        <div class="services-grid">
          <div class="service-card">
            <h3 class="service-title">«Ориентир» (8–9 класс)</h3>
            <p class="service-desc">Выбор профиля в 10 классе или поступление в колледж после 9 класса.</p>
            <div class="service-price-box">
              <div class="service-price-value">4 500 ₽</div>
            </div>
            <button class="btn btn-outline" style="width:100%;" data-open-modal data-service="Тариф Ориентир (8-9 класс)">Записаться</button>
          </div>

          <div class="service-card featured">
            <span class="service-ribbon">Хит</span>
            <h3 class="service-title">«ВУЗ и Карьера» (10–11 класс)</h3>
            <p class="service-desc">Глубокая профориентация, подбор ВУЗов, выбор предметов ЕГЭ и стратегия поступления.</p>
            <div class="service-price-box">
              <div class="service-price-value">6 500 ₽</div>
            </div>
            <button class="btn btn-primary" style="width:100%;" data-open-modal data-service="Тариф ВУЗ и Карьера (10-11 класс)">Записаться</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render "Adults" page
function renderAdultsPage(page, settings) {
  return `
    <div class="container section">
      <div class="about-preview-grid" style="margin-bottom:56px;">
        <div>
          <span class="section-badge">Для взрослых 18–50+ лет</span>
          <h1 class="section-title">Профориентация для взрослых: найти призвание и сменить профессию</h1>
          <p style="font-size:1.1rem;line-height:1.6;color:var(--color-slate-700);margin-bottom:18px;">
            Профессиональная ориентация для взрослых — это безопасный способ переосмыслить свой карьерный путь, преодолеть выгорание и найти работу, которая приносит и эмоциональное удовлетворение, и высокий доход.
          </p>
          <div class="hero-bullets" style="margin-bottom:24px;">
            <div class="hero-bullet-item">${getIcon('check')} <span>Выявление скрытых талантов и сильных сторон на основе вашего жизненного опыта</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Преодоление профессионального выгорания и синдрома самозванца</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Стратегия плавного перехода без потери финансовой стабильности семьи</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Анализ востребованности и зарплат в новых отраслях</span></div>
          </div>
          <button class="btn btn-primary btn-lg" data-open-modal data-service="Профориентация для взрослых">
            Записаться на сессию
          </button>
        </div>
        <div class="about-preview-image">
          <img src="/images/proforientation-adults.jpg" alt="Профориентация для взрослых Марина Бондарева" style="height:480px;">
        </div>
      </div>

      <!-- Scenarios for adults -->
      <div class="section-alt" style="padding:48px;border-radius:var(--radius-xl);margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:24px;text-align:center;">
          В каких ситуациях я могу помочь взрослому человеку?
        </h2>
        <div class="audience-grid">
          <div class="audience-card">
            <h3 class="audience-title">«Достиг потолка»</h3>
            <p class="audience-text">Работа перестала вдохновлять, карьерный рост остановился, доход не растет уже несколько лет. Помогу найти вектор масштабирования.</p>
          </div>
          <div class="audience-card">
            <h3 class="audience-title">Эмоциональное выгорание</h3>
            <p class="audience-text">Хроническая усталость, стресс и нежелание просыпаться по понедельникам. Проанализируем причины и подберем комфортную сферу.</p>
          </div>
          <div class="audience-card">
            <h3 class="audience-title">Выход из декрета / паузы</h3>
            <p class="audience-text">Перерыв в карьере, страх отстать от рынка. Поможем упаковать навыки, актуализировать портфолио и уверенно выйти на рынок.</p>
          </div>
          <div class="audience-card">
            <h3 class="audience-title">Старт своего дела / фриланс</h3>
            <p class="audience-text">Переход из найма в частную практику или предпринимательство. Оценим риски и определим монетизируемые экспертные ниши.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render "Career Consulting" page
function renderCareerPage(page, settings) {
  return `
    <div class="container section">
      <div class="about-preview-grid" style="margin-bottom:56px;">
        <div>
          <span class="section-badge">Карьерный коучинг</span>
          <h1 class="section-title">Карьерное консультирование в Орле и Онлайн</h1>
          <p style="font-size:1.1rem;line-height:1.6;color:var(--color-slate-700);margin-bottom:18px;">
            Персональная упаковка вашего экспертного опыта для быстрого карьерного роста, выхода на руководящие позиции и уверенного прохождения собеседований.
          </p>
          <div class="hero-bullets" style="margin-bottom:24px;">
            <div class="hero-bullet-item">${getIcon('check')} <span>Аудит резюме: переписываем обязанности в оцифрованные бизнес-достижения</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Mock Interview: тренировка ответов на неудобные вопросы рекрутеров</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Стратегия поиска скрытых вакансий через нетворкинг и LinkedIn</span></div>
            <div class="hero-bullet-item">${getIcon('check')} <span>Тактика переговоров о зарплате (+30–50% к текущему доходу)</span></div>
          </div>
          <button class="btn btn-primary btn-lg" data-open-modal data-service="Карьерное консультирование">
            Заказать карьерный аудит
          </button>
        </div>
        <div class="about-preview-image">
          <img src="/images/career-consulting.jpg" alt="Карьерная консультация с Мариной Бондаревой" style="height:480px;">
        </div>
      </div>

      <div class="section-alt" style="padding:48px;border-radius:var(--radius-xl);margin-bottom:56px;">
        <h2 style="font-size:1.85rem;font-weight:800;color:var(--color-slate-900);margin-bottom:28px;text-align:center;">
          Что мы делаем на карьерной сессии
        </h2>
        <div class="stages-grid">
          <div class="stage-card">
            <span class="stage-number">01</span>
            <h3 class="stage-title">Глубокий аудит опыта</h3>
            <p class="stage-text">Инвентаризируем все ваши Hard & Soft Skills, ключевые кейсы и результаты за последние 3–5 лет работы.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">02</span>
            <h3 class="stage-title">Продающее резюме</h3>
            <p class="stage-text">Формируем резюме по международному стандарту с конверсией в приглашения на интервью выше 40%.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">03</span>
            <h3 class="stage-title">Подготовка к интервью</h3>
            <p class="stage-text">Отрабатываем самопрезентацию по формуле STAR и учимся уверенно аргументировать желаемый уровень дохода.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render "Cases" page
function renderCasesPage(page, settings, cases) {
  const caseCardsHtml = cases.map(c => `
    <div class="audience-card case-item-card" data-category="${c.category}" style="display:flex;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span class="section-badge" style="margin-bottom:0;">${c.categoryLabel}</span>
        <span style="font-size:0.82rem;color:var(--color-slate-500);font-weight:600;">${c.client}</span>
      </div>
      <h3 style="font-size:1.3rem;font-weight:700;color:var(--color-slate-900);margin-bottom:14px;line-height:1.35;">
        ${c.title}
      </h3>
      <div style="background:var(--color-slate-50);padding:14px;border-radius:var(--radius-md);margin-bottom:12px;font-size:0.9rem;">
        <strong>Запрос:</strong> ${c.request}
      </div>
      <div style="font-size:0.92rem;color:var(--color-slate-600);line-height:1.55;margin-bottom:12px;">
        <strong>Что сделали:</strong> ${c.process}
      </div>
      <div style="font-size:0.92rem;color:var(--color-primary-dark);line-height:1.55;margin-bottom:16px;">
        <strong>Результат:</strong> ${c.result}
      </div>
      <div class="quote-box" style="margin:0 0 16px;">
        «${c.quote}»
      </div>
      <div style="font-size:0.78rem;color:var(--color-slate-500);text-align:right;">— ${c.author}</div>
    </div>
  `).join('');

  return `
    <div class="container section">
      <div class="section-header">
        <span class="section-badge">Реальные истории</span>
        <h1 class="section-title">Кейсы клиентов и истории успеха</h1>
        <p class="section-desc">Познакомьтесь с реальными примерами выбора профессии, поступления в ВУЗы и успешной смены карьеры</p>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:36px;flex-wrap:wrap;">
        <button class="btn btn-outline case-tab-btn active" data-filter="all">Все кейсы</button>
        <button class="btn btn-outline case-tab-btn" data-filter="teens">Подростки и школьники</button>
        <button class="btn btn-outline case-tab-btn" data-filter="adults">Взрослые</button>
        <button class="btn btn-outline case-tab-btn" data-filter="career">Карьерный рост</button>
      </div>

      <div style="max-width:900px;margin:0 auto 56px;">
        ${caseCardsHtml}
      </div>

      <div style="text-align:center;background:var(--color-slate-50);padding:40px;border-radius:var(--radius-xl);border:1px solid var(--color-slate-200);">
        <h3 style="font-size:1.6rem;font-weight:800;color:var(--color-slate-900);margin-bottom:10px;">Хотите разобрать вашу ситуацию?</h3>
        <p style="color:var(--color-slate-600);margin-bottom:20px;">Запишитесь на первичную консультацию — вместе мы найдем лучшее решение для вашего будущего.</p>
        <button class="btn btn-primary btn-lg" data-open-modal data-service="Разбор моей ситуации">
          Оставить заявку на разбор
        </button>
      </div>
    </div>
  `;
}

// Render "Blog Hub" page
function renderBlogPage(page, settings, blogPosts) {
  const postsHtml = blogPosts.map(p => `
    <div class="blog-card">
      <div class="blog-card-image">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <span class="blog-card-category">${p.category}</span>
      </div>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span>${p.date}</span>
          <span>•</span>
          <span>${p.readTime} чтения</span>
        </div>
        <h3 class="blog-card-title">
          <a href="/blog/${p.slug}/">${p.title}</a>
        </h3>
        <p class="blog-card-excerpt">${p.excerpt}</p>
        <a class="blog-card-link" href="/blog/${p.slug}/">
          Читать статью полностью ${getIcon('arrowRight')}
        </a>
      </div>
    </div>
  `).join('');

  return `
    <div class="container section">
      <div class="section-header">
        <span class="section-badge">Полезная информация</span>
        <h1 class="section-title">Блог о профориентации и выборе профессии</h1>
        <p class="section-desc">Актуальные статьи о рынке труда, профессиях будущего, подготовке к экзаменам и советах для родителей</p>
      </div>

      <div class="blog-grid" style="margin-bottom:56px;">
        ${postsHtml}
      </div>

      <!-- Downloadable Material Teaser -->
      <div style="background:linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);color:#fff;padding:40px;border-radius:var(--radius-xl);display:grid;grid-template-columns:1.2fr 0.8fr;align-items:center;gap:32px;">
        <div>
          <span style="font-size:0.8rem;font-weight:700;color:var(--color-accent-light);text-transform:uppercase;">Бесплатный материал</span>
          <h3 style="font-size:1.6rem;font-weight:800;color:#fff;margin:8px 0 12px;">Чек-лист: 7 шагов к осознанному выбору профессии</h3>
          <p style="color:var(--color-slate-200);font-size:0.95rem;line-height:1.55;">Пошаговая инструкция для родителей и школьников, которая убережет от распространенных ошибок при поступлении.</p>
        </div>
        <div style="text-align:center;">
          <button class="btn btn-accent btn-lg" data-open-modal data-service="Чек-лист 7 шагов">
            Получить чек-лист бесплатно
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render "Single Article" page
function renderArticlePage(article, settings, relatedPosts) {
  const relatedHtml = (relatedPosts || []).slice(0, 3).map(p => `
    <div class="blog-card">
      <div class="blog-card-image" style="height:160px;">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <span class="blog-card-category">${p.category}</span>
      </div>
      <div class="blog-card-body" style="padding:18px;">
        <h4 style="font-size:1.02rem;font-weight:700;line-height:1.3;margin-bottom:8px;">
          <a href="/blog/${p.slug}/">${p.title}</a>
        </h4>
        <a class="blog-card-link" href="/blog/${p.slug}/" style="font-size:0.82rem;">Читать далее ${getIcon('arrowRight')}</a>
      </div>
    </div>
  `).join('');

  return `
    <div class="container section">
      <div class="article-header">
        <span class="section-badge">${article.category}</span>
        <h1 style="font-size:2.35rem;font-weight:800;color:var(--color-slate-900);line-height:1.25;margin:12px 0 16px;">
          ${article.title}
        </h1>
        <div class="article-meta">
          <span>Автор: Марина Бондарева</span>
          <span>•</span>
          <span>Дата: ${article.date}</span>
          <span>•</span>
          <span>Время чтения: ${article.readTime}</span>
        </div>
      </div>

      <div style="max-width:860px;margin:0 auto 36px;border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-md);">
        <img src="${article.image}" alt="${article.title}" style="width:100%;height:420px;object-fit:cover;">
      </div>

      <div class="article-content">
        ${article.content}
      </div>

      <!-- Author Box inside article -->
      <div style="max-width:820px;margin:48px auto;background:var(--color-slate-50);border:1px solid var(--color-slate-200);border-radius:var(--radius-lg);padding:24px;display:flex;align-items:center;gap:20px;">
        <img src="/images/marina-bondareva-hero.jpg" alt="Марина Бондарева" style="width:72px;height:72px;border-radius:50%;object-fit:cover;flex-shrink:0;">
        <div>
          <div style="font-weight:700;color:var(--color-slate-900);font-size:1.05rem;">Марина Бондарева</div>
          <div style="font-size:0.82rem;color:var(--color-slate-500);margin-bottom:6px;">Эксперт-профориентолог, карьерный консультант</div>
          <p style="font-size:0.88rem;color:var(--color-slate-600);line-height:1.5;">
            Помогаю подросткам и взрослым находить свое призвание. Хотите разобрать ваш профессиональный выбор? <a href="#" data-open-modal data-service="Запись из статьи ${article.title}">Запишитесь на бесплатную вводную консультацию</a>.
          </p>
        </div>
      </div>

      <!-- Related Posts -->
      <div style="margin-top:56px;padding-top:40px;border-top:1px solid var(--color-slate-200);">
        <h3 style="font-size:1.5rem;font-weight:800;color:var(--color-slate-900);margin-bottom:24px;">Читайте также:</h3>
        <div class="blog-grid">
          ${relatedHtml}
        </div>
      </div>
    </div>
  `;
}

// Render "Contacts" page
function renderContactsPage(page, settings) {
  return `
    <div class="container section">
      <div class="section-header">
        <span class="section-badge">Связь со мной</span>
        <h1 class="section-title">Контакты профориентолога Марины Бондаревой</h1>
        <p class="section-desc">Очные консультации в Орле и онлайн-сессии по всей России и миру</p>
      </div>

      <div class="audience-grid" style="margin-bottom:48px;">
        <div class="audience-card">
          <div class="audience-icon">${getIcon('phone')}</div>
          <h3 class="audience-title">Телефон для записи</h3>
          <p class="audience-text">
            <a href="tel:${settings.contacts.phoneRaw}" style="font-size:1.2rem;font-weight:700;color:var(--color-primary);">${settings.contacts.phone}</a><br>
            Второй: <a href="tel:+79102028572" style="color:var(--color-slate-700);">+7 (910) 202-85-72</a>
          </p>
          <span style="font-size:0.8rem;color:var(--color-slate-500);">Звонки принимаются в рабочее время</span>
        </div>

        <div class="audience-card">
          <div class="audience-icon">${getIcon('clock')}</div>
          <h3 class="audience-title">График работы</h3>
          <p class="audience-text" style="font-size:1.05rem;font-weight:600;color:var(--color-slate-800);">
            ${settings.contacts.workHours}
          </p>
          <span style="font-size:0.8rem;color:var(--color-slate-500);">Прием по предварительной записи</span>
        </div>

        <div class="audience-card">
          <div class="audience-icon">${getIcon('mail')}</div>
          <h3 class="audience-title">Электронная почта</h3>
          <p class="audience-text">
            <a href="mailto:${settings.contacts.email}" style="font-size:1.1rem;font-weight:700;color:var(--color-primary);">${settings.contacts.email}</a>
          </p>
          <span style="font-size:0.8rem;color:var(--color-slate-500);">Для вопросов и отправки документов</span>
        </div>

        <div class="audience-card">
          <div class="audience-icon">${getIcon('mapPin')}</div>
          <h3 class="audience-title">Адрес кабинета</h3>
          <p class="audience-text" style="font-weight:600;color:var(--color-slate-800);">
            ${settings.contacts.address}
          </p>
          <span style="font-size:0.8rem;color:var(--color-slate-500);">г. Орёл, Заводской район</span>
        </div>
      </div>

      <!-- Messengers and Map -->
      <div class="about-preview-grid" style="margin-bottom:56px;">
        <div class="form-card" style="box-shadow:var(--shadow-md);border:1px solid var(--color-slate-200);">
          <h3 class="form-title">Напишите мне</h3>
          <p class="form-sub">Задайте вопрос или запишитесь на удобный день</p>
          <form data-ajax-form>
            <input type="hidden" name="formType" value="contacts_message">
            <div class="form-alert"></div>

            <div class="form-group">
              <label class="form-label">Ваше имя *</label>
              <input class="form-input" type="text" name="name" required placeholder="Имя">
            </div>

            <div class="form-group">
              <label class="form-label">Телефон *</label>
              <input class="form-input" type="tel" name="phone" required placeholder="+7 (___) ___-__-__">
            </div>

            <div class="form-group">
              <label class="form-label">Ваш вопрос или сообщение</label>
              <textarea class="form-textarea" name="message" placeholder="Напишите, какой вопрос вас интересует..."></textarea>
            </div>

            <label class="form-checkbox-label">
              <input type="checkbox" required checked>
              <span>Согласен на обработку данных по <a href="/privacy/" target="_blank">Политике</a></span>
            </label>

            <button class="btn btn-primary btn-lg" type="submit" style="width:100%;">
              Отправить сообщение
            </button>
          </form>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--color-slate-100);text-align:center;">
            <div style="font-size:0.86rem;font-weight:600;color:var(--color-slate-700);margin-bottom:10px;">Быстрая связь в мессенджерах:</div>
            <div class="social-links" style="justify-content:center;">
              <a class="btn btn-outline btn-sm" href="${settings.contacts.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
              <a class="btn btn-outline btn-sm" href="${settings.contacts.telegram}" target="_blank" rel="noopener">Telegram</a>
              <a class="btn btn-outline btn-sm" href="${settings.contacts.vk}" target="_blank" rel="noopener">ВКонтакте</a>
            </div>
          </div>
        </div>

        <!-- Interactive Yandex Map embed -->
        <div style="border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-md);border:1px solid var(--color-slate-200);height:480px;position:relative;">
          <iframe 
            src="https://yandex.ru/map-widget/v1/?ll=36.038446%2C52.934125&z=16&pt=36.038446,52.934125,pm2rdm" 
            width="100%" 
            height="100%" 
            frameborder="0" 
            allowfullscreen="true" 
            title="Офис профориентолога Марины Бондаревой в Орле">
          </iframe>
        </div>
      </div>
    </div>
  `;
}

// Render "Privacy Policy" page
function renderPrivacyPage(page, settings) {
  return `
    <div class="container section" style="max-width:900px;">
      <h1 class="section-title" style="margin-bottom:24px;">Политика конфиденциальности и обработки персональных данных</h1>
      <div style="font-size:0.95rem;line-height:1.75;color:var(--color-slate-700);">
        <p>Настоящая Политика обработки персональных данных (далее — Политика) действует в отношении всей информации, которую сайт <strong>https://orientirprof.ru</strong> (далее — Сайт) может получить о Пользователе во время использования сайта.</p>
        
        <h3 style="font-size:1.25rem;font-weight:700;color:var(--color-slate-900);margin:24px 0 12px;">1. Общие положения</h3>
        <p>1.1. Использование Сайта Пользователем означает согласие с настоящей Политикой конфиденциальности и условиями обработки персональных данных Пользователя.</p>
        <p>1.2. Оператор персональных данных: Частный профориентолог Марина Бондарева (г. Орёл, ул. Комсомольская, 231, e-mail: sunvard@yandex.ru, тел: +7 903 029 34 34).</p>

        <h3 style="font-size:1.25rem;font-weight:700;color:var(--color-slate-900);margin:24px 0 12px;">2. Цели сбора персональной информации</h3>
        <p>2.1. Оператор обрабатывает персональные данные Пользователя исключительно в целях:</p>
        <ul>
          <li>Обработки входящих заявок на консультации, обратные звонки и запись на тестирование;</li>
          <li>Предоставления консультационных услуг в сфере профессиональной ориентации;</li>
          <li>Установления с Пользователем обратной связи, включая направление уведомлений, запросов;</li>
          <li>Улучшения качества обслуживания и аналитики посещаемости Сайта.</li>
        </ul>

        <h3 style="font-size:1.25rem;font-weight:700;color:var(--color-slate-900);margin:24px 0 12px;">3. Использование файлов Cookie</h3>
        <p>3.1. Сайт использует файлы cookie (куки) для сбора обезличенных данных о действиях посетителей в целях улучшения пользовательского опыта. Пользователь может отключить сохранение cookie в настройках своего браузера.</p>

        <h3 style="font-size:1.25rem;font-weight:700;color:var(--color-slate-900);margin:24px 0 12px;">4. Защита и актуализация данных</h3>
        <p>4.1. Оператор принимает необходимые организационные и технические меры для защиты персональных данных Пользователя от неправомерного доступа.</p>
        <p>4.2. Пользователь может в любой момент отозвать свое согласие либо запросить уточнение данных, направив письмо на электронную почту: <strong>sunvard@yandex.ru</strong> с пометкой «Актуализация персональных данных».</p>
      </div>
    </div>
  `;
}

module.exports = {
  renderAboutPage,
  renderConsultationPage,
  renderTestPage,
  renderServicesHubPage,
  renderTeensPage,
  renderAdultsPage,
  renderCareerPage,
  renderCasesPage,
  renderBlogPage,
  renderArticlePage,
  renderContactsPage,
  renderPrivacyPage
};
