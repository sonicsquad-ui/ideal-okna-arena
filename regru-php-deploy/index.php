<?php
/**
 * Champion-Tennis.ru — Единый фронт-контроллер PHP для хостинга REG.RU
 */

require_once __DIR__ . '/config.php';

$rawUrl = isset($_GET['url']) ? trim($_GET['url'], '/') : '';

// ==============================================================================
// 1. АВТОМАТИЧЕСКИЙ СТРИМЕР СТАТИЧЕСКИХ РЕСУРСОВ (CSS, JS, ИЗОБРАЖЕНИЯ)
// Даже если Apache не переписал путь или файлы лежат в /public/, PHP отдаст их корректно
// ==============================================================================
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

$parts = $rawUrl ? explode('/', $rawUrl) : [];
$route = $parts[0] ?? '';

$settings = getGlobalSettings($pdo);
$header = $settings['header'] ?? [];
$footer = $settings['footer'] ?? [];
$cookie = $settings['cookie_banner'] ?? [];
$newsletter = $settings['newsletter_cta'] ?? [];

// Helper for breadcrumbs
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

// Helper to resolve image paths whether in /images or /public/images
function resolveImg($path) {
    if (!$path) return '/images/hero-tennis-ball.jpg';
    if (strpos($path, 'http') === 0) return $path;
    return $path;
}

// ==========================================
// API & RSS & Sitemap Endpoints
// ==========================================

if ($route === 'rss.xml') {
    header('Content-Type: application/rss+xml; charset=utf-8');
    $stmt = $pdo->query("SELECT * FROM news ORDER BY published_at DESC LIMIT 30");
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    ?>
    <rss version="2.0">
      <channel>
        <title>Чемпион-Теннис | Новости</title>
        <link>https://champion-tennis.ru</link>
        <description>Свежие новости тенниса на champion-tennis.ru</description>
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
    $staticUrls = ['', 'news', 'tournaments', 'rankings', 'players', 'blog', 'gear', 'glossary', 'about', 'contacts', 'user-agreement', 'privacy-policy', 'site-rules', 'sitemap'];
    foreach ($staticUrls as $u) {
        echo '<url><loc>https://champion-tennis.ru/' . $u . '</loc><changefreq>daily</changefreq><priority>0.8</priority></url>';
    }
    $stmtN = $pdo->query("SELECT category, slug FROM news");
    while ($n = $stmtN->fetch()) {
        echo '<url><loc>https://champion-tennis.ru/news/' . $n['category'] . '/' . $n['slug'] . '</loc><priority>0.7</priority></url>';
    }
    echo '</urlset>';
    exit;
}

// API: Subscribe
if ($route === 'api' && isset($parts[1]) && $parts[1] === 'subscribe') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $email = trim($input['email'] ?? '');
    if ($email && strpos($email, '@')) {
        $stmt = $pdo->prepare("INSERT INTO form_submissions (form_type, name, contact_info, subject, message, source_url) VALUES ('newsletter', 'Подписчик', ?, 'Подписка на дайджест', 'Утренняя рассылка', ?)");
        $stmt->execute([$email, $input['pageUrl'] ?? '']);
        sendAdminNotification("[Champion-Tennis.ru] Новая подписка на рассылку", "Email: " . $email);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Укажите корректный email']);
    }
    exit;
}

// API: Contact
if ($route === 'api' && isset($parts[1]) && $parts[1] === 'contact') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $name = trim($input['name'] ?? '');
    $contact = trim($input['contact'] ?? '');
    $msg = trim($input['message'] ?? '');
    if ($contact && $msg) {
        $stmt = $pdo->prepare("INSERT INTO form_submissions (form_type, name, contact_info, subject, message, source_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$input['form_type'] ?? 'contact', $name, $contact, $input['subject'] ?? '', $msg, $input['pageUrl'] ?? '']);
        sendAdminNotification("[Champion-Tennis.ru] Новая заявка: " . ($input['subject'] ?? ''), "Имя: $name\nКонтакт: $contact\n\n$msg");
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Заполните все поля']);
    }
    exit;
}

