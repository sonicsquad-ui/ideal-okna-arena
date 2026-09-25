<?php
/**
 * Champion-Tennis.ru — Единый фронт-контроллер PHP для хостинга REG.RU
 * Версия со всеми 18 улучшениями по техническому заданию
 */

require_once __DIR__ . '/config.php';

$rawUrl = isset($_GET['url']) ? trim($_GET['url'], '/') : '';

// 1. АВТОМАТИЧЕСКИЙ СТРИМЕР СТАТИЧЕСКИХ РЕСУРСОВ (CSS, JS, ИЗОБРАЖЕНИЯ)
$staticPrefixes = ['css/', 'js/', 'images/', 'uploads/', 'public/'];
foreach ($staticPrefixes as $prefix) {
    if (strpos($rawUrl, $prefix) === 0 || strpos($_SERVER['REQUEST_URI'] ?? '', '/' . $prefix) !== false) {
        $cleanPath = preg_replace('#^public/#', '', $rawUrl);
        $candidatePaths = [
            __DIR__ . '/' . $rawUrl,
            __DIR__ . '/' . $cleanPath,
            __DIR__ . '/public/' . $cleanPath,
            __DIR__ . '/public/' . $rawUrl
        ];
        foreach ($candidatePaths as $file) {
            if (file_exists($file) && is_file($file)) {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                $mimes = [
                    'css'  => 'text/css; charset=utf-8',
                    'js'   => 'application/javascript; charset=utf-8',
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'webp' => 'image/webp',
                    'svg'  => 'image/svg+xml',
                    'ico'  => 'image/x-icon',
                    'woff' => 'font/woff',
                    'woff2'=> 'font/woff2',
                    'ttf'  => 'font/ttf'
                ];
                header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
                header('Cache-Control: public, max-age=604800');
                header('Content-Length: ' . filesize($file));
                readfile($file);
                exit;
            }
        }
    }
}

