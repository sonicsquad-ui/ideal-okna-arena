/**
 * ORIENTIRPROF.RU — Шаблоны контента страниц
 */

const { getIcon } = require('./renderer');

// FAQ Data with all questions specified by user
const homeFaq = [
  {
    q: "Что такое профориентация простыми словами?",
    a: "Профориентация — это система профессиональной помощи человеку в понимании своих талантов, сильных сторон и истинных интересов для осознанного выбора будущей профессии, профильного образования или новой сферы деятельности. Это не гадание, а научно обоснованная психологическая и аналитическая методика."
  },
  {
    q: "Как узнать, кем я хочу стать?",
    a: "Для этого необходимо исследовать пересечение трех факторов: 'Хочу' (ваши интересы и увлечения), 'Могу' (ваши способности, склад ума и таланты) и 'Надо' (востребованность на рынке труда и уровень зарплат). Квалифицированный профориентолог помогает объективно оценить все три составляющие и увидеть реальные профессии, где вы будете успешны."
  },
  {
    q: "Как проходит профориентация у школьников?",
    a: "Профориентация подростков состоит из 5–6 этапов: 1) Вводная беседа со школьником и родителями; 2) Комплексное тестирование на личностные и профессиональные склонности; 3) Глубокий индивидуальный разбор результатов; 4) Подбор направлений обучения, конкретных ВУЗов/колледжей и предметов ОГЭ/ЕГЭ; 5) Составление пошагового плана действий."
  },
  {
    q: "Сколько длится проф-ориентация?",
    a: "Длительность зависит от формата: экспресс-диагностика занимает 60–90 минут; комплексная индивидуальная программа включает 2–3 глубокие сессии по 1,5–2 часа с домашними заданиями и последующим сопровождением до поступления или выхода на работу."
  },
  {
    q: "С какого возраста лучше всего начинать профориентацию с детьми?",
    a: "Первичное знакомство с миром профессий и кружками полезно начинать с 12–13 лет (6–7 класс). Активную системную профориентацию для выбора профильного класса, предметов ОГЭ и ВУЗа оптимально проходить в 8–9 классах (14–15 лет) и закреплять в 10–11 классах."
  },
  {
    q: "Как проводится профориентация у детей?",
    a: "С детьми и младшими подростками используются игровые профориентационные методики, проективные упражнения и мягкие беседы. Задача — не зафиксировать профессию на всю жизнь, а расширить кругозор, выявить врожденные предрасположенности и развить интерес к созидательному труду."
  },
  {
    q: "Как определиться ребенку с профессией?",
    a: "Важно не навязывать нереализованные мечты родителей, а предоставить возможность пробовать разные направления: кружки, экскурсии, онлайн-тесты, профессиональные пробы и консультацию независимого эксперта-профориентолога, которому подросток сможет открыто довериться."
  },
  {
    q: "Какой тест на профориентацию можно сделать для детей?",
    a: "Наиболее надежными признаны методики Дж. Холланда, опросник Е.А. Климова (дифференциально-диагностический опросник ДДО), матрица выбора профессии Г. Резапкиной. На нашем сайте доступен онлайн экспресс-тест, сочетающий лучшие элементы этих подходов с мгновенным результатом."
  },
  {
    q: "Работаете ли вы онлайн?",
    a: "Да! Мы проводим онлайн-консультации для клиентов по всей России и миру через удобные каналы связи: Zoom, Telegram, WhatsApp. Дистанционный формат столь же эффективен, как и очная встреча в Орле."
  },
  {
    q: "Поздно ли менять профессию взрослому человеку?",
    a: "Сменить профессию не поздно ни в 30, ни в 40, ни в 50 лет! В современном мире концепция 'одна профессия на всю жизнь' устарела. Мы помогаем взрослым выявить переносимые навыки (transferable skills), преодолеть страх перемен и составить мягкий план перехода в новую сферу без потери в доходе."
  },
  {
    q: "Сколько стоит услуга профориентолога и что входит в стоимость?",
    a: "Разовая индивидуальная сессия стоит от 3 500 ₽, комплексный пакет сопровождения с подбором ВУЗов и карьерной картой — от 7 000 ₽. В стоимость входят тестирование, персональный психологический анализ, список подходящих профессий, подбор учебных заведений и подробная дорожная карта."
  }
];