// API: Search
if ($route === 'api' && isset($parts[1]) && $parts[1] === 'search') {
    header('Content-Type: application/json');
    $q = trim($_GET['q'] ?? '');
    $results = [];
    if (mb_strlen($q) >= 2) {
        $stmt = $pdo->prepare("SELECT title, category, slug FROM news WHERE title LIKE ? OR excerpt LIKE ? LIMIT 4");
        $stmt->execute(["%$q%", "%$q%"]);
        while ($r = $stmt->fetch()) {
            $results[] = [
                'title' => $r['title'],
                'type_label' => 'Новость',
                'url' => '/news/' . $r['category'] . '/' . $r['slug']
            ];
        }
    }
    echo json_encode(['results' => $results, 'total' => count($results)]);
    exit;
}

// ==========================================
// Page Template Helper
// ==========================================

function getPageMeta($route, $parts, $pdo) {
    if ($route === '' || $route === 'index') {
        return ['title' => 'Чемпион-Теннис | Портал тенниса и блог', 'desc' => 'Главный спортивный портал тенниса России.'];
    }
    if ($route === 'news' && isset($parts[2])) {
        $st = $pdo->prepare("SELECT meta_title, meta_description, title FROM news WHERE slug = ?");
        $st->execute([$parts[2]]);
        $n = $st->fetch();
        if ($n) return ['title' => $n['meta_title'] ?: $n['title'] . ' — Чемпион-Теннис', 'desc' => $n['meta_description']];
    }
    $st = $pdo->prepare("SELECT meta_title, meta_description, title FROM pages WHERE slug = ?");
    $st->execute([$route]);
    $p = $st->fetch();
    if ($p) return ['title' => $p['meta_title'] ?: $p['title'], 'desc' => $p['meta_description']];
    return ['title' => 'Чемпион-Теннис', 'desc' => ''];
}