// 2. ROBOTS.TXT (Пункт 18)
if ($rawUrl === 'robots.txt' || (!empty($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/robots.txt') !== false)) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://champion-tennis.ru/sitemap.xml\nHost: champion-tennis.ru\n";
    exit;
}

$parts = $rawUrl ? explode('/', $rawUrl) : [];
$route = $parts[0] ?? '';
$subRoute = $parts[1] ?? '';
$subSubRoute = $parts[2] ?? '';

$settings = getGlobalSettings($pdo);
$header = $settings['header'] ?? [];
$footer = $settings['footer'] ?? [];
$cookie = $settings['cookie_banner'] ?? [];

// Категории новостей
$newsCategories = [
    'atp' => 'ATP Тур (Мужчины)',
    'wta' => 'WTA Тур (Женщины)',
    'grand-slam' => 'Большой шлем',
    'team-russia' => 'Сборная России / РТТ',
    'padel-pickleball' => 'Падел и Пиклбол'
];

// Категории блога
$blogCategories = [
    'previews' => 'Превью и аналитика',
    'tactics' => 'Тактика и биомеханика',
    'gear' => 'Обзоры экипировки',
    'history' => 'История и рекорды',
    'interviews' => 'Интервью',
    'guides' => 'Обучение и советы'
];

if (!function_exists('renderBreadcrumbs')) {
    function renderBreadcrumbs($crumbs) {
        if (empty($crumbs)) return '';
        $html = '<nav class="breadcrumbs-wrapper" aria-label="Хлебные крошки"><div class="container"><ol class="breadcrumbs-list">';
        $html .= '<li><a href="/">Главная</a></li>';
        foreach ($crumbs as $idx => $c) {
            $html .= '<span class="breadcrumb-separator">/</span>';
            if ($idx === count($crumbs) - 1) {
                $html .= '<li class="breadcrumb-current">' . htmlspecialchars($c['title']) . '</li>';
            } else {
                $html .= '<li><a href="' . htmlspecialchars($c['url']) . '">' . htmlspecialchars($c['title']) . '</a></li>';
            }
        }
        $html .= '</ol></div></nav>';
        return $html;
    }
}

if (!function_exists('resolveImg')) {
    function resolveImg($path) {
        if (!$path) return '/images/hero-tennis-ball.jpg';
        if (strpos($path, 'http') === 0) return $path;
        return $path;
    }
}

// Генератор блока шаринга в соцсети и мессенджеры (Требование 9)
if (!function_exists('renderShareBlock')) {
    function renderShareBlock($url, $title, $type = 'материалом') {
        $encUrl = urlencode($url);
        $encTitle = urlencode($title);
        $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $jsSafeTitle = htmlspecialchars(addslashes($title), ENT_QUOTES, 'UTF-8');
        $safeType = htmlspecialchars($type, ENT_QUOTES, 'UTF-8');

        ob_start();
        ?>
        <div class="article-sharing-bar">
          <div class="sharing-label">
            <svg style="width:18px; height:18px; stroke:#0a5c36; fill:none; display:inline-block; vertical-align:-3px; margin-right:4px;" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            <span>Поделиться <?= $safeType ?>:</span>
          </div>
          <div class="social-share-buttons">
            <a href="https://t.me/share/url?url=<?= $encUrl ?>&text=<?= $encTitle ?>" target="_blank" rel="noopener" class="share-btn share-btn-tg" title="Поделиться в Telegram">✈️ Telegram</a>
            <a href="https://vk.com/share.php?url=<?= $encUrl ?>&title=<?= $encTitle ?>" target="_blank" rel="noopener" class="share-btn share-btn-vk" title="Поделиться во ВКонтакте">🔵 ВКонтакте</a>
            <a href="https://connect.ok.ru/offer?url=<?= $encUrl ?>&title=<?= $encTitle ?>" target="_blank" rel="noopener" class="share-btn share-btn-ok" title="Поделиться в Одноклассниках">🟠 Одноклассники</a>
            <a href="https://connect.mail.ru/share?url=<?= $encUrl ?>&title=<?= $encTitle ?>" target="_blank" rel="noopener" class="share-btn share-btn-mm" title="Поделиться в Мой Мир">🔴 Мой Мир</a>
            <button type="button" class="share-btn share-btn-max" onclick="shareToMax('<?= $safeUrl ?>', '<?= $jsSafeTitle ?>')" title="Поделиться в MAX мессенджер">💬 MAX</button>
            <button type="button" class="share-btn share-btn-copy js-copy-link" onclick="copyPageUrl(this, '<?= $safeUrl ?>')" title="Скопировать ссылку в буфер обмена">🔗 Скопировать ссылку</button>
          </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Генератор обязательного чекбокса согласия с политикой обработки данных (Требование 1)
if (!function_exists('renderFormAgreementCheckbox')) {
    function renderFormAgreementCheckbox($suffix = 'main') {
        $safeSuffix = htmlspecialchars($suffix, ENT_QUOTES, 'UTF-8');
        ob_start();
        ?>
        <div class="form-agree-wrap">
          <input type="checkbox" name="agree" class="form-agree-checkbox" id="agreeCheckbox_<?= $safeSuffix ?>" required>
          <label for="agreeCheckbox_<?= $safeSuffix ?>">
            Нажимая кнопку, вы соглашаетесь с <a href="/privacy-policy" target="_blank">Политикой обработки данных</a>.
          </label>
        </div>
        <?php
        return ob_get_clean();
    }
}

// ==========================================
// API & RSS & Sitemap Endpoints
// ==========================================
if ($route === 'rss.xml' || $route === 'news-rss.xml') {
    header('Content-Type: application/rss+xml; charset=utf-8');
    $stmt = $pdo->query("SELECT * FROM news ORDER BY published_at DESC LIMIT 30");
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    ?>
    <rss version="2.0">
      <channel>
        <title>Чемпион-Теннис | Новости</title>
        <link>https://champion-tennis.ru</link>
        <description>Свежие новости российского и мирового тенниса на champion-tennis.ru</description>
        <?php while ($n = $stmt->fetch()): ?>
          <item>
            <title><![CDATA[<?= $n['title'] ?>]]></title>
            <link>https://champion-tennis.ru/news/<?= $n['category'] ?>/<?= $n['slug'] ?></link>
            <description><![CDATA[<?= $n['excerpt'] ?>]]></description>
            <pubDate><?= date(DATE_RSS, strtotime($n['published_at'])) ?></pubDate>
          </item>
        <?php endwhile; ?>
      </channel>
    </rss>
    <?php
    exit;
}

if ($route === 'sitemap.xml') {
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    $staticUrls = ['', 'news', 'news/atp', 'news/wta', 'news/grand-slam', 'news/team-russia', 'news/padel-pickleball', 'tournaments', 'rankings', 'players', 'blog', 'gear', 'glossary', 'about', 'contacts', 'user-agreement', 'privacy-policy', 'site-rules', 'sitemap'];
    foreach ($staticUrls as $u) {
        echo '<url><loc>https://champion-tennis.ru/' . $u . '</loc><changefreq>daily</changefreq><priority>0.8</priority></url>';
    }
    $stmtN = $pdo->query("SELECT category, slug FROM news");
    while ($n = $stmtN->fetch()) {
        echo '<url><loc>https://champion-tennis.ru/news/' . $n['category'] . '/' . $n['slug'] . '</loc><priority>0.7</priority></url>';
    }
    $stmtB = $pdo->query("SELECT category, slug FROM articles");
    while ($b = $stmtB->fetch()) {
        echo '<url><loc>https://champion-tennis.ru/blog/' . $b['category'] . '/' . $b['slug'] . '</loc><priority>0.7</priority></url>';
    }
    echo '</urlset>';
    exit;
}

// API: Subscribe (устойчивое чтение POST, JSON и URL-encoded параметров)
if ($route === 'api' && $subRoute === 'subscribe') {
    header('Content-Type: application/json; charset=utf-8');
    $raw = @file_get_contents('php://input');
    $json = $raw ? @json_decode($raw, true) : null;
    $input = array_merge(
        is_array($_POST) ? $_POST : [],
        is_array($_REQUEST) ? $_REQUEST : [],
        is_array($json) ? $json : []
    );
    $email = trim($input['email'] ?? '');
    if ($email && strpos($email, '@')) {
        $stmt = $pdo->prepare("INSERT INTO form_submissions (form_type, name, contact_info, subject, message, source_url, status) VALUES ('newsletter', 'Подписчик дайджеста', ?, 'Подписка на утренний дайджест', 'Email рассылка 8:00', ?, 'new')");
        $stmt->execute([$email, $input['pageUrl'] ?? '']);
        sendAdminNotification("[Champion-Tennis.ru] Новая подписка на рассылку", "Email: " . $email . "\nСтраница: " . ($input['pageUrl'] ?? ''));
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Укажите корректный email']);
    }
    exit;
}

// API: Contact (устойчивое чтение POST, JSON и URL-encoded параметров — Требование 1)
if ($route === 'api' && $subRoute === 'contact') {
    header('Content-Type: application/json; charset=utf-8');
    $raw = @file_get_contents('php://input');
    $json = $raw ? @json_decode($raw, true) : null;
    $input = array_merge(
        is_array($_POST) ? $_POST : [],
        is_array($_REQUEST) ? $_REQUEST : [],
        is_array($json) ? $json : []
    );
    $name = trim($input['name'] ?? '');
    $contact = trim($input['contact'] ?? $input['email'] ?? $input['phone'] ?? '');
    $msg = trim($input['message'] ?? $input['msg'] ?? $input['text'] ?? '');
    $subject = trim($input['subject'] ?? 'Обращение с сайта');
    $formType = trim($input['form_type'] ?? 'Форма обратной связи');
    $pageUrl = trim($input['pageUrl'] ?? $input['source_url'] ?? $_SERVER['HTTP_REFERER'] ?? '');

    if (!empty($contact) && !empty($msg)) {
        $stmt = $pdo->prepare("INSERT INTO form_submissions (form_type, name, contact_info, subject, message, source_url, status) VALUES (?, ?, ?, ?, ?, ?, 'new')");
        $stmt->execute([$formType, $name ?: 'Пользователь сайта', $contact, $subject, $msg, $pageUrl]);
        sendAdminNotification("[Champion-Tennis.ru] Новое обращение: " . $subject, "Имя: $name\nКонтакт: $contact\nТема: $subject\nФорма: $formType\n\nСообщение:\n$msg\n\nСтраница отправки: " . $pageUrl);
        echo json_encode(['success' => true, 'message' => 'Ваше обращение успешно отправлено!']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Заполните обязательные поля: контакт для связи и сообщение']);
    }
    exit;
}

// API: Search (Сквозной поиск по всем разделам, страницам, новостям, статьям и игрокам — Требование 3)
if ($route === 'api' && $subRoute === 'search') {
    header('Content-Type: application/json; charset=utf-8');
    $q = trim($_GET['q'] ?? '');
    $results = [];
    if (mb_strlen($q) >= 2) {
        $qLower = mb_strtolower($q, 'UTF-8');

        // 1. Полнотекстовый поиск по всем ключевым разделам и страницам сайта
        $systemPages = [
            ['title' => 'Новости тенниса', 'type_label' => 'Раздел', 'url' => '/news', 'keys' => ['новости', 'лента новостей', 'теннисные новости', 'новости спорта', 'news', 'лента'], 'desc' => 'Главные события российского и мирового тенниса, туры ATP и WTA'],
            ['title' => 'ATP Тур (Мужчины)', 'type_label' => 'Раздел', 'url' => '/news/atp', 'keys' => ['atp', 'атп', 'мужской теннис', 'мужчины'], 'desc' => 'Новости и результаты матчей мужского тура ATP'],
            ['title' => 'WTA Тур (Женщины)', 'type_label' => 'Раздел', 'url' => '/news/wta', 'keys' => ['wta', 'вта', 'женский теннис', 'женщины'], 'desc' => 'Новости и результаты матчей женского тура WTA'],
            ['title' => 'Большой шлем (Grand Slam)', 'type_label' => 'Раздел', 'url' => '/news/grand-slam', 'keys' => ['шлем', 'большой шлем', 'grand slam', 'уимблдон', 'ролан гаррос', 'us open', 'australian open', 'мэйджор'], 'desc' => 'Турниры Большого шлема'],
            ['title' => 'Сборная России и РТТ', 'type_label' => 'Раздел', 'url' => '/news/team-russia', 'keys' => ['россия', 'сборная', 'ртт', 'российский теннис', 'team russia', 'кубок кремля'], 'desc' => 'Сборная России и национальный тур РТТ'],
            ['title' => 'Падел и Пиклбол', 'type_label' => 'Раздел', 'url' => '/news/padel-pickleball', 'keys' => ['падел', 'пиклбол', 'падл', 'padel', 'pickleball'], 'desc' => 'Развитие падела и пиклбола в России и мире'],
            ['title' => 'Аналитика и Блог о теннисе', 'type_label' => 'Раздел', 'url' => '/blog', 'keys' => ['блог', 'аналитика', 'статьи', 'разборы', 'авторские материалы', 'мнения', 'blog', 'колонка', 'статья'], 'desc' => 'Авторские статьи экспертов, тактические разборы и исторические хроники'],
            ['title' => 'Календарь теннисных турниров 2026', 'type_label' => 'Раздел', 'url' => '/tournaments', 'keys' => ['турниры', 'календарь', 'расписание', 'турнирная сетка', 'сетка', 'мастерс', 'tournaments', 'турнир'], 'desc' => 'Календарь турниров Большого шлема, Мастерс 1000 и соревнований в РФ'],
            ['title' => 'Официальные рейтинги ATP и WTA', 'type_label' => 'Раздел', 'url' => '/rankings', 'keys' => ['рейтинг', 'рейтинги', 'топ', 'ранкинг', 'rankings', 'очки', 'первая ракетка', 'таблица'], 'desc' => 'Официальная таблица очков мирового рейтинга теннисистов и теннисисток'],
            ['title' => 'Звезды тенниса и профили игроков', 'type_label' => 'Раздел', 'url' => '/players', 'keys' => ['игроки', 'теннисисты', 'теннисистки', 'профили', 'игрок', 'players', 'биографии'], 'desc' => 'Досье, статистика и достижения ведущих российских и мировых спортсменов'],
            ['title' => 'Ракетки и Экипировка 2026', 'type_label' => 'Раздел', 'url' => '/gear', 'keys' => ['экипировка', 'ракетки', 'струны', 'кроссовки', 'мячи', 'gear', 'обзоры ракеток', 'wilson', 'babolat', 'head', 'yonex', 'ракетка'], 'desc' => 'Гид по выбору профессиональных ракеток, струн и обуви для корта'],
            ['title' => 'Глоссарий теннисных терминов', 'type_label' => 'Справочник', 'url' => '/glossary', 'keys' => ['глоссарий', 'термины', 'словарь', 'тай-брейк', 'эйс', 'брейк', 'слайс', 'glossary', 'термин'], 'desc' => 'Справочник профессиональной терминологии и правил судейства'],
            ['title' => 'О проекте и Редакция', 'type_label' => 'Страница', 'url' => '/about', 'keys' => ['о проекте', 'редакция', 'о нас', 'команда', 'журналисты', 'авторы', 'миссия', 'about', 'проект'], 'desc' => 'Информация о спортивном портале Champion-Tennis.ru и составе редакции'],
            ['title' => 'Контакты и Размещение Рекламы', 'type_label' => 'Страница', 'url' => '/contacts', 'keys' => ['контакты', 'реклама', 'связь', 'размещение рекламы', 'сотрудничество', 'contacts', 'контакт'], 'desc' => 'Контакты дежурного редактора и коммерческого отдела'],
            ['title' => 'Правила пользования сайтом', 'type_label' => 'Документ', 'url' => '/site-rules', 'keys' => ['правила', 'правила сайта', 'правила пользования', 'site rules', 'модерация', 'комментарии', 'правило'], 'desc' => 'Регламент поведения на сайте, цитирования и публикации материалов'],
            ['title' => 'Пользовательское соглашение', 'type_label' => 'Документ', 'url' => '/user-agreement', 'keys' => ['соглашение', 'пользовательское соглашение', 'условия', 'user agreement'], 'desc' => 'Официальное пользовательское соглашение портала'],
            ['title' => 'Политика конфиденциальности (152-ФЗ)', 'type_label' => 'Документ', 'url' => '/privacy-policy', 'keys' => ['политика', 'конфиденциальность', '152-фз', 'персональные данные', 'обработка данных', 'privacy policy'], 'desc' => 'Политика обработки и защиты персональных данных пользователей'],
            ['title' => 'Карта сайта', 'type_label' => 'Страница', 'url' => '/sitemap', 'keys' => ['карта сайта', 'навигация', 'sitemap', 'все разделы', 'карта'], 'desc' => 'Полная иерархическая карта разделов и материалов портала']
        ];

        foreach ($systemPages as $sp) {
            $matched = false;
            if (mb_stripos($sp['title'], $q, 0, 'UTF-8') !== false || mb_stripos($sp['desc'], $q, 0, 'UTF-8') !== false) {
                $matched = true;
            } else {
                foreach ($sp['keys'] as $k) {
                    if (mb_stripos($k, $qLower, 0, 'UTF-8') !== false || mb_stripos($qLower, $k, 0, 'UTF-8') !== false) {
                        $matched = true;
                        break;
                    }
                }
            }
            if ($matched) {
                $results[] = [
                    'title' => $sp['title'],
                    'type_label' => $sp['type_label'],
                    'url' => $sp['url'],
                    'desc' => $sp['desc'],
                    'date' => 'Раздел'
                ];
            }
        }

        // 2. Поиск по динамическим страницам pages (custom pages)
        $stPages = $pdo->prepare("SELECT title, slug FROM pages WHERE ru_like(title, ?) = 1 OR ru_like(content, ?) = 1 LIMIT 3");
        $stPages->execute([$q, $q]);
        while ($r = $stPages->fetch()) {
            $already = false;
            foreach ($results as $resItem) {
                if ($resItem['url'] === '/' . $r['slug']) { $already = true; break; }
            }
            if (!$already) {
                $results[] = [
                    'title' => $r['title'],
                    'type_label' => 'Страница',
                    'url' => '/' . $r['slug'],
                    'desc' => 'Системная страница портала',
                    'date' => 'Инфо'
                ];
            }
        }

        // 3. Новости
        $stNews = $pdo->prepare("SELECT title, category, slug, published_at FROM news WHERE ru_like(title, ?) = 1 OR ru_like(excerpt, ?) = 1 LIMIT 6");
        $stNews->execute([$q, $q]);
        while ($r = $stNews->fetch()) {
            $results[] = [
                'title' => $r['title'],
                'type_label' => 'Новость',
                'url' => '/news/' . $r['category'] . '/' . $r['slug'],
                'desc' => '',
                'date' => formatNewsDate($r['published_at'])
            ];
        }

        // 4. Статьи блога
        $stArt = $pdo->prepare("SELECT title, category, slug, published_at FROM articles WHERE ru_like(title, ?) = 1 OR ru_like(excerpt, ?) = 1 LIMIT 5");
        $stArt->execute([$q, $q]);
        while ($r = $stArt->fetch()) {
            $results[] = [
                'title' => $r['title'],
                'type_label' => 'Блог',
                'url' => '/blog/' . $r['category'] . '/' . $r['slug'],
                'desc' => '',
                'date' => formatNewsDate($r['published_at'])
            ];
        }

        // 5. Игроки
        $stPlay = $pdo->prepare("SELECT name, slug, country, current_rank FROM players WHERE ru_like(name, ?) = 1 LIMIT 3");
        $stPlay->execute([$q]);
        while ($r = $stPlay->fetch()) {
            $results[] = [
                'title' => $r['name'] . ' (' . $r['country'] . ') — №' . $r['current_rank'],
                'type_label' => 'Игрок',
                'url' => '/players',
                'desc' => 'Профиль теннисиста мирового тура',
                'date' => 'Рейтинг'
            ];
        }

        // 6. Экипировка
        $stGear = $pdo->prepare("SELECT brand, title, price, slug FROM gear_reviews WHERE ru_like(brand, ?) = 1 OR ru_like(title, ?) = 1 LIMIT 3");
        $stGear->execute([$q, $q]);
        while ($r = $stGear->fetch()) {
            $results[] = [
                'title' => $r['brand'] . ' ' . $r['title'] . ' (' . $r['price'] . ')',
                'type_label' => 'Экипировка',
                'url' => '/gear',
                'desc' => 'Обзор и характеристики ракетки',
                'date' => 'Тест'
            ];
        }
    }
    echo json_encode(['results' => $results, 'total' => count($results)]);
    exit;
}

// ==========================================
// Определение Meta тегов страниц (Пункт 14)
// ==========================================
if (!function_exists('getPageMeta')) {
function getPageMeta($route, $subRoute, $subSubRoute, $pdo) {
    global $rawUrl;
    $canonical = '/' . trim($rawUrl, '/');
    $image = '/images/hero-tennis-ball.jpg';
    $type = 'website';
    $schema = null;

    if ($route === '' || $route === 'index') {
        $canonical = '/';
        return [
            'title' => 'Теннис: новости российского и мирового тенниса, результаты, календарь турниров 2026, новости спорта, рейтинги, статьи - Чемпион-Теннис',
            'desc' => 'Спортивный портал тенниса России Чемпион-Теннис: новости тенниса и спорта, расписание турниров, рейтинги, аналитика, статьи.',
            'image' => '/images/hero-tennis-ball.jpg',
            'type' => 'website',
            'canonical' => $canonical,
            'schema' => [
                '@context' => 'https://schema.org',
                '@type' => 'WebSite',
                'name' => 'Чемпион-Теннис',
                'url' => 'https://champion-tennis.ru',
                'description' => 'Спортивный портал тенниса России Чемпион-Теннис: новости тенниса и спорта, расписание турниров, рейтинги, аналитика, статьи.',
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => 'https://champion-tennis.ru/search?q={search_term_string}',
                    'query-input' => 'required name=search_term_string'
                ]
            ]
        ];
    }
    if ($route === 'news') {
        $newsSlug = $subSubRoute ?: $subRoute;
        if ($newsSlug && !in_array($newsSlug, ['atp', 'wta', 'grand-slam', 'team-russia', 'padel-pickleball'])) {
            $st = $pdo->prepare("SELECT * FROM news WHERE slug = ?");
            $st->execute([$newsSlug]);
            $n = $st->fetch();
            if ($n) {
                $img = resolveImg($n['image']);
                $newsCanonical = '/news/' . $n['category'] . '/' . $n['slug'];
                return [
                    'title' => $n['meta_title'] ?: ($n['title'] . ' — Чемпион-Теннис'),
                    'desc' => $n['meta_description'] ?: $n['excerpt'],
                    'image' => $img,
                    'type' => 'article',
                    'canonical' => $newsCanonical,
                    'schema' => [
                        '@context' => 'https://schema.org',
                        '@type' => 'NewsArticle',
                        'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => 'https://champion-tennis.ru' . $newsCanonical],
                        'headline' => $n['title'],
                        'image' => ['https://champion-tennis.ru' . $img],
                        'datePublished' => date('c', strtotime($n['published_at'])),
                        'dateModified' => date('c', strtotime($n['published_at'])),
                        'author' => ['@type' => 'Organization', 'name' => 'Редакция Чемпион-Теннис', 'url' => 'https://champion-tennis.ru/about'],
                        'publisher' => [
                            '@type' => 'Organization',
                            'name' => 'Чемпион-Теннис',
                            'logo' => ['@type' => 'ImageObject', 'url' => 'https://champion-tennis.ru/android-chrome-192x192.png']
                        ],
                        'description' => $n['excerpt']
                    ]
                ];
            }
        }
        return [
            'title' => 'Новости тенниса — Champion-Tennis.ru',
            'desc' => 'Свежие новости российского и мирового тенниса: ATP, WTA, турниры Большого шлема, результаты матчей.',
            'image' => '/images/hero-tennis-ball.jpg',
            'type' => 'website',
            'canonical' => $canonical,
            'schema' => null
        ];
    }
    if ($route === 'blog') {
        $slug = $subSubRoute ?: $subRoute;
        if ($slug && !in_array($slug, ['previews', 'tactics', 'gear', 'history', 'interviews', 'guides'])) {
            $st = $pdo->prepare("SELECT * FROM articles WHERE slug = ?");
            $st->execute([$slug]);
            $a = $st->fetch();
            if ($a) {
                $img = resolveImg($a['image']);
                $blogCanonical = '/blog/' . $a['category'] . '/' . $a['slug'];
                return [
                    'title' => $a['meta_title'] ?: ($a['title'] . ' — Блог «Чемпион-Теннис»'),
                    'desc' => $a['meta_description'] ?: $a['excerpt'],
                    'image' => $img,
                    'type' => 'article',
                    'canonical' => $blogCanonical,
                    'schema' => [
                        '@context' => 'https://schema.org',
                        '@type' => 'BlogPosting',
                        'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => 'https://champion-tennis.ru' . $blogCanonical],
                        'headline' => $a['title'],
                        'image' => ['https://champion-tennis.ru' . $img],
                        'datePublished' => date('c', strtotime($a['published_at'])),
                        'dateModified' => date('c', strtotime($a['published_at'])),
                        'author' => ['@type' => 'Person', 'name' => $a['author_name'] ?: 'Михаил Соколов', 'jobTitle' => $a['author_role'] ?: 'Эксперт'],
                        'publisher' => [
                            '@type' => 'Organization',
                            'name' => 'Чемпион-Теннис',
                            'logo' => ['@type' => 'ImageObject', 'url' => 'https://champion-tennis.ru/android-chrome-192x192.png']
                        ],
                        'description' => $a['excerpt']
                    ]
                ];
            }
        }
        return [
            'title' => 'Аналитика и Блог о теннисе — Чемпион-Теннис',
            'desc' => 'Экспертные статьи о теннисе, разбор техники, превью турниров, обзоры экипировки от мастеров спорта.',
            'image' => '/images/blog-tactics.jpg',
            'type' => 'website',
            'canonical' => $canonical,
            'schema' => null
        ];
    }
    if ($route === 'sitemap') {
        return [
            'title' => 'Карта сайта — Все страницы и разделы Champion-Tennis.ru',
            'desc' => 'Полный иерархический каталог всех разделов, новостей и аналитических статей портала Чемпион-Теннис.',
            'image' => '/images/hero-tennis-ball.jpg',
            'type' => 'website',
            'canonical' => '/sitemap',
            'schema' => null
        ];
    }

    $st = $pdo->prepare("SELECT meta_title, meta_description, title FROM pages WHERE slug = ?");
    $st->execute([$route]);
    $p = $st->fetch();
    if ($p) {
        return [
            'title' => $p['meta_title'] ?: ($p['title'] . ' — Чемпион-Теннис'),
            'desc' => $p['meta_description'] ?: '',
            'image' => '/images/hero-tennis-ball.jpg',
            'type' => 'website',
            'canonical' => '/' . $route,
            'schema' => null
        ];
    }
    return [
        'title' => 'Чемпион-Теннис | Спортивный портал',
        'desc' => 'Главный спортивный портал тенниса России.',
        'image' => '/images/hero-tennis-ball.jpg',
        'type' => 'website',
        'canonical' => $canonical,
        'schema' => null
    ];
}
}

$pageMeta = getPageMeta($route, $subRoute, $subSubRoute, $pdo);
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title><?= htmlspecialchars($pageMeta['title']) ?></title>
  <meta name="description" content="<?= htmlspecialchars($pageMeta['desc']) ?>">

  <!-- Канонический URL (Требование 8) -->
  <link rel="canonical" href="https://champion-tennis.ru<?= htmlspecialchars($pageMeta['canonical'] ?? '/') ?>">

  <!-- Фавиконы для всех платформ и браузеров (Требование 6) -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#0a5c36">

  <!-- OpenGraph микроразметка (Требование 7) -->
  <meta property="og:type" content="<?= htmlspecialchars($pageMeta['type'] ?? 'website') ?>">
  <meta property="og:site_name" content="Чемпион-Теннис">
  <meta property="og:title" content="<?= htmlspecialchars($pageMeta['title']) ?>">
  <meta property="og:description" content="<?= htmlspecialchars($pageMeta['desc']) ?>">
  <meta property="og:url" content="https://champion-tennis.ru<?= htmlspecialchars($pageMeta['canonical'] ?? '/') ?>">
  <meta property="og:image" content="<?= htmlspecialchars(strpos($pageMeta['image'], 'http') === 0 ? $pageMeta['image'] : ('https://champion-tennis.ru' . $pageMeta['image'])) ?>">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="ru_RU">

  <!-- Twitter Card микроразметка (Требование 7) -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= htmlspecialchars($pageMeta['title']) ?>">
  <meta name="twitter:description" content="<?= htmlspecialchars($pageMeta['desc']) ?>">
  <meta name="twitter:image" content="<?= htmlspecialchars(strpos($pageMeta['image'], 'http') === 0 ? $pageMeta['image'] : ('https://champion-tennis.ru' . $pageMeta['image'])) ?>">

  <!-- Микроразметка Schema.org JSON-LD (Требование 7) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Чемпион-Теннис",
    "url": "https://champion-tennis.ru",
    "logo": "https://champion-tennis.ru/images/hero-tennis-ball.jpg",
    "sameAs": [
      "https://t.me/champion_tennis_ru",
      "https://vk.com/champion_tennis_ru"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://champion-tennis.ru/contacts"
    }
  }
  </script>
  <?php if (!empty($pageMeta['schema'])): ?>
    <script type="application/ld+json">
    <?= json_encode($pageMeta['schema'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) ?>
    </script>
  <?php endif; ?>

  <!-- CSS Стили сайта -->
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/public/css/main.css">

  <style>
    /* Предотвращение горизонтального скролла на смартфонах (Пункт 17) */
    html, body {
      max-width: 100vw !important;
      overflow-x: hidden !important;
      box-sizing: border-box;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    .container {
      width: 100%;
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 16px;
    }
    .brand-logo { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; }
    .brand-crest { width: 44px !important; height: 44px !important; min-width: 44px !important; max-width: 44px !important; max-height: 44px !important; background: #0a5c36; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
    .brand-crest svg { width: 26px !important; height: 26px !important; max-width: 26px !important; max-height: 26px !important; display: block !important; }
    .brand-name { font-size: 1.35rem; font-weight: 800; color: #074025; text-transform: uppercase; white-space: nowrap; }
    .brand-name span { color: #c84c1f; }
    
    /* Мобильная кнопка Гамбургер (Пункт 17) */
    .mobile-menu-toggle {
      display: none;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      width: 42px;
      height: 42px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
    }
    @media (max-width: 992px) {
      .mobile-menu-toggle {
        display: inline-flex !important;
      }
      .header-nav {
        display: none !important;
      }
    }
    .data-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  </style>
</head>
<body>

<!-- Header (Пункт 5: без кнопки Админка; Пункт 6: без домена в логотипе) -->
<header class="site-header">
  <div class="top-ticker-bar">
    <div class="container top-ticker-inner">
      <div class="ticker-left">
        <span class="ticker-badge">Молния</span>
        <span class="ticker-content"><?= htmlspecialchars($header['ticker_text'] ?? '🔥 LIVE: Рим ATP 1000 — Медведев в полуфинале • Мирра Андреева в топ-6 WTA!') ?></span>
      </div>
      <div class="ticker-right">
        <span class="header-date"><?= date('d.m.Y') ?>, Москва</span>
        <div class="top-socials">
          <a href="https://t.me/champion_tennis_ru" target="_blank" class="top-social-link" title="Telegram">TG</a>
          <a href="https://vk.com/champion_tennis_ru" target="_blank" class="top-social-link" title="ВКонтакте">VK</a>
          <a href="/rss.xml" class="top-social-link" title="RSS">RSS</a>
        </div>
      </div>
    </div>
  </div>

  <div class="container main-header-row">
    <!-- Логотип (Пункт 6: только ЧЕМПИОН-ТЕННИС без champion-tennis.ru) -->
    <a href="/" class="brand-logo" title="На главную Champion-Tennis.ru">
      <div class="brand-crest">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke="#ccff00"/>
          <path d="M4.93 4.93c4.2 4.2 4.2 10.94 0 15.14" stroke="#ffffff"/>
          <path d="M19.07 4.93c-4.2 4.2-4.2 10.94 0 15.14" stroke="#ffffff"/>
        </svg>
      </div>
      <div class="brand-text">
        <div class="brand-name">Чемпион-<span>Теннис</span></div>
      </div>
    </a>

    <!-- Основная навигация -->
    <nav class="header-nav">
      <a href="/news" class="nav-link <?= $route === 'news' ? 'active' : '' ?>">Новости</a>
      <a href="/tournaments" class="nav-link <?= $route === 'tournaments' ? 'active' : '' ?>">Турниры</a>
      <a href="/rankings" class="nav-link <?= $route === 'rankings' ? 'active' : '' ?>">Рейтинги ATP/WTA</a>
      <a href="/players" class="nav-link <?= $route === 'players' ? 'active' : '' ?>">Игроки</a>
      <a href="/blog" class="nav-link <?= $route === 'blog' ? 'active' : '' ?>">Аналитика и Блог</a>
      <a href="/gear" class="nav-link <?= $route === 'gear' ? 'active' : '' ?>">Экипировка 2026</a>
      <a href="/about" class="nav-link <?= $route === 'about' ? 'active' : '' ?>">О проекте</a>
    </nav>

    <!-- Header Actions: Кнопка поиска только значком лупы (Требование 3) + Гамбургер на мобильных (Требование 4) -->
    <div class="header-actions">
      <!-- Кнопка поиска по сайту: значок лупы без текста, тултип при наведении (Требование 3) -->
      <button class="search-btn-trigger js-search-trigger" type="button" aria-label="Поиск по сайту" title="Поиск по сайту">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </button>

      <!-- Мобильная кнопка меню Гамбургер: строго рядом с лупой на экранах <= 992px (Требование 4) -->
      <button class="mobile-menu-toggle" id="mobileMenuToggle" type="button" aria-label="Открыть мобильное меню" title="Меню сайта">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>

  <!-- Подкатегории новостей (Пункт 15: фильтрация при клике) -->
  <div class="category-subnav">
    <div class="container subnav-inner">
      <a href="/news" class="subnav-item <?= ($route === 'news' && empty($subRoute)) ? 'active' : '' ?>">Все новости</a>
      <a href="/news/atp" class="subnav-item <?= ($route === 'news' && $subRoute === 'atp') ? 'active' : '' ?>">ATP Тур</a>
      <a href="/news/wta" class="subnav-item <?= ($route === 'news' && $subRoute === 'wta') ? 'active' : '' ?>">WTA Тур</a>
      <a href="/news/grand-slam" class="subnav-item <?= ($route === 'news' && $subRoute === 'grand-slam') ? 'active' : '' ?>">Большой шлем</a>
      <a href="/news/team-russia" class="subnav-item <?= ($route === 'news' && $subRoute === 'team-russia') ? 'active' : '' ?>">🇷🇺 Сборная России</a>
      <a href="/news/padel-pickleball" class="subnav-item <?= ($route === 'news' && $subRoute === 'padel-pickleball') ? 'active' : '' ?>">🎾 Падел и Пиклбол</a>
      <a href="/tournaments" class="subnav-item <?= $route === 'tournaments' ? 'active' : '' ?>">Календарь 2026</a>
      <a href="/gear" class="subnav-item <?= $route === 'gear' ? 'active' : '' ?>">Ракетки 2026</a>
      <a href="/glossary" class="subnav-item <?= $route === 'glossary' ? 'active' : '' ?>">Глоссарий</a>
    </div>
  </div>
</header>

<!-- Мобильное меню Drawer (Пункт 17) -->
<div class="drawer-overlay" id="drawerOverlay"></div>
<aside class="mobile-drawer" id="mobileDrawer">
  <div class="mobile-drawer-header">
    <div class="brand-name" style="font-size:1.15rem;">Чемпион-<span>Теннис</span></div>
    <button id="mobileDrawerClose" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:#0f172a; padding:4px 8px;">&times;</button>
  </div>
  <nav class="mobile-drawer-nav">
    <a href="/" class="drawer-link">Главная страница</a>
    <a href="/news" class="drawer-link">Лента новостей</a>
    <a href="/news/atp" class="drawer-link" style="padding-left:24px;">— ATP Тур</a>
    <a href="/news/wta" class="drawer-link" style="padding-left:24px;">— WTA Тур</a>
    <a href="/news/grand-slam" class="drawer-link" style="padding-left:24px;">— Большой шлем</a>
    <a href="/news/team-russia" class="drawer-link" style="padding-left:24px;">— Сборная России</a>
    <a href="/news/padel-pickleball" class="drawer-link" style="padding-left:24px;">— Падел и Пиклбол</a>
    <a href="/tournaments" class="drawer-link">Турниры и календарь 2026</a>
    <a href="/rankings" class="drawer-link">Рейтинги ATP / WTA</a>
    <a href="/players" class="drawer-link">Игроки мирового тура</a>
    <a href="/blog" class="drawer-link">Аналитика и Блог</a>
    <a href="/gear" class="drawer-link">Ракетки и Экипировка 2026</a>
    <a href="/glossary" class="drawer-link">Глоссарий терминов</a>
    <a href="/about" class="drawer-link">О проекте и Редакция</a>
    <a href="/contacts" class="drawer-link">Контакты и Реклама</a>
    <a href="/sitemap" class="drawer-link">Карта сайта</a>
  </nav>
</aside>

<main class="page-main">
  <div class="container">
    <?php
    // =========================================================================
    // ГЛАВНАЯ СТРАНИЦА (Пункт 14: Title, H1 «Теннис: новости и аналитика», Description)
    // =========================================================================
    if ($route === '' || $route === 'index'):
        $stmtLive = $pdo->query("SELECT * FROM live_matches ORDER BY is_live DESC, id ASC");
        $liveMatches = $stmtLive->fetchAll();

        $stmtTopNews = $pdo->query("SELECT * FROM news WHERE is_hot_24h = 1 OR is_featured = 1 ORDER BY published_at DESC LIMIT 3");
        $topNews = $stmtTopNews->fetchAll();

        $stmtTopBlog = $pdo->query("SELECT * FROM articles WHERE is_editors_choice = 1 ORDER BY published_at DESC LIMIT 3");
        $topBlog = $stmtTopBlog->fetchAll();

        $top5Atp = $pdo->query("SELECT * FROM players WHERE gender = 'M' ORDER BY rank ASC LIMIT 5")->fetchAll();
        ?>
        <!-- Обязательный заголовок H1 по ТЗ (Пункт 14) -->
        <div class="section-title-bar" style="margin-bottom: 20px;">
          <h1 class="section-heading" style="font-size: 1.75rem; margin: 0; color: #074025;">
            <span class="heading-bar"></span>
            <span>Теннис: новости и аналитика</span>
          </h1>
        </div>

        <!-- Блок Live матчей -->
        <section class="matches-today-card" style="margin-bottom: 28px;">
          <div class="section-title-bar" style="padding:14px 20px 10px; margin:0;">
            <h2 class="section-heading" style="font-size:1.15rem;"><span class="live-pill"></span> Матчи сегодня: Live и результаты</h2>
          </div>
          <div class="match-items-list">
            <?php foreach ($liveMatches as $m): ?>
              <div class="match-row-item">
                <div class="match-status-col">
                  <span class="status-badge <?= $m['is_live'] ? 'live' : 'finished' ?>"><?= $m['status'] ?></span>
                  <div class="match-tourn-name"><?= htmlspecialchars($m['tournament_name']) ?></div>
                </div>
                <div class="match-competitors-col">
                  <div class="player-line"><strong><?= htmlspecialchars($m['player1_name']) ?></strong> (<?= $m['player1_country'] ?>)</div>
                  <div class="player-line"><strong><?= htmlspecialchars($m['player2_name']) ?></strong> (<?= $m['player2_country'] ?>)</div>
                </div>
                <div class="match-score-col"><?= htmlspecialchars($m['score']) ?></div>
              </div>
            <?php endforeach; ?>
          </div>
        </section>

        <div class="home-grid">
          <div>
            <!-- Главное за 24 часа (с датой ДД.ММ.ГГГГ ЧЧ:ММ и уникальными фото) -->
            <div class="section-title-bar">
              <h2 class="section-heading"><span class="heading-bar"></span> Главное за 24 часа</h2>
              <a href="/news" class="view-all-link">Все новости &rarr;</a>
            </div>
            <div class="top24-grid">
              <?php foreach ($topNews as $item): ?>
                <article class="news-card-featured">
                  <a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>" class="news-card-img-wrap">
                    <img src="<?= htmlspecialchars(resolveImg($item['image'])) ?>" alt="<?= htmlspecialchars($item['title']) ?>">
                    <span class="category-tag <?= $item['category'] ?>"><?= strtoupper($item['category']) ?></span>
                  </a>
                  <div class="news-card-body">
                    <div style="font-size:0.775rem; color:#64748b; margin-bottom:4px; font-weight:600;">
                      📅 <?= formatNewsDate($item['published_at']) ?>
                    </div>
                    <h3 class="news-card-title"><a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>"><?= htmlspecialchars($item['title']) ?></a></h3>
                    <p class="news-card-excerpt"><?= htmlspecialchars($item['excerpt']) ?></p>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>

            <!-- Выбор редакции: Аналитика -->
            <div class="section-title-bar" style="margin-top:36px;">
              <h2 class="section-heading"><span class="heading-bar" style="background:#c84c1f;"></span> Выбор редакции: Аналитика</h2>
              <a href="/blog" class="view-all-link">В блог &rarr;</a>
            </div>
            <div class="editors-choice-grid">
              <?php foreach ($topBlog as $art): ?>
                <article class="editors-card">
                  <img src="<?= htmlspecialchars(resolveImg($art['image'])) ?>" class="editors-img" alt="<?= htmlspecialchars($art['title']) ?>">
                  <div class="editors-body">
                    <div style="font-size:0.75rem; color:#64748b; margin-bottom:4px; font-weight:600;">
                      📅 <?= formatNewsDate($art['published_at']) ?> • ⏱️ <?= $art['reading_time'] ?> мин
                    </div>
                    <h3 class="editors-title"><a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>"><?= htmlspecialchars($art['title']) ?></a></h3>
                    <p class="editors-snippet"><?= htmlspecialchars($art['excerpt']) ?></p>
                    <a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>" class="btn-read-more">Читать далее &rarr;</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          </div>

          <!-- Боковая колонка -->
          <aside>
            <div class="sidebar-box">
              <div class="sidebar-box-header"><h3 class="sidebar-box-title">Рейтинг: Топ-5 ATP</h3></div>
              <div class="rankings-list">
                <?php foreach ($top5Atp as $p): ?>
                  <div class="rank-item">
                    <span class="rank-number">#<?= $p['rank'] ?></span>
                    <div class="rank-player-col"><span><?= $p['flag'] ?></span> <strong><?= htmlspecialchars($p['name']) ?></strong></div>
                    <span class="rank-points"><?= $p['points'] ?></span>
                  </div>
                <?php endforeach; ?>
              </div>
              <div style="padding:10px 16px; text-align:center; border-top:1px solid #f1f5f9;">
                <a href="/rankings" style="font-size:0.8125rem; font-weight:700; color:#0a5c36;">Полный рейтинг ATP и WTA &rarr;</a>
              </div>
            </div>

            <div class="cta-newsletter-card">
              <h3 class="cta-title">Теннисный дайджест 8:00</h3>
              <p class="cta-subtitle">Сводка ночных матчей и расклады экспертов каждое утро на вашу почту.</p>
              <form class="cta-form js-newsletter-form">
                <input type="email" class="cta-input" placeholder="Ваш e-mail" required>
                <div class="form-agree-wrap" style="color:rgba(255,255,255,0.85); font-size:0.75rem; margin:8px 0 10px 0;">
                  <input type="checkbox" name="agree" class="form-agree-checkbox" id="agree_home_newsletter" required style="accent-color:#ffffff; cursor:pointer;">
                  <label for="agree_home_newsletter" style="color:rgba(255,255,255,0.85); cursor:pointer;">
                    Нажимая кнопку, вы соглашаетесь с <a href="/privacy-policy" target="_blank" style="color:#ffffff; text-decoration:underline;">Политикой обработки данных</a>.
                  </label>
                </div>
                <button type="submit" class="btn-cta-submit">Подписаться</button>
              </form>
            </div>
          </aside>
        </div>

    <?php
    // =========================================================================
    // СТРАНИЦА ПОИСКА (/search)
    // =========================================================================
    elseif ($route === 'search'):
        $q = trim($_GET['q'] ?? '');
        $foundPages = [];
        $foundNews = [];
        $foundArticles = [];

        if (mb_strlen($q) >= 2) {
            $qLower = mb_strtolower($q, 'UTF-8');
            $allSections = [
                ['title' => 'Новости тенниса', 'url' => '/news', 'keys' => ['новости', 'лента новостей', 'теннисные новости', 'новости спорта', 'news', 'лента'], 'desc' => 'Главные события российского и мирового тенниса, туры ATP и WTA'],
                ['title' => 'ATP Тур (Мужчины)', 'url' => '/news/atp', 'keys' => ['atp', 'атп', 'мужской теннис', 'мужчины'], 'desc' => 'Новости и результаты матчей мужского тура ATP'],
                ['title' => 'WTA Тур (Женщины)', 'url' => '/news/wta', 'keys' => ['wta', 'вта', 'женский теннис', 'женщины'], 'desc' => 'Новости и результаты матчей женского тура WTA'],
                ['title' => 'Большой шлем (Grand Slam)', 'url' => '/news/grand-slam', 'keys' => ['шлем', 'большой шлем', 'grand slam', 'уимблдон', 'ролан гаррос', 'us open', 'australian open'], 'desc' => 'Турниры Большого шлема'],
                ['title' => 'Сборная России и РТТ', 'url' => '/news/team-russia', 'keys' => ['россия', 'сборная', 'ртт', 'российский теннис', 'team russia', 'кубок кремля'], 'desc' => 'Сборная России и национальный тур РТТ'],
                ['title' => 'Падел и Пиклбол', 'url' => '/news/padel-pickleball', 'keys' => ['падел', 'пиклбол', 'падл', 'padel', 'pickleball'], 'desc' => 'Развитие падела и пиклбола в России и мире'],
                ['title' => 'Аналитика и Блог о теннисе', 'url' => '/blog', 'keys' => ['блог', 'аналитика', 'статьи', 'разборы', 'авторские материалы', 'мнения', 'blog', 'колонка', 'статья'], 'desc' => 'Авторские статьи экспертов, тактические разборы и исторические хроники'],
                ['title' => 'Календарь теннисных турниров 2026', 'url' => '/tournaments', 'keys' => ['турниры', 'календарь', 'расписание', 'турнирная сетка', 'сетка', 'мастерс', 'tournaments', 'турнир'], 'desc' => 'Календарь турниров Большого шлема, Мастерс 1000 и соревнований в РФ'],
                ['title' => 'Официальные рейтинги ATP и WTA', 'url' => '/rankings', 'keys' => ['рейтинг', 'рейтинги', 'топ', 'ранкинг', 'rankings', 'очки', 'первая ракетка', 'таблица'], 'desc' => 'Официальная таблица очков мирового рейтинга теннисистов и теннисисток'],
                ['title' => 'Звезды тенниса и профили игроков', 'url' => '/players', 'keys' => ['игроки', 'теннисисты', 'теннисистки', 'профили', 'игрок', 'players', 'биографии'], 'desc' => 'Досье, статистика и достижения ведущих спортсменов'],
                ['title' => 'Ракетки и Экипировка 2026', 'url' => '/gear', 'keys' => ['экипировка', 'ракетки', 'струны', 'кроссовки', 'мячи', 'gear', 'wilson', 'babolat', 'head', 'yonex', 'ракетка'], 'desc' => 'Гид по выбору профессиональных ракеток и обуви для корта'],
                ['title' => 'Глоссарий теннисных терминов', 'url' => '/glossary', 'keys' => ['глоссарий', 'термины', 'словарь', 'тай-брейк', 'эйс', 'брейк', 'слайс', 'glossary'], 'desc' => 'Справочник профессиональной терминологии'],
                ['title' => 'О проекте и Редакция', 'url' => '/about', 'keys' => ['о проекте', 'редакция', 'о нас', 'команда', 'журналисты', 'авторы', 'about'], 'desc' => 'Информация о портале Champion-Tennis.ru и составе редакции'],
                ['title' => 'Контакты и Размещение Рекламы', 'url' => '/contacts', 'keys' => ['контакты', 'реклама', 'связь', 'сотрудничество', 'contacts'], 'desc' => 'Контакты дежурного редактора и коммерческого отдела'],
                ['title' => 'Правила пользования сайтом', 'url' => '/site-rules', 'keys' => ['правила', 'правила сайта', 'правила пользования', 'site rules', 'модерация'], 'desc' => 'Регламент поведения на сайте и публикации'],
                ['title' => 'Пользовательское соглашение', 'url' => '/user-agreement', 'keys' => ['соглашение', 'пользовательское соглашение', 'условия'], 'desc' => 'Официальное пользовательское соглашение'],
                ['title' => 'Политика конфиденциальности (152-ФЗ)', 'url' => '/privacy-policy', 'keys' => ['политика', 'конфиденциальность', '152-фз', 'персональные данные', 'privacy policy'], 'desc' => 'Политика обработки персональных данных'],
                ['title' => 'Карта сайта', 'url' => '/sitemap', 'keys' => ['карта сайта', 'навигация', 'sitemap', 'все разделы'], 'desc' => 'Полная иерархическая карта разделов']
            ];

            foreach ($allSections as $s) {
                if (mb_stripos($s['title'], $q, 0, 'UTF-8') !== false || mb_stripos($s['desc'], $q, 0, 'UTF-8') !== false) {
                    $foundPages[] = $s;
                } else {
                    foreach ($s['keys'] as $k) {
                        if (mb_stripos($k, $qLower, 0, 'UTF-8') !== false || mb_stripos($qLower, $k, 0, 'UTF-8') !== false) {
                            $foundPages[] = $s;
                            break;
                        }
                    }
                }
            }

            $stN = $pdo->prepare("SELECT * FROM news WHERE title LIKE ? OR excerpt LIKE ? OR content LIKE ? ORDER BY published_at DESC LIMIT 20");
            $stN->execute(["%$q%", "%$q%", "%$q%"]);
            $foundNews = $stN->fetchAll();

            $stA = $pdo->prepare("SELECT * FROM articles WHERE title LIKE ? OR excerpt LIKE ? OR content LIKE ? ORDER BY published_at DESC LIMIT 10");
            $stA->execute(["%$q%", "%$q%", "%$q%"]);
            $foundArticles = $stA->fetchAll();
        }
        echo renderBreadcrumbs([['title'=>'Поиск', 'url'=>'']]);
        ?>
        <div class="article-container" style="max-width:960px;">
          <h1 class="article-title-main">Результаты поиска: «<?= htmlspecialchars($q) ?>»</h1>
          <p style="color:#64748b; margin-bottom:24px;">Найдено совпадений: <?= count($foundPages) + count($foundNews) + count($foundArticles) ?></p>

          <?php if (empty($foundPages) && empty($foundNews) && empty($foundArticles)): ?>
            <p>По вашему запросу ничего не найдено. Попробуйте изменить формулировку (например: Медведев, Рим, ракетки, падел).</p>
          <?php else: ?>
            <?php if (!empty($foundPages)): ?>
              <h2 style="font-size:1.3rem; margin:24px 0 16px; color:#0f172a; display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:6px; height:22px; background:#0a5c36; border-radius:3px;"></span>
                Разделы и страницы сайта
              </h2>
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px; margin-bottom:28px;">
                <?php foreach ($foundPages as $p): ?>
                  <a href="<?= $p['url'] ?>" style="display:block; padding:16px 18px; background:white; border:1px solid #cbd5e1; border-radius:8px; text-decoration:none; transition:all 0.2s;" onmouseover="this.style.borderColor='#0a5c36'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)';" onmouseout="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none';">
                    <span style="font-size:0.7rem; font-weight:700; text-transform:uppercase; background:#dcfce7; color:#166534; padding:2px 7px; border-radius:4px;">Страница</span>
                    <strong style="display:block; margin:6px 0 4px; color:#0f172a; font-size:1.05rem;"><?= htmlspecialchars($p['title']) ?></strong>
                    <div style="font-size:0.8125rem; color:#64748b; line-height:1.4;"><?= htmlspecialchars($p['desc']) ?></div>
                    <div style="margin-top:8px; font-size:0.8rem; font-weight:700; color:#0a5c36;">Перейти в раздел &rarr;</div>
                  </a>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>

            <?php if (!empty($foundNews)): ?>
              <h2 style="font-size:1.3rem; margin:24px 0 16px; color:#0a5c36;">Новости</h2>
              <div style="display:flex; flex-direction:column; gap:16px;">
                <?php foreach ($foundNews as $item): ?>
                  <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:16px; display:flex; gap:16px; align-items:center;">
                    <img src="<?= htmlspecialchars(resolveImg($item['image'])) ?>" style="width:100px; height:70px; object-fit:cover; border-radius:6px; flex-shrink:0;" alt="">
                    <div>
                      <div style="font-size:0.75rem; color:#64748b; font-weight:600;"><?= formatNewsDate($item['published_at']) ?> • <?= strtoupper($item['category']) ?></div>
                      <h3 style="margin:4px 0; font-size:1.05rem;"><a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>" style="color:#0f172a;"><?= htmlspecialchars($item['title']) ?></a></h3>
                      <p style="font-size:0.875rem; color:#475569; margin:0;"><?= htmlspecialchars($item['excerpt']) ?></p>
                    </div>
                  </div>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>

            <?php if (!empty($foundArticles)): ?>
              <h2 style="font-size:1.3rem; margin:32px 0 16px; color:#c84c1f;">Статьи и Аналитика</h2>
              <div style="display:flex; flex-direction:column; gap:16px;">
                <?php foreach ($foundArticles as $art): ?>
                  <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:16px; display:flex; gap:16px; align-items:center;">
                    <img src="<?= htmlspecialchars(resolveImg($art['image'])) ?>" style="width:100px; height:70px; object-fit:cover; border-radius:6px; flex-shrink:0;" alt="">
                    <div>
                      <div style="font-size:0.75rem; color:#64748b; font-weight:600;"><?= formatNewsDate($art['published_at']) ?> • Автор: <?= htmlspecialchars($art['author_name']) ?></div>
                      <h3 style="margin:4px 0; font-size:1.05rem;"><a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>" style="color:#0f172a;"><?= htmlspecialchars($art['title']) ?></a></h3>
                      <p style="font-size:0.875rem; color:#475569; margin:0;"><?= htmlspecialchars($art['excerpt']) ?></p>
                    </div>
                  </div>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          <?php endif; ?>
        </div>

    <?php
    // =========================================================================
    // ОДИНОЧНАЯ СТАТЬЯ БЛОГА (Пункт 1: исправление роутинга /blog/:category/:slug)
    // Пункт 11: 1-2 автора с фото и описанием
    // Пункт 12: «Советуем почитать» с 3 карточками
    // =========================================================================
    elseif ($route === 'blog' && (!empty($subSubRoute) || (!empty($subRoute) && !isset($blogCategories[$subRoute])))):
        $articleSlug = !empty($subSubRoute) ? $subSubRoute : $subRoute;
        $stBlog = $pdo->prepare("SELECT * FROM articles WHERE slug = ?");
        $stBlog->execute([$articleSlug]);
        $article = $stBlog->fetch();

        if (!$article):
            echo '<h1>Статья блога не найдена</h1><p><a href="/blog">Вернуться ко всем статьям</a></p>';
        else:
            // Инкремент просмотров
            $pdo->prepare("UPDATE articles SET views = views + 1 WHERE id = ?")->execute([$article['id']]);
            $categoryTitle = $blogCategories[$article['category']] ?? 'Аналитика';
            echo renderBreadcrumbs([
                ['title' => 'Аналитика и Блог', 'url' => '/blog'],
                ['title' => $categoryTitle, 'url' => '/blog/' . $article['category']],
                ['title' => $article['title'], 'url' => '']
            ]);

            // Получаем 3 последние статьи для блока «Советуем почитать» (Пункт 12)
            $stRec = $pdo->prepare("SELECT * FROM articles WHERE id != ? ORDER BY published_at DESC LIMIT 3");
            $stRec->execute([$article['id']]);
            $recommendedArticles = $stRec->fetchAll();
            ?>
            <article class="article-container">
              <header class="article-header">
                <div style="display:flex; gap:8px; margin-bottom:12px;">
                  <span class="category-tag" style="background:#c84c1f; color:white; padding:4px 10px; border-radius:4px; font-weight:700; font-size:0.75rem;">
                    <?= htmlspecialchars($categoryTitle) ?>
                  </span>
                  <span style="font-size:0.75rem; background:#f1f5f9; padding:4px 8px; border-radius:4px; color:#64748b; font-weight:600;">
                    Экспертная колонка
                  </span>
                </div>

                <h1 class="article-title-main"><?= htmlspecialchars($article['title']) ?></h1>

                <div class="article-meta-bar">
                  <div class="article-author-info" style="display:flex; align-items:center; gap:10px;">
                    <img src="<?= htmlspecialchars(resolveImg($article['author_avatar'] ?: '/images/author-coach.jpg')) ?>" alt="<?= htmlspecialchars($article['author_name']) ?>" style="width:38px; height:38px; border-radius:50%; object-fit:cover;">
                    <div>
                      <div class="author-name-text" style="font-weight:700;"><?= htmlspecialchars($article['author_name']) ?></div>
                      <div class="author-role-sub" style="font-size:0.75rem; color:#64748b;"><?= htmlspecialchars($article['author_role']) ?></div>
                    </div>
                  </div>
                  <div style="display:flex; gap:16px; align-items:center; font-size:0.8125rem; color:#64748b;">
                    <span>⏱️ <?= $article['reading_time'] ?> мин чтения</span>
                    <span>👁️ <?= $article['views'] + 1 ?> просмотров</span>
                    <span>📅 <?= formatNewsDate($article['published_at']) ?></span>
                  </div>
                </div>
              </header>

              <?php if ($article['image']): ?>
                <img src="<?= htmlspecialchars(resolveImg($article['image'])) ?>" alt="<?= htmlspecialchars($article['title']) ?>" class="article-hero-cover" style="width:100%; border-radius:8px; margin:20px 0; max-height:480px; object-fit:cover;">
              <?php endif; ?>

              <div class="article-content" style="font-size:1.05rem; line-height:1.75; color:#1e293b;">
                <p style="font-size:1.15rem; font-weight:600; color:#334155; border-left:4px solid #c84c1f; padding-left:14px; margin-bottom:24px;">
                  <?= htmlspecialchars($article['excerpt']) ?>
                </p>
                <?= $article['content'] ?>
              </div>

              <!-- Шаринг материала в соцсети и мессенджеры (Требование 9) -->
              <?= renderShareBlock('https://champion-tennis.ru/blog/' . $article['category'] . '/' . $article['slug'], $article['title'], 'материалом') ?>

              <!-- Блок авторов (Пункт 11: 1-2 автора с фото, именем-фамилией и данными со страницы О проекте) -->
              <div class="article-authors-card" style="margin-top:40px; padding:24px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;">
                <h3 style="font-size:1.15rem; font-weight:800; color:#074025; margin:0 0 18px 0; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:6px; height:20px; background:#0a5c36; border-radius:3px;"></span>
                  Авторы и эксперты публикации
                </h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                  <div style="display:flex; gap:14px; align-items:flex-start;">
                    <img src="/images/author-coach.jpg" alt="Михаил Соколов" style="width:64px; height:64px; border-radius:50%; object-fit:cover; flex-shrink:0; border:2px solid #0a5c36;">
                    <div>
                      <div style="font-weight:800; font-size:1rem; color:#0f172a;">Михаил Соколов</div>
                      <div style="font-size:0.8rem; color:#0a5c36; font-weight:700; margin-bottom:4px;">Главный редактор, мастер спорта по теннису</div>
                      <p style="font-size:0.8125rem; color:#64748b; line-height:1.45; margin:0;">В теннисе более 20 лет. Экс-игрок турниров РТТ и Futures. Автор более 500 аналитических колонок о биомеханике и тактике мирового тура.</p>
                    </div>
                  </div>
                  <div style="display:flex; gap:14px; align-items:flex-start;">
                    <img src="/images/author-analyst.jpg" alt="Екатерина Романова" style="width:64px; height:64px; border-radius:50%; object-fit:cover; flex-shrink:0; border:2px solid #c84c1f;">
                    <div>
                      <div style="font-weight:800; font-size:1rem; color:#0f172a;">Екатерина Романова</div>
                      <div style="font-size:0.8rem; color:#c84c1f; font-weight:700; margin-bottom:4px;">Ведущий аналитик тура WTA и экипировки</div>
                      <p style="font-size:0.8125rem; color:#64748b; line-height:1.45; margin:0;">Спортивный журналист, постоянный обозреватель турниров Большого шлема. Эксперт по подбору ракеток и спортивной биомеханике.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Блок «Советуем почитать» (Пункт 12: 3 кликабельные карточки последних статей блога) -->
              <div class="recommended-blog-section" style="margin-top:40px; padding-top:28px; border-top:2px solid #e2e8f0;">
                <h3 style="font-size:1.35rem; font-weight:800; margin-bottom:20px; color:#0f172a; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:6px; height:24px; background:#c84c1f; border-radius:3px;"></span>
                  Советуем почитать
                </h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px;">
                  <?php foreach ($recommendedArticles as $rec): ?>
                    <article class="editors-card" style="margin:0;">
                      <a href="/blog/<?= $rec['category'] ?>/<?= $rec['slug'] ?>" style="display:block; overflow:hidden; border-radius:6px;">
                        <img src="<?= htmlspecialchars(resolveImg($rec['image'])) ?>" class="editors-img" alt="<?= htmlspecialchars($rec['title']) ?>" style="width:100%; aspect-ratio:16/10; object-fit:cover;">
                      </a>
                      <div class="editors-body" style="padding:14px 0 0 0;">
                        <div style="font-size:0.75rem; color:#64748b; margin-bottom:4px; font-weight:600;">
                          📅 <?= formatNewsDate($rec['published_at']) ?> • ⏱️ <?= $rec['reading_time'] ?> мин
                        </div>
                        <h4 style="margin:0 0 8px; font-size:1rem; font-weight:800; line-height:1.4;">
                          <a href="/blog/<?= $rec['category'] ?>/<?= $rec['slug'] ?>" style="color:#0f172a; text-decoration:none;">
                            <?= htmlspecialchars($rec['title']) ?>
                          </a>
                        </h4>
                        <p style="font-size:0.8125rem; color:#475569; margin:0 0 10px 0; line-height:1.45;"><?= htmlspecialchars(mb_substr($rec['excerpt'], 0, 100)) ?>...</p>
                        <a href="/blog/<?= $rec['category'] ?>/<?= $rec['slug'] ?>" class="btn-read-more" style="font-size:0.8125rem;">Читать статью &rarr;</a>
                      </div>
                    </article>
                  <?php endforeach; ?>
                </div>
              </div>
            </article>
            <?php
        endif;

    // =========================================================================
    // ХАБ И КАТЕГОРИИ БЛОГА (/blog или /blog/:category)
    // =========================================================================
    elseif ($route === 'blog'):
        $catFilter = !empty($subRoute) && isset($blogCategories[$subRoute]) ? $subRoute : null;
        if ($catFilter) {
            $stmt = $pdo->prepare("SELECT * FROM articles WHERE category = ? ORDER BY published_at DESC");
            $stmt->execute([$catFilter]);
            $articles = $stmt->fetchAll();
            $hubTitle = 'Блог: ' . $blogCategories[$catFilter];
            echo renderBreadcrumbs([
                ['title' => 'Аналитика и Блог', 'url' => '/blog'],
                ['title' => $blogCategories[$catFilter], 'url' => '']
            ]);
        } else {
            $articles = $pdo->query("SELECT * FROM articles ORDER BY published_at DESC")->fetchAll();
            $hubTitle = 'Аналитика и Блог о теннисе';
            echo renderBreadcrumbs([['title' => 'Аналитика и Блог', 'url' => '']]);
        }
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar" style="background:#c84c1f;"></span> <?= htmlspecialchars($hubTitle) ?></h1>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
          <?php foreach ($articles as $art): ?>
            <article class="editors-card">
              <a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>"><img src="<?= htmlspecialchars(resolveImg($art['image'])) ?>" class="editors-img" alt=""></a>
              <div class="editors-body">
                <div style="font-size:0.75rem; color:#64748b; margin-bottom:4px; font-weight:600;">
                  📅 <?= formatNewsDate($art['published_at']) ?> • ⏱️ <?= $art['reading_time'] ?> мин • <?= htmlspecialchars($art['author_name']) ?>
                </div>
                <h2 class="editors-title"><a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>"><?= htmlspecialchars($art['title']) ?></a></h2>
                <p class="editors-snippet"><?= htmlspecialchars($art['excerpt']) ?></p>
                <a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>" class="btn-read-more">Читать разбор &rarr;</a>
              </div>
            </article>
          <?php endforeach; ?>
        </div>

    <?php
    // =========================================================================
    // ОДИНОЧНАЯ НОВОСТЬ (/news/:category/:slug или /news/:slug)
    // Пункт 3: Дата ДД.ММ.ГГГГ ЧЧ:ММ, блок «Еще новости» с 3 последними новостями, уникальные фото
    // =========================================================================
    elseif ($route === 'news' && (!empty($subSubRoute) || (!empty($subRoute) && !isset($newsCategories[$subRoute])))):
        $newsSlug = !empty($subSubRoute) ? $subSubRoute : $subRoute;
        $stNews = $pdo->prepare("SELECT * FROM news WHERE slug = ?");
        $stNews->execute([$newsSlug]);
        $newsItem = $stNews->fetch();

        if (!$newsItem):
            echo '<h1>Новость не найдена</h1><p><a href="/news">В ленту новостей</a></p>';
        else:
            $pdo->prepare("UPDATE news SET views = views + 1 WHERE id = ?")->execute([$newsItem['id']]);
            $categoryName = $newsCategories[$newsItem['category']] ?? strtoupper($newsItem['category']);
            echo renderBreadcrumbs([
                ['title' => 'Новости', 'url' => '/news'],
                ['title' => $categoryName, 'url' => '/news/' . $newsItem['category']],
                ['title' => $newsItem['title'], 'url' => '']
            ]);

            // 3 последние новости для блока «Еще новости» (Пункт 3)
            $stMore = $pdo->prepare("SELECT * FROM news WHERE id != ? ORDER BY published_at DESC LIMIT 3");
            $stMore->execute([$newsItem['id']]);
            $moreNews = $stMore->fetchAll();
            ?>
            <article class="article-container">
              <header class="article-header">
                <div style="display:flex; gap:8px; margin-bottom:12px;">
                  <span class="category-tag <?= htmlspecialchars($newsItem['category']) ?>" style="position:static;">
                    <?= htmlspecialchars($categoryName) ?>
                  </span>
                  <span style="font-size:0.75rem; background:#f1f5f9; padding:3px 8px; border-radius:4px; color:#64748b; font-weight:600;">
                    Источник: <?= htmlspecialchars($newsItem['source_name'] ?: 'Служба новостей') ?>
                  </span>
                </div>

                <h1 class="article-title-main"><?= htmlspecialchars($newsItem['title']) ?></h1>

                <div class="article-meta-bar" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                  <div class="article-author-info">
                    <span style="font-weight:700;">Автор: <?= htmlspecialchars($newsItem['author']) ?></span>
                    <span style="color:#cbd5e1;">•</span>
                    <!-- Дата и время в формате ДД.ММ.ГГГГ ЧЧ:ММ (Пункт 3) -->
                    <span><strong>📅 <?= formatNewsDate($newsItem['published_at']) ?></strong> (МСК)</span>
                  </div>
                  <div>👁️ <strong><?= $newsItem['views'] + 1 ?></strong> просмотров</div>
                </div>
              </header>

              <?php if ($newsItem['image']): ?>
                <img src="<?= htmlspecialchars(resolveImg($newsItem['image'])) ?>" alt="<?= htmlspecialchars($newsItem['title']) ?>" class="article-hero-cover" style="width:100%; border-radius:8px; margin:20px 0; max-height:480px; object-fit:cover;">
              <?php endif; ?>

              <div class="article-content" style="font-size:1.05rem; line-height:1.75; color:#1e293b;">
                <p style="font-size:1.15rem; font-weight:600; color:#334155; border-left:4px solid #0a5c36; padding-left:14px; margin-bottom:24px;">
                  <?= htmlspecialchars($newsItem['excerpt']) ?>
                </p>
                <?= $newsItem['content'] ?>
              </div>

              <!-- Шаринг новости в соцсети и мессенджеры (Требование 9) -->
              <?= renderShareBlock('https://champion-tennis.ru/news/' . $newsItem['category'] . '/' . $newsItem['slug'], $newsItem['title'], 'новостью') ?>

              <!-- Блок «Еще новости» с 3 карточками (Пункт 3: надпись «Еще новости», формат ДД.ММ.ГГГГ ЧЧ:ММ, уникальные картинки) -->
              <div class="more-news-section" style="margin-top:40px; padding-top:28px; border-top:2px solid #e2e8f0;">
                <h3 style="font-size:1.35rem; font-weight:800; margin-bottom:20px; color:#0f172a; display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block; width:6px; height:24px; background:#0a5c36; border-radius:3px;"></span>
                  Еще новости
                </h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px;">
                  <?php foreach ($moreNews as $mn): ?>
                    <article class="news-card-featured" style="margin:0;">
                      <a href="/news/<?= $mn['category'] ?>/<?= $mn['slug'] ?>" class="news-card-img-wrap" style="aspect-ratio:16/10;">
                        <img src="<?= htmlspecialchars(resolveImg($mn['image'])) ?>" alt="<?= htmlspecialchars($mn['title']) ?>">
                        <span class="category-tag <?= $mn['category'] ?>"><?= strtoupper($mn['category']) ?></span>
                      </a>
                      <div class="news-card-body">
                        <div style="font-size:0.775rem; color:#64748b; margin-bottom:4px; font-weight:600;">
                          📅 <?= formatNewsDate($mn['published_at']) ?>
                        </div>
                        <h4 class="news-card-title" style="font-size:0.95rem;">
                          <a href="/news/<?= $mn['category'] ?>/<?= $mn['slug'] ?>"><?= htmlspecialchars($mn['title']) ?></a>
                        </h4>
                      </div>
                    </article>
                  <?php endforeach; ?>
                </div>
              </div>
            </article>
            <?php
        endif;

    // =========================================================================
    // ЛЕНТА НОВОСТЕЙ И КАТЕГОРИИ (Пункт 15: фильтрация при клике на рубрику)
    // =========================================================================
    elseif ($route === 'news'):
        $catFilter = !empty($subRoute) && isset($newsCategories[$subRoute]) ? $subRoute : null;

        if ($catFilter) {
            $stmt = $pdo->prepare("SELECT * FROM news WHERE category = ? ORDER BY published_at DESC LIMIT 40");
            $stmt->execute([$catFilter]);
            $newsList = $stmt->fetchAll();
            $newsHeader = $newsCategories[$catFilter];
            echo renderBreadcrumbs([
                ['title' => 'Новости', 'url' => '/news'],
                ['title' => $newsHeader, 'url' => '']
            ]);
        } else {
            $newsList = $pdo->query("SELECT * FROM news ORDER BY published_at DESC LIMIT 40")->fetchAll();
            $newsHeader = 'Лента новостей тенниса';
            echo renderBreadcrumbs([['title' => 'Новости', 'url' => '']]);
        }
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar"></span> <?= htmlspecialchars($newsHeader) ?></h1>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
          <?php foreach ($newsList as $item): ?>
            <article class="news-card-featured">
              <a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>" class="news-card-img-wrap">
                <img src="<?= htmlspecialchars(resolveImg($item['image'])) ?>" alt="<?= htmlspecialchars($item['title']) ?>">
                <span class="category-tag <?= $item['category'] ?>"><?= strtoupper($item['category']) ?></span>
              </a>
              <div class="news-card-body">
                <!-- Дата и время ДД.ММ.ГГГГ ЧЧ:ММ (Пункт 3) -->
                <div style="font-size:0.775rem; color:#64748b; margin-bottom:4px; font-weight:600;">
                  📅 <?= formatNewsDate($item['published_at']) ?>
                </div>
                <h2 class="news-card-title"><a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>"><?= htmlspecialchars($item['title']) ?></a></h2>
                <p class="news-card-excerpt"><?= htmlspecialchars($item['excerpt']) ?></p>
              </div>
            </article>
          <?php endforeach; ?>
        </div>

    <?php
    // =========================================================================
    // ТУРНИРЫ И КАЛЕНДАРЬ (/tournaments)
    // =========================================================================
    elseif ($route === 'tournaments'):
        echo renderBreadcrumbs([['title'=>'Турниры и календарь', 'url'=>'']]);
        $tournaments = $pdo->query("SELECT * FROM tournaments ORDER BY id ASC")->fetchAll();
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar"></span> Календарь теннисных турниров сезона 2026</h1>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>Даты</th><th>Турнир</th><th>Категория</th><th>Покрытие</th><th>Локация</th><th>Призовой фонд</th><th>Статус</th></tr></thead>
            <tbody>
              <?php foreach ($tournaments as $t): ?>
                <tr>
                  <td><strong><?= htmlspecialchars($t['dates']) ?></strong></td>
                  <td><strong><?= htmlspecialchars($t['name']) ?></strong></td>
                  <td><?= htmlspecialchars($t['tier']) ?></td>
                  <td><?= htmlspecialchars($t['surface']) ?></td>
                  <td><?= htmlspecialchars($t['location']) ?></td>
                  <td><?= htmlspecialchars($t['prize_money']) ?></td>
                  <td><span class="status-badge <?= $t['status'] === 'Live' ? 'live' : 'finished' ?>"><?= $t['status'] ?></span></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>

    <?php
    // =========================================================================
    // РЕЙТИНГИ ATP И WTA (/rankings)
    // =========================================================================
    elseif ($route === 'rankings'):
        $type = $_GET['type'] ?? 'atp';
        $gender = $type === 'wta' ? 'F' : 'M';
        $stRank = $pdo->prepare("SELECT * FROM players WHERE gender = ? ORDER BY rank ASC");
        $stRank->execute([$gender]);
        $playersList = $stRank->fetchAll();
        echo renderBreadcrumbs([['title'=>'Рейтинги ATP / WTA', 'url'=>'']]);
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar"></span> Официальные рейтинги ATP и WTA</h1>
          <div style="display:flex; gap:8px;">
            <a href="/rankings?type=atp" class="subnav-item <?= $type === 'atp' ? 'active' : '' ?>">ATP (Мужчины)</a>
            <a href="/rankings?type=wta" class="subnav-item <?= $type === 'wta' ? 'active' : '' ?>">WTA (Женщины)</a>
          </div>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Игрок</th><th>Страна</th><th>Возраст</th><th>Очки</th><th>Титулы</th></tr></thead>
            <tbody>
              <?php foreach ($playersList as $p): ?>
                <tr>
                  <td><strong>#<?= $p['rank'] ?></strong></td>
                  <td><strong><?= htmlspecialchars($p['name']) ?></strong></td>
                  <td><?= $p['flag'] ?> <?= htmlspecialchars($p['country']) ?></td>
                  <td><?= $p['age'] ?></td>
                  <td><strong><?= $p['points'] ?></strong></td>
                  <td><?= $p['titles'] ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>

    <?php
    // =========================================================================
    // ИГРОКИ (/players)
    // =========================================================================
    elseif ($route === 'players'):
        echo renderBreadcrumbs([['title'=>'Игроки мирового тура', 'url'=>'']]);
        $players = $pdo->query("SELECT * FROM players ORDER BY rank ASC")->fetchAll();
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar"></span> Звезды мирового и российского тенниса</h1>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
          <?php foreach ($players as $p): ?>
            <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden; padding:16px;">
              <img src="<?= htmlspecialchars(resolveImg($p['image'])) ?>" style="width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:6px;" alt="<?= htmlspecialchars($p['name']) ?>">
              <h3 style="margin:10px 0 4px;"><?= htmlspecialchars($p['name']) ?></h3>
              <p style="font-size:0.8rem; color:#64748b;"><?= $p['flag'] ?> <?= htmlspecialchars($p['country']) ?> • Рейтинг #<?= $p['rank'] ?></p>
              <p style="font-size:0.84rem; color:#334155; margin-top:8px;"><?= htmlspecialchars($p['bio']) ?></p>
            </div>
          <?php endforeach; ?>
        </div>

    <?php
    // =========================================================================
    // РАКЕТКИ И ЭКИПИРОВКА 2026 (/gear)
    // =========================================================================
    elseif ($route === 'gear'):
        echo renderBreadcrumbs([['title'=>'Ракетки и Экипировка 2026', 'url'=>'']]);
        $gear = $pdo->query("SELECT * FROM gear_reviews ORDER BY id ASC")->fetchAll();
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar" style="background:#059669;"></span> Обзоры ракеток и экипировки 2026</h1>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
          <?php foreach ($gear as $g): ?>
            <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden; padding:20px;">
              <img src="<?= htmlspecialchars(resolveImg($g['image'])) ?>" style="width:100%; aspect-ratio:16/10; object-fit:cover; border-radius:6px;" alt="<?= htmlspecialchars($g['title']) ?>">
              <div style="display:flex; justify-content:space-between; margin-top:14px; align-items:center;">
                <span class="category-tag" style="background:#059669; color:white; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.75rem;"><?= htmlspecialchars($g['brand']) ?></span>
                <strong style="color:#c84c1f; font-size:1.1rem;"><?= htmlspecialchars($g['price']) ?></strong>
              </div>
              <h3 style="margin:12px 0 8px; font-size:1.15rem;"><?= htmlspecialchars($g['title']) ?></h3>
              <div style="font-size:0.875rem; color:#475569;"><?= $g['content'] ?></div>
            </div>
          <?php endforeach; ?>
        </div>

    <?php
    // =========================================================================
    // ГЛОССАРИЙ (/glossary)
    // =========================================================================
    elseif ($route === 'glossary'):
        echo renderBreadcrumbs([['title'=>'Глоссарий терминов', 'url'=>'']]);
        $glossary = $pdo->query("SELECT * FROM glossary ORDER BY term ASC")->fetchAll();
        ?>
        <div class="section-title-bar">
          <h1 class="section-heading"><span class="heading-bar"></span> Глоссарий теннисных терминов (А-Я)</h1>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
          <?php foreach ($glossary as $item): ?>
            <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; padding:18px;">
              <h3 style="color:#0a5c36; margin-bottom:8px; font-size:1.1rem; font-weight:800;"><?= htmlspecialchars($item['term']) ?></h3>
              <p style="font-size:0.875rem; color:#334155; line-height:1.55; margin:0;"><?= htmlspecialchars($item['definition']) ?></p>
            </div>
          <?php endforeach; ?>
        </div>

    <?php
    // =========================================================================
    // КАРТА САЙТА (Пункт 13: вывод всех кликабельных страниц с Title и URL)
    // =========================================================================
    elseif ($route === 'sitemap'):
        echo renderBreadcrumbs([['title'=>'Карта сайта', 'url'=>'']]);
        $allNews = $pdo->query("SELECT title, category, slug FROM news ORDER BY published_at DESC")->fetchAll();
        $allArticles = $pdo->query("SELECT title, category, slug FROM articles ORDER BY published_at DESC")->fetchAll();
        $allPages = $pdo->query("SELECT title, slug FROM pages ORDER BY id ASC")->fetchAll();
        $allGear = $pdo->query("SELECT title, brand FROM gear_reviews ORDER BY id ASC")->fetchAll();
        ?>
        <div class="article-container" style="max-width:980px;">
          <header class="article-header">
            <h1 class="article-title-main">Карта сайта Champion-Tennis.ru</h1>
            <p style="font-size:1rem; color:#64748b;">
              Полный каталог всех разделов, новостей, аналитических статей и страниц портала. Нажмите на любую ссылку для перехода.
            </p>
          </header>

          <div style="display:flex; flex-direction:column; gap:32px; margin-top:24px;">
            <!-- Основные страницы и разделы -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
              <h2 style="font-size:1.2rem; font-weight:800; color:#0a5c36; margin-bottom:14px; border-bottom:2px solid #0a5c36; padding-bottom:6px;">
                🏆 Основные разделы портала
              </h2>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
                <li><a href="/" style="font-weight:700; color:#0f172a;">Главная страница: Теннис: новости и аналитика</a> — <code>https://champion-tennis.ru/</code></li>
                <li><a href="/news" style="font-weight:700; color:#0f172a;">Лента новостей тенниса</a> — <code>https://champion-tennis.ru/news</code></li>
                <li><a href="/tournaments" style="font-weight:700; color:#0f172a;">Календарь теннисных турниров 2026</a> — <code>https://champion-tennis.ru/tournaments</code></li>
                <li><a href="/rankings" style="font-weight:700; color:#0f172a;">Официальные рейтинги ATP и WTA</a> — <code>https://champion-tennis.ru/rankings</code></li>
                <li><a href="/players" style="font-weight:700; color:#0f172a;">Игроки мирового тура</a> — <code>https://champion-tennis.ru/players</code></li>
                <li><a href="/blog" style="font-weight:700; color:#0f172a;">Аналитика и Блог о теннисе</a> — <code>https://champion-tennis.ru/blog</code></li>
                <li><a href="/gear" style="font-weight:700; color:#0f172a;">Ракетки и Экипировка 2026</a> — <code>https://champion-tennis.ru/gear</code></li>
                <li><a href="/glossary" style="font-weight:700; color:#0f172a;">Глоссарий теннисных терминов</a> — <code>https://champion-tennis.ru/glossary</code></li>
              </ul>
            </div>

            <!-- Рубрики новостей -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
              <h2 style="font-size:1.2rem; font-weight:800; color:#0a5c36; margin-bottom:14px; border-bottom:2px solid #0a5c36; padding-bottom:6px;">
                📰 Рубрики новостей тенниса
              </h2>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
                <li><a href="/news/atp" style="font-weight:700; color:#0f172a;">ATP Тур (Мужчины)</a> — <code>https://champion-tennis.ru/news/atp</code></li>
                <li><a href="/news/wta" style="font-weight:700; color:#0f172a;">WTA Тур (Женщины)</a> — <code>https://champion-tennis.ru/news/wta</code></li>
                <li><a href="/news/grand-slam" style="font-weight:700; color:#0f172a;">Турниры Большого шлема</a> — <code>https://champion-tennis.ru/news/grand-slam</code></li>
                <li><a href="/news/team-russia" style="font-weight:700; color:#0f172a;">🇷🇺 Сборная России / РТТ</a> — <code>https://champion-tennis.ru/news/team-russia</code></li>
                <li><a href="/news/padel-pickleball" style="font-weight:700; color:#0f172a;">🎾 Падел и Пиклбол в России</a> — <code>https://champion-tennis.ru/news/padel-pickleball</code></li>
              </ul>
            </div>

            <!-- Все статьи блога -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
              <h2 style="font-size:1.2rem; font-weight:800; color:#c84c1f; margin-bottom:14px; border-bottom:2px solid #c84c1f; padding-bottom:6px;">
                ✍️ Статьи блога и Аналитические обзоры
              </h2>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
                <?php foreach ($allArticles as $art): ?>
                  <li>
                    <a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>" style="font-weight:700; color:#0f172a;">• <?= htmlspecialchars($art['title']) ?></a><br>
                    <code style="font-size:0.8rem; color:#64748b;">https://champion-tennis.ru/blog/<?= $art['category'] ?>/<?= $art['slug'] ?></code>
                  </li>
                <?php endforeach; ?>
              </ul>
            </div>

            <!-- Все новости -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
              <h2 style="font-size:1.2rem; font-weight:800; color:#0a5c36; margin-bottom:14px; border-bottom:2px solid #0a5c36; padding-bottom:6px;">
                ⚡ Все новости (<?= count($allNews) ?>)
              </h2>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
                <?php foreach ($allNews as $n): ?>
                  <li>
                    <a href="/news/<?= $n['category'] ?>/<?= $n['slug'] ?>" style="font-weight:600; color:#0f172a;">• <?= htmlspecialchars($n['title']) ?></a><br>
                    <code style="font-size:0.8rem; color:#64748b;">https://champion-tennis.ru/news/<?= $n['category'] ?>/<?= $n['slug'] ?></code>
                  </li>
                <?php endforeach; ?>
              </ul>
            </div>

            <!-- Служебные и Юридические страницы -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
              <h2 style="font-size:1.2rem; font-weight:800; color:#334155; margin-bottom:14px; border-bottom:2px solid #334155; padding-bottom:6px;">
                📄 Документы, Редакция и Технические ленты
              </h2>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px;">
                <li><a href="/about" style="font-weight:700; color:#0f172a;">О проекте и Редакция</a> — <code>https://champion-tennis.ru/about</code></li>
                <li><a href="/contacts" style="font-weight:700; color:#0f172a;">Контакты и Размещение Рекламы</a> — <code>https://champion-tennis.ru/contacts</code></li>
                <li><a href="/user-agreement" style="font-weight:700; color:#0f172a;">Пользовательское соглашение</a> — <code>https://champion-tennis.ru/user-agreement</code></li>
                <li><a href="/privacy-policy" style="font-weight:700; color:#0f172a;">Политика конфиденциальности (152-ФЗ)</a> — <code>https://champion-tennis.ru/privacy-policy</code></li>
                <li><a href="/site-rules" style="font-weight:700; color:#0f172a;">Правила пользования сайтом</a> — <code>https://champion-tennis.ru/site-rules</code></li>
                <li><a href="/sitemap.xml" target="_blank" style="font-weight:700; color:#0f172a;">Поисковая XML карта сайта (Sitemap)</a> — <code>https://champion-tennis.ru/sitemap.xml</code></li>
                <li><a href="/rss.xml" target="_blank" style="font-weight:700; color:#0f172a;">Новостной RSS 2.0 канал</a> — <code>https://champion-tennis.ru/rss.xml</code></li>
                <li><a href="/robots.txt" target="_blank" style="font-weight:700; color:#0f172a;">Файл robots.txt</a> — <code>https://champion-tennis.ru/robots.txt</code></li>
              </ul>
            </div>
          </div>
        </div>

    <?php
    // =========================================================================
    // КОНТАКТЫ (/contacts)
    // =========================================================================
    elseif ($route === 'contacts'):
        echo renderBreadcrumbs([['title'=>'Контакты', 'url'=>'']]);
        ?>
        <article class="article-container" style="max-width:960px;">
          <header class="article-header">
            <h1 class="article-title-main">Контакты и Размещение Рекламы</h1>
            <p style="font-size:1rem; color:#64748b;">
              Свяжитесь с редакцией «Чемпион-Теннис» по вопросам публикаций, спонсорских интеграций и размещения рекламы.
            </p>
          </header>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:32px; margin-top:24px;">
            <div>
              <h2 style="font-size:1.25rem; font-weight:800; margin-bottom:16px;">Форма связи с редакцией</h2>
              <form id="contactForm" class="js-contact-form" style="display:flex; flex-direction:column; gap:14px;">
                <input type="text" name="name" class="cta-input" placeholder="Ваше имя / Компания" required style="border:1px solid #cbd5e1; background:white; color:#0f172a;">
                <input type="text" name="contact" class="cta-input" placeholder="Ваш Email или телефон" required style="border:1px solid #cbd5e1; background:white; color:#0f172a;">
                <input type="text" name="subject" class="cta-input" placeholder="Тема сообщения (публикация, реклама, исправление)" required style="border:1px solid #cbd5e1; background:white; color:#0f172a;">
                <textarea name="message" class="cta-input" rows="5" placeholder="Опишите подробно суть предложения или вопроса..." required style="border:1px solid #cbd5e1; background:white; color:#0f172a;"></textarea>
                <div class="form-agree-wrap">
                  <input type="checkbox" name="agree" class="form-agree-checkbox" id="agree_contacts" required>
                  <label for="agree_contacts">
                    Нажимая кнопку, вы соглашаетесь с <a href="/privacy-policy" target="_blank">Политикой обработки данных</a>.
                  </label>
                </div>
                <button type="submit" class="btn-cta-submit" style="border:none; padding:12px; font-weight:700;">Отправить обращение в редакцию &rarr;</button>
              </form>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
              <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:12px;">Рекламные возможности</h3>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; font-size:0.875rem; color:#475569;">
                <li>✔ <strong>Баннерные модули:</strong> Top-Billboard 1200x120, сквозные модули в новостях и рейтингах.</li>
                <li>✔ <strong>Нативные статьи:</strong> Тестирование экипировки, кортов, падел-клубов.</li>
                <li>✔ <strong>Спонсорство разделов:</strong> Брендирование Live-виджетов и Большого шлема.</li>
              </ul>
              <div style="margin-top:20px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:0.8125rem; color:#64748b;">
                <strong>График работы:</strong> Круглосуточная служба новостей. Ответ на рекламные запросы — в течение рабочего дня.
              </div>
            </div>
          </div>
        </article>

    <?php
    // =========================================================================
    // СТАТИЧЕСКИЕ И СИСТЕМНЫЕ СТРАНИЦЫ (about, site-rules, privacy-policy, user-agreement)
    // Пункт 9: форма обратной связи на /site-rules и /about
    // =========================================================================
    else:
        $slug = $route ?: 'about';
        $st = $pdo->prepare("SELECT * FROM pages WHERE slug = ?");
        $st->execute([$slug]);
        $page = $st->fetch();

        if ($page):
            echo renderBreadcrumbs([['title'=>$page['title'], 'url'=>'']]);
            ?>
            <article class="article-container" style="max-width:960px;">
              <header class="article-header">
                <h1 class="article-title-main"><?= htmlspecialchars($page['title']) ?></h1>
                <div class="article-meta-bar">
                  <div>champion-tennis.ru • Официальный спортивный портал</div>
                  <div>Обновлено: 2026 год</div>
                </div>
              </header>

              <div class="article-content" style="font-size:1.05rem; line-height:1.75; color:#1e293b;">
                <?= $page['content'] ?>
              </div>

              <!-- Форма обратной связи для /site-rules и /about (Пункт 9) -->
              <?php if (in_array($slug, ['site-rules', 'about'])): ?>
                <div class="feedback-embed-card" style="margin-top:40px; padding:28px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                  <h3 style="font-size:1.25rem; font-weight:800; color:#074025; margin:0 0 8px 0;">Форма обратной связи с редакцией</h3>
                  <p style="font-size:0.875rem; color:#64748b; margin:0 0 20px 0;">
                    Если у вас есть вопросы по данному разделу, предложения по улучшению портала или материалы для публикации — напишите дежурному редактору:
                  </p>
                  <form id="contactForm" class="js-contact-form" style="display:flex; flex-direction:column; gap:14px;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px;">
                      <input type="text" name="name" class="cta-input" placeholder="Ваше имя" required style="border:1px solid #cbd5e1; background:white; color:#0f172a;">
                      <input type="text" name="contact" class="cta-input" placeholder="Email или телефон для ответа" required style="border:1px solid #cbd5e1; background:white; color:#0f172a;">
                    </div>
                    <input type="text" name="subject" class="cta-input" value="Вопрос по разделу «<?= htmlspecialchars($page['title']) ?>»" required style="border:1px solid #cbd5e1; background:white; color:#0f172a;">
                    <textarea name="message" class="cta-input" rows="4" placeholder="Текст вашего сообщения в редакцию..." required style="border:1px solid #cbd5e1; background:white; color:#0f172a;"></textarea>
                    <div class="form-agree-wrap">
                      <input type="checkbox" name="agree" class="form-agree-checkbox" id="agree_feedback_<?= htmlspecialchars($slug) ?>" required>
                      <label for="agree_feedback_<?= htmlspecialchars($slug) ?>">
                        Нажимая кнопку, вы соглашаетесь с <a href="/privacy-policy" target="_blank">Политикой обработки данных</a>.
                      </label>
                    </div>
                    <button type="submit" class="btn-cta-submit" style="border:none; padding:12px; font-weight:700;">Отправить сообщение в редакцию &rarr;</button>
                    <div style="font-size:0.75rem; color:#94a3b8; text-align:center;">
                      Обращение будет передано дежурному редактору Champion-Tennis.ru.
                    </div>
                  </form>
                </div>
              <?php endif; ?>
            </article>
            <?php
        else:
            echo '<article class="article-container"><h1>404 — Страница не найдена</h1><p>Запрошенная страница не существует или была перемещена.</p><p><a href="/" class="btn-read-more">Вернуться на главную &rarr;</a></p></article>';
        endif;
    endif;
    ?>
  </div>
</main>

<!-- Footer (Пункт 7: «лучшее из мира спорта и тенниса», автогод, уведомление о перепечатке) -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-top-grid">
      <!-- Колонка 1: О медиа и слоган -->
      <div>
        <div class="footer-brand-title">Чемпион-<span>Теннис</span></div>
        <p class="footer-about-text" style="color:#cbd5e1; font-size:0.9rem; line-height:1.55; margin-top:8px;">
          <?= htmlspecialchars($footer['about_text'] ?? 'лучшее из мира спорта и тенниса') ?>
        </p>
        <!-- Социальные сети и RSS столбиком (Требование 2) -->
        <div class="footer-social-column">
          <a href="https://t.me/champion_tennis_ru" target="_blank" rel="noopener" class="footer-social-row-link" title="Telegram-канал">
            <svg style="width:16px; height:16px; fill:#38bdf8; flex-shrink:0;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.89 8.01-3.46 3.81-1.61 4.6-.19 4.6 1.48z"/></svg>
            <span>Telegram канал</span>
          </a>
          <a href="https://vk.com/champion_tennis_ru" target="_blank" rel="noopener" class="footer-social-row-link" title="ВКонтакте">
            <svg style="width:16px; height:16px; fill:#60a5fa; flex-shrink:0;" viewBox="0 0 24 24"><path d="M15.684 0H8.316C3.724 0 0 3.724 0 8.316v7.368C0 20.276 3.724 24 8.316 24h7.368C20.276 24 24 20.276 24 15.684V8.316C24 3.724 20.276 0 15.684 0zm3.602 17.533h-2.144c-.812 0-1.06-.645-2.52-2.115-1.274-1.242-1.84-1.398-2.155-1.398-.439 0-.566.126-.566.732v1.94c0 .524-.168.841-1.554.841-2.29 0-4.836-1.391-6.626-3.98-2.692-3.79-3.44-6.643-3.44-7.234 0-.324.126-.624.743-.624h2.145c.556 0 .768.253.98.849 1.082 3.125 2.89 5.86 3.633 5.86.282 0 .408-.126.408-.82v-3.21c-.085-1.472-.862-1.597-.862-2.122 0-.248.204-.498.535-.498h3.364c.467 0 .637.247.637.806v4.331c0 .466.204.623.34.623.28 0 .515-.157 1.047-.69 1.625-1.821 2.784-4.526 2.784-4.526.155-.323.411-.544.966-.544h2.144c.648 0 .788.334.648.806-.264 1.205-2.83 4.802-2.955 5.011-.274.425-.38.618 0 1.125.267.364 1.157 1.135 1.748 1.821 1.096 1.258 1.939 2.316 2.164 3.044.238.745-.119 1.133-.872 1.133z"/></svg>
            <span>ВКонтакте</span>
          </a>
          <a href="/rss.xml" class="footer-social-row-link" title="RSS новостная лента">
            <svg style="width:16px; height:16px; stroke:#fb923c; fill:none; flex-shrink:0;" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
            <span>RSS новостная лента</span>
          </a>
        </div>
      </div>

      <!-- Колонка 2: Разделы -->
      <div>
        <div class="footer-col-title">Разделы портала</div>
        <ul class="footer-links-list">
          <li><a href="/news">Новости тенниса</a></li>
          <li><a href="/tournaments">Турниры и календарь 2026</a></li>
          <li><a href="/rankings">Рейтинги ATP и WTA</a></li>
          <li><a href="/players">Игроки мирового тура</a></li>
          <li><a href="/blog">Аналитика и Блог</a></li>
          <li><a href="/gear">Ракетки и экипировка</a></li>
          <li><a href="/glossary">Глоссарий терминов</a></li>
        </ul>
      </div>

      <!-- Колонка 3: Серии -->
      <div>
        <div class="footer-col-title">Серии и Турниры</div>
        <ul class="footer-links-list">
          <li><a href="/news/atp">ATP Тур (Мужчины)</a></li>
          <li><a href="/news/wta">WTA Тур (Женщины)</a></li>
          <li><a href="/news/grand-slam">Большой шлем</a></li>
          <li><a href="/news/team-russia">Сборная России / РТТ</a></li>
          <li><a href="/news/padel-pickleball">Падел и Пиклбол</a></li>
          <li><a href="/tournaments">Мастерс 1000 и Кубок Кремля</a></li>
        </ul>
      </div>

      <!-- Колонка 4: Документы и Редакция -->
      <div>
        <div class="footer-col-title">Документы и Редакция</div>
        <ul class="footer-links-list">
          <li><a href="/about">О проекте и Редакция</a></li>
          <li><a href="/contacts">Контакты и Реклама</a></li>
          <li><a href="/user-agreement">Пользовательское соглашение</a></li>
          <li><a href="/privacy-policy">Политика конфиденциальности</a></li>
          <li><a href="/site-rules">Правила пользования сайтом</a></li>
          <li><a href="/sitemap">Карта сайта</a></li>
          <li><a href="/sitemap.xml">XML Карта сайта</a></li>
        </ul>
      </div>
    </div>

    <!-- Нижняя полоса копирайта (Пункт 7: динамический год и уведомление о перепечатке) -->
    <div class="footer-bottom-bar" style="border-top:1px solid #1e293b; padding-top:20px; margin-top:32px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; font-size:0.8125rem; color:#94a3b8;">
      <div>
        © <?= date('Y') ?> <strong>champion-tennis.ru</strong> (Чемпион-Теннис). Все права защищены. Возрастная категория: <strong>16+</strong>. При перепечатке материалов с сайта champion-tennis.ru ссылка на сайт обязательна!
      </div>
      <div>
        <a href="/privacy-policy" style="color:#94a3b8; text-decoration:underline;">152-ФЗ Персональные данные</a>
      </div>
    </div>
  </div>
</footer>

<!-- Модальное окно сквозного поиска (Пункт 4) -->
<div class="search-modal-backdrop" id="searchModal" role="dialog" aria-modal="true" aria-label="Сквозной поиск по сайту">
  <div class="search-modal-window">
    <div class="search-input-wrap">
      <svg style="width:20px; height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <input type="text" id="globalSearchInput" class="search-input-field" placeholder="Поиск новостей, игроков, турниров, ракеток..." autocomplete="off">
      <button type="button" class="search-close-btn" id="searchModalClose" title="Закрыть поиск (Esc)">
        <svg style="width:20px; height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    <div class="search-results-preview" id="searchLiveResults">
      <div style="padding: 16px 20px; color: #94a3b8; font-size: 0.875rem;">
        Начните вводить текст (например: Медведев, Синнер, Ролан Гаррос, Wilson, падел)...
      </div>
    </div>
  </div>
</div>

<!-- Cookie баннер (152-ФЗ) и кнопка «Наверх» -->
<div class="cookie-banner" id="cookieBanner">
  <p><?= htmlspecialchars($cookie['text'] ?? 'Мы используем cookie для персонализации сервиса и аналитики.') ?></p>
  <button id="cookieAcceptBtn" class="cookie-btn-accept">Принять все</button>
</div>
<button id="scrollTopBtn" class="scroll-top-btn" title="Наверх">&uarr;</button>

<!-- Скрипты -->
<script src="/js/main.js"></script>
<script src="/public/js/main.js"></script>
</body>
</html>