// Certificates data
const certificates = [
  { img: "/images/certificate-1.jpg", title: "Диплом специалиста по профориентации и карьерному коучингу" },
  { img: "/images/certificate-2.jpg", title: "Сертификат аккредитации: современные методики диагностики подростков" },
  { img: "/images/certificate-3.jpg", title: "Удостоверение о повышении квалификации: Психология выбора профессии" },
  { img: "/images/certificate-4.jpg", title: "Благодарственное письмо за вклад в профориентацию молодежи" }
];

// Media mentions data
const mediaList = [
  { name: "Орловская ТПП", sub: "Торгово-промышленная палата", url: "https://orel.tpprf.ru" },
  { name: "ОГУ им. Тургенева", sub: "Опорный университет региона", url: "https://oreluniver.ru" },
  { name: "ПРО Женщин Орёл", sub: "Бизнес-сообщество экспертов", url: "#" },
  { name: "Первый областной", sub: "Региональный телеканал", url: "https://obl1.ru" },
  { name: "Единая Россия", sub: "Профориентационные проекты", url: "#" },
  { name: "Журнал Флагман", sub: "Деловое издание", url: "https://edition.tpprf.ru" }
];

// Reviews data
const reviewsList = [
  {
    name: "Елена Носова",
    role: "Клиент (34 года, смена сферы деятельности)",
    text: "Хочу выразить огромную благодарность Марине Бондаревой за профессиональную помощь в выборе профессии! Ее подход к профориентации оказался исключительно точным: Марина внимательно выслушала мои цели, помогла выявить скрытые сильные стороны и снять страх перемен. Благодаря ее поддержке я успешно перешла в сферу продуктовой аналитики!",
    stars: 5
  },
  {
    name: "Ольга М.",
    role: "Мама 14-летней школьницы (8 класс)",
    text: "Решение обратиться к Марине по поводу профориентации для моей дочери оказалось невероятно удачным! Мы не только определили перспективное направление будущей профессии и профильный класс, но и получили четкий план подготовки к ОГЭ. Дочь поверила в себя, в семье прекратились споры о будущем!",
    stars: 5
  },
  {
    name: "Дмитрий К.",
    role: "Студент 3 курса / молодой специалист",
    text: "Огромное спасибо Марине за консультацию по раскрытию потенциала! Общение было максимально комфортным и структурированным. Практические тесты дали ответы на все вопросы. После встречи появилась уверенность и четкое понимание, в какие IT-компании подавать резюме.",
    stars: 5
  }
];