$pageMeta = getPageMeta($route, $parts, $pdo);
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($pageMeta['title']) ?></title>
  <meta name="description" content="<?= htmlspecialchars($pageMeta['desc']) ?>">

  <!-- CSS Стили (поддержка путей как с /public/, так и без него) -->
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/public/css/main.css">

  <!-- Встроенные критические стили для мгновенного идеального рендеринга -->
  <style>
    :root {
      --primary: #0a5c36;
      --primary-dark: #074025;
      --accent-clay: #c84c1f;
      --accent-yellow: #ccff00;
      --bg-main: #f8fafc;
      --text-main: #0f172a;
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    body { font-family: var(--font-sans); background: var(--bg-main); color: var(--text-main); margin: 0; line-height: 1.6; }
    .container { width: 100%; max-width: 1240px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; }
    .brand-logo { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; }
    .brand-crest { width: 44px !important; height: 44px !important; min-width: 44px !important; max-width: 44px !important; max-height: 44px !important; background: #0a5c36; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }
    .brand-crest svg { width: 26px !important; height: 26px !important; max-width: 26px !important; max-height: 26px !important; display: block !important; }
    .brand-name { font-size: 1.35rem; font-weight: 800; color: #074025; text-transform: uppercase; }
    .brand-name span { color: #c84c1f; }
  </style>
</head>
<body>

<!-- Header -->
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
          <a href="https://t.me/champion_tennis_ru" target="_blank" class="top-social-link">TG</a>
          <a href="https://vk.com/champion_tennis_ru" target="_blank" class="top-social-link">VK</a>
          <a href="/rss.xml" class="top-social-link">RSS</a>
        </div>
      </div>
    </div>
  </div>

  <div class="container main-header-row">
    <a href="/" class="brand-logo" title="Чемпион-Теннис">
      <div class="brand-crest" style="width:44px; height:44px; min-width:44px; min-height:44px; max-width:44px; max-height:44px; overflow:hidden;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:26px; height:26px; max-width:26px; max-height:26px; display:block;">
          <circle cx="12" cy="12" r="10" stroke="#ccff00"/>
          <path d="M4.93 4.93c4.2 4.2 4.2 10.94 0 15.14" stroke="#ffffff"/>
          <path d="M19.07 4.93c-4.2 4.2-4.2 10.94 0 15.14" stroke="#ffffff"/>
        </svg>
      </div>
      <div class="brand-text">
        <div class="brand-name">Чемпион-<span>Теннис</span></div>
        <div class="brand-domain">CHAMPION-TENNIS.RU</div>
      </div>
    </a>

    <nav class="header-nav">
      <a href="/news" class="nav-link <?= $route === 'news' ? 'active' : '' ?>">Новости</a>
      <a href="/tournaments" class="nav-link <?= $route === 'tournaments' ? 'active' : '' ?>">Турниры</a>
      <a href="/rankings" class="nav-link <?= $route === 'rankings' ? 'active' : '' ?>">Рейтинги ATP/WTA</a>
      <a href="/players" class="nav-link <?= $route === 'players' ? 'active' : '' ?>">Игроки</a>
      <a href="/blog" class="nav-link <?= $route === 'blog' ? 'active' : '' ?>">Аналитика и Блог</a>
      <a href="/gear" class="nav-link <?= $route === 'gear' ? 'active' : '' ?>">Экипировка и Падел</a>
      <a href="/about" class="nav-link <?= $route === 'about' ? 'active' : '' ?>">О проекте</a>
    </nav>

    <div class="header-actions">
      <button class="search-btn-trigger js-search-trigger" type="button">Поиск по сайту</button>
      <a href="/admin" class="admin-header-btn">Админка</a>
    </div>
  </div>

  <div class="category-subnav">
    <div class="container subnav-inner">
      <a href="/news" class="subnav-item">Все новости</a>
      <a href="/news/atp" class="subnav-item">ATP Тур</a>
      <a href="/news/wta" class="subnav-item">WTA Тур</a>
      <a href="/news/grand-slam" class="subnav-item">Большой шлем</a>
      <a href="/news/team-russia" class="subnav-item">🇷🇺 Сборная России</a>
      <a href="/news/padel-pickleball" class="subnav-item">🎾 Падел и Пиклбол</a>
      <a href="/tournaments" class="subnav-item">Календарь</a>
      <a href="/gear" class="subnav-item">Ракетки 2026</a>
      <a href="/glossary" class="subnav-item">Глоссарий</a>
    </div>
  </div>
</header>

<main class="page-main">
  <div class="container">
    <?php
    // Routing content
    if ($route === '' || $route === 'index'):
        // HOMEPAGE
        $stmtLive = $pdo->query("SELECT * FROM live_matches ORDER BY is_live DESC, id ASC");
        $liveMatches = $stmtLive->fetchAll();

        $stmtTopNews = $pdo->query("SELECT * FROM news WHERE is_hot_24h = 1 OR is_featured = 1 ORDER BY published_at DESC LIMIT 3");
        $topNews = $stmtTopNews->fetchAll();

        $stmtTopBlog = $pdo->query("SELECT * FROM articles WHERE is_editors_choice = 1 ORDER BY published_at DESC LIMIT 3");
        $topBlog = $stmtTopBlog->fetchAll();

        $top5Atp = $pdo->query("SELECT * FROM players WHERE gender = 'M' ORDER BY rank ASC LIMIT 5")->fetchAll();
        $top5Wta = $pdo->query("SELECT * FROM players WHERE gender = 'F' ORDER BY rank ASC LIMIT 5")->fetchAll();
        ?>
        <!-- Matches Today -->
        <section class="matches-today-card">
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
            <!-- Top 24h News -->
            <div class="section-title-bar">
              <h2 class="section-heading"><span class="heading-bar"></span> Главное за 24 часа</h2>
              <a href="/news" class="view-all-link">Все новости &rarr;</a>
            </div>
            <div class="top24-grid">
              <?php foreach ($topNews as $item): ?>
                <article class="news-card-featured">
                  <a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>" class="news-card-img-wrap">
                    <img src="<?= htmlspecialchars(resolveImg($item['image'])) ?>" alt="">
                    <span class="category-tag <?= $item['category'] ?>"><?= strtoupper($item['category']) ?></span>
                  </a>
                  <div class="news-card-body">
                    <h3 class="news-card-title"><a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>"><?= htmlspecialchars($item['title']) ?></a></h3>
                    <p class="news-card-excerpt"><?= htmlspecialchars($item['excerpt']) ?></p>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>

            <!-- Editors Choice Blog -->
            <div class="section-title-bar" style="margin-top:32px;">
              <h2 class="section-heading"><span class="heading-bar" style="background:#c84c1f;"></span> Выбор редакции: Аналитика</h2>
              <a href="/blog" class="view-all-link">В блог &rarr;</a>
            </div>
            <div class="editors-choice-grid">
              <?php foreach ($topBlog as $art): ?>
                <article class="editors-card">
                  <img src="<?= htmlspecialchars(resolveImg($art['image'])) ?>" class="editors-img" alt="">
                  <div class="editors-body">
                    <h3 class="editors-title"><a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>"><?= htmlspecialchars($art['title']) ?></a></h3>
                    <p class="editors-snippet"><?= htmlspecialchars($art['excerpt']) ?></p>
                    <a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>" class="btn-read-more">Читать далее &rarr;</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          </div>

          <!-- Sidebar -->
          <aside>
            <div class="sidebar-box">
              <div class="sidebar-box-header"><h3 class="sidebar-box-title">Рейтинг: Топ-5</h3></div>
              <div class="rankings-list">
                <?php foreach ($top5Atp as $p): ?>
                  <div class="rank-item">
                    <span class="rank-number">#<?= $p['rank'] ?></span>
                    <div class="rank-player-col"><span><?= $p['flag'] ?></span> <strong><?= htmlspecialchars($p['name']) ?></strong></div>
                    <span class="rank-points"><?= $p['points'] ?></span>
                  </div>
                <?php endforeach; ?>
              </div>
            </div>

            <div class="cta-newsletter-card">
              <h3 class="cta-title">Теннисный дайджест 8:00</h3>
              <p class="cta-subtitle">Сводка ночных матчей и расклады экспертов каждое утро.</p>
              <form class="cta-form js-newsletter-form">
                <input type="email" class="cta-input" placeholder="Ваш e-mail" required>
                <button type="submit" class="btn-cta-submit">Подписаться</button>
              </form>
            </div>
          </aside>
        </div>

    <?php elseif ($route === 'news' && isset($parts[2])):
        // SINGLE NEWS
        $slug = $parts[2];
        $st = $pdo->prepare("SELECT * FROM news WHERE slug = ?");
        $st->execute([$slug]);
        $n = $st->fetch();
        if (!$n): echo '<h1>Новость не найдена</h1>'; else:
        echo renderBreadcrumbs([['title'=>'Новости', 'url'=>'/news'], ['title'=>$n['title'], 'url'=>'']]);
        ?>
        <article class="article-container">
          <header class="article-header">
            <h1 class="article-title-main"><?= htmlspecialchars($n['title']) ?></h1>
            <div class="article-meta-bar"><span>Автор: <?= htmlspecialchars($n['author']) ?></span> <span>Просмотров: <?= $n['views'] ?></span></div>
          </header>
          <?php if ($n['image']): ?><img src="<?= htmlspecialchars(resolveImg($n['image'])) ?>" class="article-hero-cover" alt=""><?php endif; ?>
          <div class="article-content">
            <p style="font-size:1.15rem; font-weight:600;"><?= htmlspecialchars($n['excerpt']) ?></p>
            <?= $n['content'] ?>
          </div>
        </article>
        <?php endif;

    elseif ($route === 'news'):
        // NEWS HUB
        echo renderBreadcrumbs([['title'=>'Новости', 'url'=>'/news']]);
        $stmt = $pdo->query("SELECT * FROM news ORDER BY published_at DESC LIMIT 30");
        $newsList = $stmt->fetchAll();
        ?>
        <div class="section-title-bar"><h1>Лента новостей тенниса</h1></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
          <?php foreach ($newsList as $item): ?>
            <article class="news-card-featured">
              <a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>"><img src="<?= htmlspecialchars(resolveImg($item['image'])) ?>" alt=""></a>
              <div class="news-card-body">
                <h2 class="news-card-title"><a href="/news/<?= $item['category'] ?>/<?= $item['slug'] ?>"><?= htmlspecialchars($item['title']) ?></a></h2>
                <p class="news-card-excerpt"><?= htmlspecialchars($item['excerpt']) ?></p>
              </div>
            </article>
          <?php endforeach; ?>
        </div>

    <?php elseif ($route === 'tournaments'):
        echo renderBreadcrumbs([['title'=>'Турниры и календарь', 'url'=>'/tournaments']]);
        $tournaments = $pdo->query("SELECT * FROM tournaments ORDER BY id ASC")->fetchAll();
        ?>
        <div class="section-title-bar"><h1>Календарь теннисных турниров</h1></div>
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

    <?php elseif ($route === 'rankings'):
        $type = $_GET['type'] ?? 'atp';
        $gender = $type === 'wta' ? 'F' : 'M';
        $stRank = $pdo->prepare("SELECT * FROM players WHERE gender = ? ORDER BY rank ASC");
        $stRank->execute([$gender]);
        $playersList = $stRank->fetchAll();
        echo renderBreadcrumbs([['title'=>'Рейтинги', 'url'=>'/rankings']]);
        ?>
        <div class="section-title-bar">
          <h1>Официальные рейтинги ATP и WTA</h1>
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

    <?php elseif ($route === 'players'):
        echo renderBreadcrumbs([['title'=>'Игроки', 'url'=>'/players']]);
        $players = $pdo->query("SELECT * FROM players ORDER BY rank ASC")->fetchAll();
        ?>
        <div class="section-title-bar"><h1>Игроки мирового тура</h1></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
          <?php foreach ($players as $p): ?>
            <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden; padding:16px;">
              <img src="<?= htmlspecialchars(resolveImg($p['image'])) ?>" style="width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:6px;" alt="">
              <h3 style="margin:10px 0 4px;"><?= htmlspecialchars($p['name']) ?></h3>
              <p style="font-size:0.8rem; color:#64748b;"><?= $p['flag'] ?> <?= htmlspecialchars($p['country']) ?> • Рейтинг #<?= $p['rank'] ?></p>
              <p style="font-size:0.84rem; color:#334155; margin-top:8px;"><?= htmlspecialchars($p['bio']) ?></p>
            </div>
          <?php endforeach; ?>
        </div>

    <?php elseif ($route === 'blog'):
        echo renderBreadcrumbs([['title'=>'Аналитика и Блог', 'url'=>'/blog']]);
        $articles = $pdo->query("SELECT * FROM articles ORDER BY published_at DESC")->fetchAll();
        ?>
        <div class="section-title-bar"><h1>Блог и Аналитика</h1></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
          <?php foreach ($articles as $art): ?>
            <article class="editors-card">
              <img src="<?= htmlspecialchars(resolveImg($art['image'])) ?>" class="editors-img" alt="">
              <div class="editors-body">
                <h2 class="editors-title"><a href="/blog/<?= $art['category'] ?>/<?= $art['slug'] ?>"><?= htmlspecialchars($art['title']) ?></a></h2>
                <p class="editors-snippet"><?= htmlspecialchars($art['excerpt']) ?></p>
              </div>
            </article>
          <?php endforeach; ?>
        </div>

    <?php elseif ($route === 'gear'):
        echo renderBreadcrumbs([['title'=>'Экипировка', 'url'=>'/gear']]);
        $gear = $pdo->query("SELECT * FROM gear_reviews ORDER BY id ASC")->fetchAll();
        ?>
        <div class="section-title-bar"><h1>Ракетки и Экипировка 2026</h1></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
          <?php foreach ($gear as $g): ?>
            <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden; padding:16px;">
              <img src="<?= htmlspecialchars(resolveImg($g['image'])) ?>" style="width:100%; aspect-ratio:16/10; object-fit:cover; border-radius:6px;" alt="">
              <div style="display:flex; justify-content:space-between; margin-top:12px;">
                <span class="category-tag"><?= htmlspecialchars($g['brand']) ?></span>
                <strong style="color:#c84c1f;"><?= htmlspecialchars($g['price']) ?></strong>
              </div>
              <h3 style="margin:10px 0 8px;"><?= htmlspecialchars($g['title']) ?></h3>
              <div style="margin-top:12px;"><?= $g['content'] ?></div>
            </div>
          <?php endforeach; ?>
        </div>

    <?php elseif ($route === 'glossary'):
        echo renderBreadcrumbs([['title'=>'Глоссарий', 'url'=>'/glossary']]);
        $glossary = $pdo->query("SELECT * FROM glossary ORDER BY term ASC")->fetchAll();
        ?>
        <div class="section-title-bar"><h1>Глоссарий теннисных терминов</h1></div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
          <?php foreach ($glossary as $item): ?>
            <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; padding:16px;">
              <h3 style="color:#0a5c36; margin-bottom:6px;"><?= htmlspecialchars($item['term']) ?></h3>
              <p style="font-size:0.875rem;"><?= htmlspecialchars($item['definition']) ?></p>
            </div>
          <?php endforeach; ?>
        </div>

    <?php elseif ($route === 'contacts'):
        echo renderBreadcrumbs([['title'=>'Контакты', 'url'=>'/contacts']]);
        ?>
        <article class="article-container" style="max-width:800px;">
          <h1 class="article-title-main">Контакты и Реклама</h1>
          <p>Свяжитесь с редакцией «Чемпион-Теннис» через официальную форму ниже:</p>
          <form id="contactForm" style="display:flex; flex-direction:column; gap:14px; margin-top:20px;">
            <input type="text" name="name" class="cta-input" placeholder="Ваше имя" required style="border:1px solid #cbd5e1;">
            <input type="text" name="contact" class="cta-input" placeholder="Email или телефон" required style="border:1px solid #cbd5e1;">
            <input type="text" name="subject" class="cta-input" placeholder="Тема сообщения" required style="border:1px solid #cbd5e1;">
            <textarea name="message" class="cta-input" rows="4" placeholder="Текст обращения..." required style="border:1px solid #cbd5e1;"></textarea>
            <button type="submit" class="btn-cta-submit" style="border:none;">Отправить обращение в редакцию &rarr;</button>
          </form>
        </article>

    <?php else:
        // STATIC & CUSTOM PAGES
        $slug = $route ?: 'about';
        $st = $pdo->prepare("SELECT * FROM pages WHERE slug = ?");
        $st->execute([$slug]);
        $page = $st->fetch();
        if ($page):
          echo renderBreadcrumbs([['title'=>$page['title'], 'url'=>'']]);
          ?>
          <article class="article-container">
            <h1 class="article-title-main"><?= htmlspecialchars($page['title']) ?></h1>
            <div class="article-content"><?= $page['content'] ?></div>
          </article>
        <?php else: ?>
          <h1>404 — Страница не найдена</h1>
          <p><a href="/">На главную</a></p>
        <?php endif;
    endif;
    ?>
  </div>
</main>

<!-- Footer -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-top-grid">
      <div>
        <div class="footer-brand-title">Чемпион-<span>Теннис</span></div>
        <p class="footer-about-text"><?= htmlspecialchars($footer['about_text'] ?? 'Главный теннисный портал России.') ?></p>
      </div>
      <div>
        <div class="footer-col-title">Разделы</div>
        <ul class="footer-links-list">
          <li><a href="/news">Новости</a></li>
          <li><a href="/tournaments">Турниры</a></li>
          <li><a href="/rankings">Рейтинги</a></li>
          <li><a href="/blog">Блог</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Серии</div>
        <ul class="footer-links-list">
          <li><a href="/news/atp">ATP</a></li>
          <li><a href="/news/wta">WTA</a></li>
          <li><a href="/news/grand-slam">Большой шлем</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Документы</div>
        <ul class="footer-links-list">
          <li><a href="/about">О проекте</a></li>
          <li><a href="/contacts">Контакты</a></li>
          <li><a href="/user-agreement">Пользовательское соглашение</a></li>
          <li><a href="/privacy-policy">Конфиденциальность</a></li>
          <li><a href="/site-rules">Правила</a></li>
          <li><a href="/sitemap">Карта сайта</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom-bar">
      <div><?= htmlspecialchars($footer['copyright'] ?? '© 2026 champion-tennis.ru') ?></div>
    </div>
  </div>
</footer>

<!-- Cookie & Top Button -->
<div class="cookie-banner" id="cookieBanner">
  <p><?= htmlspecialchars($cookie['text'] ?? 'Мы используем cookie для персонализации сервиса.') ?></p>
  <button id="cookieAcceptBtn" class="cookie-btn-accept">Принять все</button>
</div>
<button id="scrollTopBtn" class="scroll-top-btn" title="Наверх">&uarr;</button>

<!-- Scripts -->
<script src="/js/main.js"></script>
<script src="/public/js/main.js"></script>
</body>
</html>