function renderHomeContent(page, settings) {
  // Target Audience HTML
  const audienceHtml = `
    <section class="section section-alt" id="audience">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">С кем я работаю</span>
          <h2 class="section-title">Кому необходима помощь профориентолога</h2>
          <p class="section-desc">Индивидуальные программы профессионального самоопределения для любого возраста и жизненного этапа</p>
        </div>
        <div class="audience-grid">
          <div class="audience-card">
            <div class="audience-icon">${getIcon('award')}</div>
            <span class="audience-age">14–17 лет</span>
            <h3 class="audience-title">Подросткам и старшеклассникам</h3>
            <p class="audience-text">Помогу определиться со сферой деятельности, выбрать подходящие предметы ОГЭ/ЕГЭ, профильный класс и ТОП-5 ВУЗов или колледжей с высоким шансом поступления на бюджет.</p>
            <a class="audience-link" href="/proforientaciya-dlya-podrostkov/">Подробнее о программе ${getIcon('arrowRight')}</a>
          </div>

          <div class="audience-card">
            <div class="audience-icon">${getIcon('compass')}</div>
            <span class="audience-age">До 14 лет</span>
            <h3 class="audience-title">Школьникам и детям</h3>
            <p class="audience-text">В игровой увлекательной форме исследуем таланты, интересы и характер ребенка. Подберем развивающие кружки, секции и профильные направления обучения.</p>
            <a class="audience-link" href="/proforientaciya-dlya-podrostkov/">Подробнее для детей ${getIcon('arrowRight')}</a>
          </div>

          <div class="audience-card">
            <div class="audience-icon">${getIcon('star')}</div>
            <span class="audience-age">Студентам</span>
            <h3 class="audience-title">Студентам и выпускникам</h3>
            <p class="audience-text">Если учеба разочаровала или нет понимания, где применить диплом. Помогу скорректировать карьерный вектор, составить продающее резюме и найти первую работу.</p>
            <a class="audience-link" href="/karernoe-konsultirovanie/">Карьерный старт ${getIcon('arrowRight')}</a>
          </div>

          <div class="audience-card">
            <div class="audience-icon">${getIcon('phone')}</div>
            <span class="audience-age">18–50+ лет</span>
            <h3 class="audience-title">Взрослым специалистам</h3>
            <p class="audience-text">Профессиональное выгорание, желание сменить нелюбимую профессию, рост в доходах или открытие своего дела. Составим безопасный план перехода без потери дохода.</p>
            <a class="audience-link" href="/proforientaciya-dlya-vzroslyh/">Смена профессии ${getIcon('arrowRight')}</a>
          </div>
        </div>
      </div>
    </section>
  `;

  // About Preview HTML
  const aboutHtml = `
    <section class="section" id="about">
      <div class="container about-preview-grid">
        <div class="about-preview-image">
          <img src="/images/marina-about.jpg" alt="Марина Бондарева — профориентолог в Орле" loading="lazy">
        </div>
        <div class="about-preview-content">
          <span class="section-badge">О специалисте</span>
          <h2 class="section-title">Меня зовут Марина Бондарева</h2>
          <p style="font-size:1.05rem;line-height:1.6;color:var(--color-slate-600);margin-bottom:16px;">
            Я практикующий эксперт-профориентолог и карьерный консультант с опытом более 5 лет. Объединяю передовые педагогические методики и психологическую диагностику, помогая людям открывать свои подлинные способности.
          </p>
          <div class="quote-box">
            «Моя цель — помочь каждому клиенту сделать осознанный выбор дела жизни, подобрать оптимальное образование и реализовать потенциал на основе понятного и практичного плана действий».
          </div>
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-check">${getIcon('check')}</div>
              <span class="feature-label">Авторская методика на стыке коучинга и психологии</span>
            </div>
            <div class="feature-item">
              <div class="feature-check">${getIcon('check')}</div>
              <span class="feature-label">Глубокое знание современного рынка труда и ВУЗов РФ</span>
            </div>
            <div class="feature-item">
              <div class="feature-check">${getIcon('check')}</div>
              <span class="feature-label">Индивидуальный подход и строгая конфиденциальность</span>
            </div>
            <div class="feature-item">
              <div class="feature-check">${getIcon('check')}</div>
              <span class="feature-label">Более 500 успешных консультаций и счастливых семей</span>
            </div>
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;">
            <a class="btn btn-primary" href="/about/">Подробнее обо мне</a>
            <button class="btn btn-outline" data-open-modal data-service="Бесплатная первичная консультация">
              Записаться на консультацию
            </button>
          </div>
        </div>
      </div>
    </section>
  `;

  // Services Grid HTML
  const servicesHtml = `
    <section class="section section-alt" id="services">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Услуги и цены</span>
          <h2 class="section-title">Программы профориентации</h2>
          <p class="section-desc">Комплексные программы и разовые сессии для школьников, родителей и взрослых</p>
        </div>
        <div class="services-grid">
          <!-- Card 1 -->
          <div class="service-card featured">
            <span class="service-ribbon">Популярно</span>
            <div class="service-icon">${getIcon('compass')}</div>
            <h3 class="service-title">Профориентация подростков (8–11 класс)</h3>
            <p class="service-desc">Полный комплекс для старшеклассников: от выявления сильных сторон до выбора ВУЗа и экзаменов.</p>
            <div class="service-price-box">
              <div class="service-price-label">Стоимость программы</div>
              <div class="service-price-value">от 4 500 ₽</div>
              <div class="service-price-period">за полный цикл (2 сессии + отчет)</div>
            </div>
            <div class="service-features">
              <div class="service-feature-item">${getIcon('check')} <span>Глубокая психологическая диагностика</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Список из 5–7 подходящих профессий</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Подбор профильных ВУЗов и баллов ЕГЭ</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Совместная консультация с родителями</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Письменный отчет и дорожная карта</span></div>
            </div>
            <div class="service-card-actions">
              <button class="btn btn-primary" data-open-modal data-service="Профориентация подростков">Записаться</button>
              <a class="btn btn-outline btn-sm" href="/proforientaciya-dlya-podrostkov/">Подробнее об услуге</a>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="service-card">
            <div class="service-icon">${getIcon('award')}</div>
            <h3 class="service-title">Профориентация для взрослых</h3>
            <p class="service-desc">Переосмысление карьеры, выход из тупика и выгорания, поиск любимого дела с сохранением уровня жизни.</p>
            <div class="service-price-box">
              <div class="service-price-label">Стоимость программы</div>
              <div class="service-price-value">от 5 000 ₽</div>
              <div class="service-price-period">за углубленную сессию (90-120 мин)</div>
            </div>
            <div class="service-features">
              <div class="service-feature-item">${getIcon('check')} <span>Аудит компетенций (Hard & Soft Skills)</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Диагностика карьерных якорей</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Стратегия перехода в новую сферу</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Подбор программ переквалификации</span></div>
            </div>
            <div class="service-card-actions">
              <button class="btn btn-primary" data-open-modal data-service="Профориентация взрослых">Записаться</button>
              <a class="btn btn-outline btn-sm" href="/proforientaciya-dlya-vzroslyh/">Подробнее об услуге</a>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="service-card">
            <div class="service-icon">${getIcon('phone')}</div>
            <h3 class="service-title">Карьерное консультирование</h3>
            <p class="service-desc">Упаковка вашего опыта: продающее резюме, подготовка к собеседованию и переговоры о зарплате.</p>
            <div class="service-price-box">
              <div class="service-price-label">Стоимость услуги</div>
              <div class="service-price-value">от 3 500 ₽</div>
              <div class="service-price-period">за консультацию (60–90 мин)</div>
            </div>
            <div class="service-features">
              <div class="service-feature-item">${getIcon('check')} <span>Аудит и переработка резюме под ключ</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Симуляция собеседования (Mock Interview)</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Сопроводительное письмо работодателю</span></div>
              <div class="service-feature-item">${getIcon('check')} <span>Тактика переговоров о повышении дохода</span></div>
            </div>
            <div class="service-card-actions">
              <button class="btn btn-primary" data-open-modal data-service="Карьерное консультирование">Записаться</button>
              <a class="btn btn-outline btn-sm" href="/karernoe-konsultirovanie/">Подробнее об услуге</a>
            </div>
          </div>
        </div>

        <div style="text-align:center;margin-top:36px;">
          <a class="btn btn-outline btn-lg" href="/service-professional-orientation/">
            Смотреть все услуги и подробный прайс ${getIcon('arrowRight')}
          </a>
        </div>
      </div>
    </section>
  `;

  // Work Stages HTML
  const stagesHtml = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Пошаговый процесс</span>
          <h2 class="section-title">Этапы работы: Вместе к вашей идеальной профессии</h2>
          <p class="section-desc">Прозрачный и комфортный путь от первых сомнений к четкому плану будущего</p>
        </div>
        <div class="stages-grid">
          <div class="stage-card">
            <span class="stage-number">01</span>
            <h3 class="stage-title">Первичная консультация</h3>
            <p class="stage-text">Знакомимся (онлайн или очно в Орле), обсуждаем текущие переживания, цели и ожидания школьника и родителей.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">02</span>
            <h3 class="stage-title">Профориентационное тестирование</h3>
            <p class="stage-text">Используем современные научно валидированные опросники для объективной оценки склонностей и талантов.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">03</span>
            <h3 class="stage-title">Индивидуальный анализ</h3>
            <p class="stage-text">Подробно разбираем результаты, находим скрытые ресурсы и формируем пул наиболее подходящих направлений.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">04</span>
            <h3 class="stage-title">Выбор ВУЗа и предметов ЕГЭ</h3>
            <p class="stage-text">Анализируем проходные баллы, бюджетные места и подбираем целевые учебные заведения под выбранную профессию.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">05</span>
            <h3 class="stage-title">Сопровождение и поддержка</h3>
            <p class="stage-text">Остаемся на связи в WhatsApp/Telegram, отвечаем на вопросы, корректируем стратегию при необходимости.</p>
          </div>
          <div class="stage-card">
            <span class="stage-number">06</span>
            <h3 class="stage-title">Итоговая карьерная карта</h3>
            <p class="stage-text">Вы получаете подробный отчет с пошаговой дорожной картой развития на ближайшие 2–5 лет.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  // Test Banner HTML
  const testBannerHtml = `
    <section class="section section-alt">
      <div class="container">
        <div class="test-cta-box">
          <div class="test-cta-content">
            <span style="font-size:0.82rem;font-weight:700;color:var(--color-accent-light);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;display:block;">
              Онлайн-инструмент
            </span>
            <h2>Узнайте свои профессиональные склонности за 5 минут</h2>
            <p>Пройдите бесплатный авторский экспресс-тест по методикам Климова и Холланда. Определите ведущий тип мышления и подходящие современные сферы деятельности.</p>
            <div class="test-cta-features">
              <span class="test-cta-pill">${getIcon('check')} 10 быстрых вопросов</span>
              <span class="test-cta-pill">${getIcon('check')} Мгновенный результат</span>
              <span class="test-cta-pill">${getIcon('check')} Список профессий</span>
            </div>
            <a class="btn btn-accent btn-lg" href="/test/">
              Пройти тест бесплатно ${getIcon('arrowRight')}
            </a>
          </div>
          <div class="test-cta-card">
            <div class="test-cta-card-icon">${getIcon('compass')}</div>
            <h3>Онлайн-тестирование</h3>
            <p>Более 850 человек уже прошли этот тест и определили свои сильные стороны</p>
            <a class="btn btn-outline" href="/test/" style="width:100%;">Начать тест</a>
          </div>
        </div>
      </div>
    </section>
  `;

  // Certificates HTML
  const certsHtml = certificates.map(c => `
    <div class="cert-card" data-lightbox="${c.img}">
      <img src="${c.img}" alt="${c.title}" loading="lazy">
      <div class="cert-overlay">
        <div class="cert-zoom-btn">${getIcon('zoom')}</div>
      </div>
      <div class="cert-title">${c.title}</div>
    </div>
  `).join('');

  const certsSectionHtml = `
    <section class="section" id="certificates">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Квалификация</span>
          <h2 class="section-title">Сертификаты и дипломы</h2>
          <p class="section-desc">Подтвержденная квалификация в области психологии, карьерного консультирования и профориентации</p>
        </div>
        <div class="certificates-grid">
          ${certsHtml}
        </div>
      </div>
    </section>
  `;

  // Media HTML
  const mediaItemsHtml = mediaList.map(m => `
    <div class="media-card">
      <div class="media-icon">${getIcon('award')}</div>
      <div class="media-title">${m.name}</div>
      <div class="media-sub">${m.sub}</div>
    </div>
  `).join('');

  const mediaSectionHtml = `
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Признание и партнерство</span>
          <h2 class="section-title">Публикации и участие в проектах</h2>
          <p class="section-desc">Сотрудничаю с ведущими региональными институтами развития, СМИ и образовательными центрами</p>
        </div>
        <div class="media-grid">
          ${mediaItemsHtml}
        </div>
      </div>
    </section>
  `;

  // Reviews HTML
  const reviewsHtml = reviewsList.map(r => `
    <div class="review-card">
      <div class="review-stars">
        ${getIcon('star')}${getIcon('star')}${getIcon('star')}${getIcon('star')}${getIcon('star')}
      </div>
      <p class="review-text">«${r.text}»</p>
      <div class="review-author">
        <div class="review-avatar">${r.name.charAt(0)}</div>
        <div class="review-info">
          <div class="review-name">${r.name}</div>
          <div class="review-role">${r.role}</div>
        </div>
      </div>
    </div>
  `).join('');

  const reviewsSectionHtml = `
    <section class="section" id="reviews">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Доверие клиентов</span>
          <h2 class="section-title">Отзывы о моей работе</h2>
          <p class="section-desc">Истории тех, кто уже сделал уверенный шаг навстречу своему профессиональному призванию</p>
        </div>
        <div class="reviews-grid">
          ${reviewsHtml}
        </div>
        <div style="text-align:center;margin-top:36px;">
          <a class="btn btn-outline" href="/cases/">Смотреть подробные кейсы клиентов ${getIcon('arrowRight')}</a>
        </div>
      </div>
    </section>
  `;

  // FAQ Accordion HTML
  const faqItemsHtml = homeFaq.map((f, idx) => `
    <div class="faq-item ${idx === 0 ? 'active' : ''}">
      <button class="faq-question" type="button" aria-expanded="${idx === 0}">
        <span>${f.q}</span>
        <span class="faq-icon">${getIcon('chevronDown')}</span>
      </button>
      <div class="faq-answer">
        <p>${f.a}</p>
      </div>
    </div>
  `).join('');

  const faqSectionHtml = `
    <section class="section section-alt" id="faq">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Вопросы и ответы</span>
          <h2 class="section-title">Часто задаваемые вопросы (FAQ)</h2>
          <p class="section-desc">Ответы на самые популярные вопросы родителей и клиентов о профориентации</p>
        </div>
        <div class="faq-wrap">
          ${faqItemsHtml}
        </div>
      </div>
    </section>
  `;

  // Booking Form Section HTML
  const bookingHtml = `
    <section class="booking-section" id="booking">
      <div class="container booking-grid">
        <div class="booking-info">
          <span style="font-size:0.82rem;font-weight:700;color:var(--color-accent-light);text-transform:uppercase;letter-spacing:0.04em;display:block;margin-bottom:8px;">
            Бесплатная первая консультация
          </span>
          <h2>Сделайте первый шаг к профессии мечты уже сегодня</h2>
          <p>
            Оставьте заявку на бесплатную 15-минутную вводную онлайн-консультацию. Мы познакомимся, определим главные вопросы и подберем удобный формат взаимодействия.
          </p>
          <div class="booking-contacts-list">
            <div class="booking-contact-item">
              <div class="booking-contact-icon">${getIcon('phone')}</div>
              <div>
                <div class="booking-contact-label">Прямой телефон:</div>
                <div class="booking-contact-val"><a href="tel:${settings.contacts.phoneRaw}" style="color:#fff;">${settings.contacts.phone}</a></div>
              </div>
            </div>
            <div class="booking-contact-item">
              <div class="booking-contact-icon">${getIcon('mail')}</div>
              <div>
                <div class="booking-contact-label">Электронная почта:</div>
                <div class="booking-contact-val"><a href="mailto:${settings.contacts.email}" style="color:#fff;">${settings.contacts.email}</a></div>
              </div>
            </div>
            <div class="booking-contact-item">
              <div class="booking-contact-icon">${getIcon('mapPin')}</div>
              <div>
                <div class="booking-contact-label">Адрес приема в Орле:</div>
                <div class="booking-contact-val">${settings.contacts.address}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-card">
          <h3 class="form-title">Запись на консультацию</h3>
          <p class="form-sub">Заполните поля ниже, и я свяжусь с вами в течение рабочего дня</p>
          <form data-ajax-form>
            <input type="hidden" name="formType" value="consultation_booking">
            <div class="form-alert"></div>

            <div class="form-group">
              <label class="form-label">Ваше имя *</label>
              <input class="form-input" type="text" name="name" required placeholder="Как к вам обращаться?">
            </div>

            <div class="form-group">
              <label class="form-label">Телефон для связи *</label>
              <input class="form-input" type="tel" name="phone" required placeholder="+7 (___) ___-__-__">
            </div>

            <div class="form-group">
              <label class="form-label">Кого интересует консультация?</label>
              <select class="form-select" name="audience">
                <option value="Подросток (8-9 класс)">Подросток (8–9 класс, выбор ОГЭ / колледжа)</option>
                <option value="Старшеклассник (10-11 класс)">Старшеклассник (10–11 класс, выбор ВУЗа и ЕГЭ)</option>
                <option value="Взрослый">Взрослый (смена карьеры / выгорание)</option>
                <option value="Студент">Студент / молодой специалист</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Краткий комментарий или вопрос</label>
              <textarea class="form-textarea" name="message" placeholder="Опишите текущую ситуацию (необязательно)"></textarea>
            </div>

            <label class="form-checkbox-label">
              <input type="checkbox" required checked>
              <span>Даю согласие на обработку персональных данных в соответствии с <a href="/privacy/" target="_blank">Политикой конфиденциальности</a></span>
            </label>

            <button class="btn btn-primary btn-lg" type="submit" style="width:100%;">
              Отправить заявку
            </button>
          </form>
        </div>
      </div>
    </section>
  `;

  // SEO Article Block HTML
  const seoArticleHtml = `
    <section class="section">
      <div class="container" style="max-width:920px;">
        <article style="font-size:0.96rem;line-height:1.7;color:var(--color-slate-600);">
          <h2 style="font-size:1.6rem;font-weight:800;color:var(--color-slate-900);margin-bottom:16px;">
            Кто такой профориентолог и почему профессиональная ориентация так важна?
          </h2>
          <p style="margin-bottom:14px;">
            <strong>Профориентолог</strong> — это квалифицированный специалист, который помогает человеку глубоко исследовать свои личные качества, психологические особенности, внутреннюю мотивацию и профессиональные склонности, чтобы сделать осознанный выбор будущей сферы деятельности.
          </p>
          <p style="margin-bottom:14px;">
            В условиях динамичного рынка труда и постоянного появления новых цифровых профессий выбор жизненного пути становится все более ответственным. Ошибочный выбор специальности влечет за собой годы нелюбимой учебы, психологическое выгорание и разочарование.
          </p>
          <p style="margin-bottom:14px;">
            Частный профориентолог в Орле Марина Бондарева проводит комплексные индивидуальные программы как в очном формате, так и дистанционно (онлайн) для жителей всех регионов России. Опираясь на проверенные научные тесты, коучинговые беседы и глубокий анализ рынка образования, специалист формирует персональную траекторию развития, которая приносит клиенту радость, вдохновение и достойный доход.
          </p>
        </article>
      </div>
    </section>
  `;

  // Hero Section HTML
  const heroHtml = `
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="hero-badge-wrap">
            <span class="hero-badge">
              <span class="hero-badge-dot"></span>
              ${page.heroBadge || 'Частный практикующий эксперт • Опыт более 5 лет'}
            </span>
          </div>

          <h1 class="hero-title">
            ${page.h1 || 'Профориентолог Марина Бондарева'}
          </h1>

          <p class="hero-subtitle">
            ${page.heroSubtitle || 'Помогу выбрать профессию, которая приносит радость и высокий доход.'}
          </p>

          <div class="hero-bullets">
            ${(page.heroBullets || []).map(b => `
              <div class="hero-bullet-item">
                <span class="hero-bullet-icon">${getIcon('check')}</span>
                <span>${b}</span>
              </div>
            `).join('')}
          </div>

          <div class="hero-cta-group">
            <button class="btn btn-primary btn-lg" data-open-modal data-service="Запись с главного экрана">
              Записаться на консультацию
            </button>
            <a class="btn btn-accent btn-lg" href="/test/">
              Пройти онлайн-тест ${getIcon('arrowRight')}
            </a>
          </div>

          <div class="hero-trust-bar">
            <div class="hero-stat">
              <span class="hero-stat-num">${settings.specialist.experience}</span>
              <span class="hero-stat-label">в профориентации</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">${settings.specialist.consultationsCount}</span>
              <span class="hero-stat-label">проведенных сессий</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">98%</span>
              <span class="hero-stat-label">поступили по выбору</span>
            </div>
          </div>
        </div>

        <div class="hero-image-wrap">
          <div class="hero-image-card">
            <img src="${page.heroImage || '/images/marina-bondareva-hero.jpg'}" alt="Профориентолог Марина Бондарева" priority>
            <div class="hero-float-badge">
              <div class="float-badge-icon">${getIcon('compass')}</div>
              <div class="float-badge-text">
                <span class="float-badge-title">Очно в Орле и Онлайн по РФ</span>
                <span class="float-badge-sub">Индивидуальные сессии и диагностика</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  return heroHtml + audienceHtml + aboutHtml + servicesHtml + stagesHtml + testBannerHtml + certsSectionHtml + mediaSectionHtml + reviewsSectionHtml + faqSectionHtml + bookingHtml + seoArticleHtml;
}

module.exports = {
  homeFaq,
  certificates,
  mediaList,
  reviewsList,
  renderHomeContent
};
