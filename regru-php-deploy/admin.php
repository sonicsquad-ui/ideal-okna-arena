<?php
/**
 * Champion-Tennis.ru — Административная панель (PHP версия для хостинга REG.RU)
 * Доступна по прямому адресу: https://champion-tennis.ru/admin или /admin.php
 */

session_start();
require_once __DIR__ . '/config.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'dashboard';
$error = null;
$success = null;

// ==========================================
// Аутентификация
// ==========================================
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['username'] ?? '');
    $pass = trim($_POST['password'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$user]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($pass, $admin['password_hash'])) {
        $_SESSION['admin_auth'] = true;
        $_SESSION['admin_username'] = $admin['username'];
        header("Location: admin.php");
        exit;
    } else {
        $error = "Неверный логин или пароль администратора";
    }
}

if ($action === 'logout') {
    unset($_SESSION['admin_auth']);
    session_destroy();
    header("Location: admin.php?action=login");
    exit;
}

// Защита админки: если не авторизован — показываем страницу входа
if (empty($_SESSION['admin_auth'])) {
    ?>
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Вход в панель управления — Champion-Tennis.ru</title>
        <link rel="stylesheet" href="/css/admin.css">
        <link rel="stylesheet" href="/public/css/admin.css">
        <style>
          body.admin-login-wrap {
            background: #0f172a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            font-family: system-ui, sans-serif;
          }
          .admin-login-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 36px 32px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
          }
          .login-brand { text-align: center; margin-bottom: 24px; }
          .login-brand h1 { margin: 10px 0 4px; font-size: 1.4rem; color: #074025; font-weight: 800; }
          .form-group { margin-bottom: 16px; }
          .form-label { display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; color: #334155; }
          .form-control { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; }
          .alert-danger { background: #fee2e2; color: #b91c1c; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem; }
        </style>
    </head>
    <body class="admin-login-wrap">
        <div class="admin-login-card">
            <div class="login-brand">
                <div style="width: 52px; height: 52px; background: #0a5c36; border-radius: 12px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #ccff00;">
                    <svg style="width: 30px; height: 30px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke="#ccff00"/>
                        <path d="M4.93 4.93c4.2 4.2 4.2 10.94 0 15.14" stroke="#ffffff"/>
                    </svg>
                </div>
                <h1>Чемпион-Теннис</h1>
                <p style="color:#64748b; font-size:0.875rem; margin:0;">Панель управления champion-tennis.ru</p>
            </div>
            <?php if ($error): ?><div class="alert-danger"><?= htmlspecialchars($error) ?></div><?php endif; ?>
            <form action="admin.php?action=login" method="POST">
                <div class="form-group">
                    <label class="form-label">Логин:</label>
                    <input type="text" name="username" class="form-control" required placeholder="admin" autofocus>
                </div>
                <div class="form-group">
                    <label class="form-label">Пароль:</label>
                    <input type="password" name="password" class="form-control" required placeholder="••••••••••••">
                </div>
                <button type="submit" class="btn-admin btn-admin-primary" style="width:100%; padding:12px; font-size:1rem; font-weight:700; background:#0a5c36; color:white; border:none; border-radius:6px; cursor:pointer;">Войти в систему &rarr;</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <a href="/" style="font-size: 0.8125rem; color: #64748b; text-decoration:none;">&larr; Вернуться на главный сайт</a>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// ==========================================
// Статистика для бейджей
// ==========================================
$countPages = $pdo->query("SELECT COUNT(*) FROM pages")->fetchColumn();
$countArticles = $pdo->query("SELECT COUNT(*) FROM articles")->fetchColumn();
$countNews = $pdo->query("SELECT COUNT(*) FROM news")->fetchColumn();
$countGear = $pdo->query("SELECT COUNT(*) FROM gear_reviews")->fetchColumn();
$countSubs = $pdo->query("SELECT COUNT(*) FROM form_submissions")->fetchColumn();
$countNewSubs = $pdo->query("SELECT COUNT(*) FROM form_submissions WHERE status != 'processed'")->fetchColumn();

// ==========================================
// 1. УПРАВЛЕНИЕ ЗАЯВКАМИ С ФОРМ (Обработать / Удалить)
// ==========================================
if ($action === 'sub_process' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("UPDATE form_submissions SET status = 'processed' WHERE id = ?");
    $stmt->execute([$id]);
    header("Location: admin.php?action=subs&processed=1");
    exit;
}

if ($action === 'sub_delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM form_submissions WHERE id = ?");
    $stmt->execute([$id]);
    header("Location: admin.php?action=subs&deleted=1");
    exit;
}

// ==========================================
// 2. УПРАВЛЕНИЕ СТРАНИЦАМИ САЙТА
// ==========================================
if ($action === 'page_save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $title = trim($_POST['title'] ?? '');
    $slug = transliterate(trim($_POST['slug'] ?? ''));
    $metaTitle = trim($_POST['meta_title'] ?? '');
    $metaDesc = trim($_POST['meta_description'] ?? '');
    $content = $_POST['content'] ?? '';

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE pages SET title = ?, slug = ?, meta_title = ?, meta_description = ?, content = ?, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$title, $slug, $metaTitle, $metaDesc, $content, $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO pages (slug, title, meta_title, meta_description, content, is_system) VALUES (?, ?, ?, ?, ?, 0)");
        $stmt->execute([$slug, $title, $metaTitle, $metaDesc, $content]);
    }
    header("Location: admin.php?action=pages&saved=1");
    exit;
}

if ($action === 'page_duplicate' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM pages WHERE id = ?");
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if ($p) {
        $newSlug = $p['slug'] . '-copy-' . rand(100, 999);
        $newTitle = $p['title'] . ' (Копия)';
        $stmtIns = $pdo->prepare("INSERT INTO pages (slug, title, meta_title, meta_description, meta_keywords, content, is_system) VALUES (?, ?, ?, ?, ?, ?, 0)");
        $stmtIns->execute([$newSlug, $newTitle, $p['meta_title'], $p['meta_description'], $p['meta_keywords'] ?? '', $p['content']]);
    }
    header("Location: admin.php?action=pages&duplicated=1");
    exit;
}

if ($action === 'page_delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM pages WHERE id = ? AND is_system = 0");
    $stmt->execute([$id]);
    header("Location: admin.php?action=pages&deleted=1");
    exit;
}

// ==========================================
// 3. УПРАВЛЕНИЕ СТАТЬЯМИ БЛОГА (CRUD + TinyMCE)
// ==========================================
if ($action === 'blog_save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $title = trim($_POST['title'] ?? '');
    $slug = transliterate(trim($_POST['slug'] ?: $title));
    $category = trim($_POST['category'] ?? 'previews');
    $excerpt = trim($_POST['excerpt'] ?? '');
    $content = $_POST['content'] ?? '';
    $image = trim($_POST['image'] ?? '/images/hero-tennis-ball.jpg');
    $authorName = trim($_POST['author_name'] ?? 'Михаил Соколов');
    $authorRole = trim($_POST['author_role'] ?? 'Главный редактор');
    $authorAvatar = trim($_POST['author_avatar'] ?? '/images/author-coach.jpg');
    $readingTime = (int)($_POST['reading_time'] ?? 5);
    $isEditorsChoice = isset($_POST['is_editors_choice']) ? 1 : 0;
    $metaTitle = trim($_POST['meta_title'] ?? '');
    $metaDesc = trim($_POST['meta_description'] ?? '');

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE articles SET category = ?, slug = ?, title = ?, excerpt = ?, content = ?, image = ?, author_name = ?, author_role = ?, author_avatar = ?, reading_time = ?, is_editors_choice = ?, meta_title = ?, meta_description = ? WHERE id = ?");
        $stmt->execute([$category, $slug, $title, $excerpt, $content, $image, $authorName, $authorRole, $authorAvatar, $readingTime, $isEditorsChoice, $metaTitle, $metaDesc, $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO articles (category, slug, title, excerpt, content, image, author_name, author_role, author_avatar, reading_time, is_editors_choice, meta_title, meta_description, views, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))");
        $stmt->execute([$category, $slug, $title, $excerpt, $content, $image, $authorName, $authorRole, $authorAvatar, $readingTime, $isEditorsChoice, $metaTitle, $metaDesc]);
    }
    header("Location: admin.php?action=blog&saved=1");
    exit;
}

if ($action === 'blog_duplicate' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM articles WHERE id = ?");
    $stmt->execute([$id]);
    $a = $stmt->fetch();
    if ($a) {
        $newSlug = $a['slug'] . '-copy-' . rand(100, 999);
        $newTitle = $a['title'] . ' (Копия)';
        $stmtIns = $pdo->prepare("INSERT INTO articles (category, slug, title, excerpt, content, image, author_name, author_role, author_avatar, reading_time, is_editors_choice, meta_title, meta_description, views, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))");
        $stmtIns->execute([$a['category'], $newSlug, $newTitle, $a['excerpt'], $a['content'], $a['image'], $a['author_name'], $a['author_role'], $a['author_avatar'], $a['reading_time'], $a['is_editors_choice'], $a['meta_title'], $a['meta_description']]);
    }
    header("Location: admin.php?action=blog&duplicated=1");
    exit;
}

if ($action === 'blog_delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM articles WHERE id = ?");
    $stmt->execute([$id]);
    header("Location: admin.php?action=blog&deleted=1");
    exit;
}

// ==========================================
// 4. УПРАВЛЕНИЕ НОВОСТЯМИ (CRUD + TinyMCE)
// ==========================================
if ($action === 'news_save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $title = trim($_POST['title'] ?? '');
    $slug = transliterate(trim($_POST['slug'] ?: $title));
    $category = trim($_POST['category'] ?? 'atp');
    $excerpt = trim($_POST['excerpt'] ?? '');
    $content = $_POST['content'] ?? '';
    $image = trim($_POST['image'] ?? '/images/news-medvedev.jpg');
    $sourceName = trim($_POST['source_name'] ?? 'Собственная служба новостей');
    $sourceUrl = trim($_POST['source_url'] ?? '');
    $author = trim($_POST['author'] ?? 'Редакция Champion-Tennis.ru');
    $isFeatured = isset($_POST['is_featured']) ? 1 : 0;
    $isHot24 = isset($_POST['is_hot_24h']) ? 1 : 0;
    $metaTitle = trim($_POST['meta_title'] ?? '');
    $metaDesc = trim($_POST['meta_description'] ?? '');

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE news SET category = ?, slug = ?, title = ?, excerpt = ?, content = ?, image = ?, source_name = ?, source_url = ?, author = ?, is_featured = ?, is_hot_24h = ?, meta_title = ?, meta_description = ? WHERE id = ?");
        $stmt->execute([$category, $slug, $title, $excerpt, $content, $image, $sourceName, $sourceUrl, $author, $isFeatured, $isHot24, $metaTitle, $metaDesc, $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO news (category, slug, title, excerpt, content, image, source_name, source_url, author, is_featured, is_hot_24h, meta_title, meta_description, views, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))");
        $stmt->execute([$category, $slug, $title, $excerpt, $content, $image, $sourceName, $sourceUrl, $author, $isFeatured, $isHot24, $metaTitle, $metaDesc]);
    }
    header("Location: admin.php?action=news&saved=1");
    exit;
}

if ($action === 'news_delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM news WHERE id = ?");
    $stmt->execute([$id]);
    header("Location: admin.php?action=news&deleted=1");
    exit;
}

// ==========================================
// 5. РЕДАКТИРОВАНИЕ РАКЕТОК И ЭКИПИРОВКИ 2026
// ==========================================
if ($action === 'gear_save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $title = trim($_POST['title'] ?? '');
    $slug = transliterate(trim($_POST['slug'] ?: $title));
    $category = trim($_POST['category'] ?? 'rackets');
    $brand = trim($_POST['brand'] ?? 'Wilson');
    $price = trim($_POST['price'] ?? '28 900 ₽');
    $rating = (float)($_POST['rating'] ?? 9.5);
    $image = trim($_POST['image'] ?? '/images/racket-pro-staff.jpg');
    $affiliateUrl = trim($_POST['affiliate_url'] ?? '');
    $content = $_POST['content'] ?? '';

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE gear_reviews SET title = ?, slug = ?, category = ?, brand = ?, price = ?, rating = ?, image = ?, affiliate_url = ?, content = ? WHERE id = ?");
        $stmt->execute([$title, $slug, $category, $brand, $price, $rating, $image, $affiliateUrl, $content, $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO gear_reviews (title, slug, category, brand, price, rating, image, affiliate_url, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $slug, $category, $brand, $price, $rating, $image, $affiliateUrl, $content]);
    }
    header("Location: admin.php?action=gear&saved=1");
    exit;
}

if ($action === 'gear_delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM gear_reviews WHERE id = ?");
    $stmt->execute([$id]);
    header("Location: admin.php?action=gear&deleted=1");
    exit;
}

// ==========================================
// 6. СОХРАНЕНИЕ ГЛОБАЛЬНЫХ БЛОКОВ (Шапка, Футер, Копирайт)
// ==========================================
if ($action === 'save_blocks' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $current = getGlobalSettings($pdo);
    if (!isset($current['header'])) $current['header'] = [];
    if (!isset($current['footer'])) $current['footer'] = [];
    if (!isset($current['cookie_banner'])) $current['cookie_banner'] = [];

    $current['header']['site_name'] = $_POST['site_name'] ?? 'Чемпион-Теннис';
    $current['header']['ticker_text'] = $_POST['ticker_text'] ?? '';
    $current['footer']['about_text'] = $_POST['footer_about'] ?? 'лучшее из мира спорта и тенниса';
    $current['footer']['copyright'] = $_POST['footer_copyright'] ?? '';
    $current['cookie_banner']['text'] = $_POST['cookie_text'] ?? 'Мы используем cookie для персонализации сервиса.';

    $stmt = $pdo->prepare("INSERT INTO global_blocks (key, value_json) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json");
    foreach ($current as $k => $v) {
        $stmt->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);
    }
    header("Location: admin.php?action=blocks&saved=1");
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Панель управления — Champion-Tennis.ru</title>
    <link rel="stylesheet" href="/css/admin.css">
    <link rel="stylesheet" href="/public/css/admin.css">

    <!-- TinyMCE 6 Visual WYSIWYG Editor с кнопкой вставки HTML кода -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof tinymce !== 'undefined') {
          tinymce.init({
            selector: 'textarea.wysiwyg-editor',
            height: 480,
            menubar: 'file edit view insert format tools table help',
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code fullscreen preview',
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #0f172a; max-width: 900px; margin: 15px auto; padding: 0 15px; } h1, h2, h3, h4 { color: #074025; font-weight: 800; } p { margin-bottom: 1em; }',
            branding: false,
            promotion: false,
            convert_urls: false,
            setup: function(editor) {
              editor.on('change', function() {
                editor.save();
              });
            }
          });
        }
      });
    </script>
    <style>
        :root {
          --admin-primary: #0a5c36;
          --admin-bg: #f8fafc;
          --admin-sidebar-bg: #0f172a;
        }
        body.admin-body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background: var(--admin-bg); display: flex; min-height: 100vh; }
        .admin-sidebar { width: 260px; background: var(--admin-sidebar-bg); color: #94a3b8; display: flex; flex-direction: column; flex-shrink: 0; }
        .admin-sidebar-header { padding: 20px; border-bottom: 1px solid #1e293b; }
        .admin-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: white; font-weight: 800; font-size: 1.15rem; }
        .admin-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .admin-nav-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 6px; color: #94a3b8; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: all 0.15s; }
        .admin-nav-item:hover, .admin-nav-item.active { background: #1e293b; color: #ccff00; }
        .admin-badge-count { background: #334155; color: white; font-size: 0.72rem; padding: 2px 7px; border-radius: 12px; font-weight: 700; }
        .admin-sidebar-footer { padding: 16px 20px; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
        .admin-logout-btn { color: #ef4444; text-decoration: none; font-size: 0.8125rem; font-weight: 700; }
        .admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .admin-topbar { background: white; padding: 16px 28px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .admin-page-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
        .admin-content { padding: 28px; flex: 1; overflow-y: auto; }
        .admin-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 28px; }
        .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
        .stat-card-title { font-size: 0.8125rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
        .stat-card-val { font-size: 2rem; font-weight: 800; color: #0a5c36; margin: 6px 0; }
        .admin-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 28px; }
        .admin-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .admin-card-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .admin-table th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700; }
        .admin-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        .btn-admin { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; font-size: 0.875rem; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid transparent; }
        .btn-admin-primary { background: #0a5c36; color: white; }
        .btn-admin-primary:hover { background: #074025; }
        .btn-admin-secondary { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
        .btn-admin-danger { background: #fee2e2; color: #b91c1c; }
        .btn-admin-warning { background: #fef3c7; color: #92400e; }
        .btn-admin-success { background: #dcfce7; color: #15803d; }
        .btn-admin-sm { padding: 4px 10px; font-size: 0.775rem; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-weight: 700; font-size: 0.875rem; margin-bottom: 6px; color: #1e293b; }
        .form-control { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9375rem; box-sizing: border-box; }
        .form-hint { font-size: 0.775rem; color: #64748b; margin-top: 4px; }
        .alert-success { background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-weight: 600; }
    </style>
</head>
<body class="admin-body">
    <!-- Боковое меню админки -->
    <aside class="admin-sidebar">
        <div class="admin-sidebar-header">
            <a href="admin.php" class="admin-brand">
                <span style="display:inline-block; width:12px; height:12px; background:#ccff00; border-radius:50%;"></span>
                <span>Чемпион-Теннис</span>
            </a>
        </div>
        <nav class="admin-nav">
            <a href="admin.php?action=dashboard" class="admin-nav-item <?= $action === 'dashboard' ? 'active' : '' ?>">
                <span>📊 Сводка портала</span>
            </a>
            <a href="admin.php?action=pages" class="admin-nav-item <?= in_array($action, ['pages', 'page_edit']) ? 'active' : '' ?>">
                <span>📄 Страницы сайта</span>
                <span class="admin-badge-count"><?= $countPages ?></span>
            </a>
            <a href="admin.php?action=blog" class="admin-nav-item <?= in_array($action, ['blog', 'blog_edit', 'blog_new']) ? 'active' : '' ?>">
                <span>✍️ Статьи блога</span>
                <span class="admin-badge-count"><?= $countArticles ?></span>
            </a>
            <a href="admin.php?action=news" class="admin-nav-item <?= in_array($action, ['news', 'news_edit', 'news_new']) ? 'active' : '' ?>">
                <span>📰 Новости и Лента</span>
                <span class="admin-badge-count"><?= $countNews ?></span>
            </a>
            <a href="admin.php?action=gear" class="admin-nav-item <?= in_array($action, ['gear', 'gear_edit']) ? 'active' : '' ?>">
                <span>🎾 Ракетки и Экипировка</span>
                <span class="admin-badge-count"><?= $countGear ?></span>
            </a>
            <a href="admin.php?action=blocks" class="admin-nav-item <?= $action === 'blocks' ? 'active' : '' ?>">
                <span>⚙️ Шапка и Футер</span>
            </a>
            <a href="admin.php?action=subs" class="admin-nav-item <?= $action === 'subs' ? 'active' : '' ?>">
                <span>📬 Заявки с форм</span>
                <span class="admin-badge-count" style="<?= $countNewSubs > 0 ? 'background:#ef4444; color:white;' : 'background:#10b981;' ?>"><?= $countSubs ?></span>
            </a>
            <hr style="border:0; border-top:1px solid #1e293b; margin:10px 0;">
            <a href="/" target="_blank" class="admin-nav-item">
                <span>🌐 Открыть сайт &nearr;</span>
            </a>
        </nav>
        <div class="admin-sidebar-footer">
            <span style="color:white; font-size:0.8rem; font-weight:700;">admin</span>
            <a href="admin.php?action=logout" class="admin-logout-btn">Выход &rarr;</a>
        </div>
    </aside>

    <div class="admin-main">
        <header class="admin-topbar">
            <h1 class="admin-page-title">
                <?php
                if ($action === 'dashboard') echo 'Сводка портала Champion-Tennis.ru';
                elseif (in_array($action, ['pages', 'page_edit'])) echo 'Управление страницами сайта';
                elseif (in_array($action, ['blog', 'blog_edit', 'blog_new'])) echo 'Управление статьями блога (WYSIWYG TinyMCE)';
                elseif (in_array($action, ['news', 'news_edit', 'news_new'])) echo 'Управление новостями портала';
                elseif (in_array($action, ['gear', 'gear_edit'])) echo 'Ракетки и Экипировка 2026';
                elseif ($action === 'blocks') echo 'Редактирование Шапки, Футера и Блоков';
                elseif ($action === 'subs') echo 'Заявки и обращения с форм сайта';
                ?>
            </h1>
            <div style="display:flex; gap:10px;">
                <a href="admin.php?action=blog_edit" class="btn-admin btn-admin-primary btn-admin-sm">+ Добавить статью блога</a>
                <a href="admin.php?action=news_edit" class="btn-admin btn-admin-warning btn-admin-sm">+ Добавить новость</a>
            </div>
        </header>

        <main class="admin-content">
            <?php if (isset($_GET['saved'])): ?>
                <div class="alert-success">✅ Изменения успешно сохранены в базе данных!</div>
            <?php elseif (isset($_GET['processed'])): ?>
                <div class="alert-success">✅ Заявка помечена как обработанная!</div>
            <?php elseif (isset($_GET['deleted'])): ?>
                <div class="alert-success">✅ Элемент успешно удален!</div>
            <?php elseif (isset($_GET['duplicated'])): ?>
                <div class="alert-success">✅ Копия успешно создана!</div>
            <?php endif; ?>

            <!-- ===================== ДАШБОРД ===================== -->
            <?php if ($action === 'dashboard'): ?>
                <div class="admin-stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-title">Страниц сайта</div>
                        <div class="stat-card-val"><?= $countPages ?></div>
                        <div class="stat-card-desc"><a href="admin.php?action=pages" style="color:#0a5c36; font-weight:700;">Редактор страниц &rarr;</a></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Статей блога</div>
                        <div class="stat-card-val"><?= $countArticles ?></div>
                        <div class="stat-card-desc"><a href="admin.php?action=blog" style="color:#0a5c36; font-weight:700;">Редактор блога &rarr;</a></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Новостей в базе</div>
                        <div class="stat-card-val"><?= $countNews ?></div>
                        <div class="stat-card-desc"><a href="admin.php?action=news" style="color:#0a5c36; font-weight:700;">Лента новостей &rarr;</a></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Экипировка 2026</div>
                        <div class="stat-card-val"><?= $countGear ?></div>
                        <div class="stat-card-desc"><a href="admin.php?action=gear" style="color:#0a5c36; font-weight:700;">Ракетки и тесты &rarr;</a></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Заявок с форм</div>
                        <div class="stat-card-val" style="<?= $countNewSubs > 0 ? 'color:#ef4444;' : '' ?>"><?= $countSubs ?></div>
                        <div class="stat-card-desc" style="color:#059669; font-weight:700;">Пересылаются на sonicsquad@mail.ru</div>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">📬 Свежие заявки с сайта</h2>
                        <a href="admin.php?action=subs" class="btn-admin btn-admin-secondary btn-admin-sm">Все заявки (<?= $countSubs ?>) &rarr;</a>
                    </div>
                    <?php
                    $latestSubs = $pdo->query("SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 6")->fetchAll();
                    ?>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Форма</th>
                                <th>Имя</th>
                                <th>Контакт</th>
                                <th>Сообщение</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($latestSubs as $s): ?>
                                <tr>
                                    <td><?= formatNewsDate($s['created_at']) ?></td>
                                    <td><strong><?= htmlspecialchars($s['form_type']) ?></strong></td>
                                    <td><?= htmlspecialchars($s['name']) ?></td>
                                    <td><code><?= htmlspecialchars($s['contact_info']) ?></code></td>
                                    <td><?= htmlspecialchars(mb_substr($s['subject'] . ': ' . $s['message'], 0, 80)) ?>...</td>
                                    <td>
                                        <?php if ($s['status'] === 'processed'): ?>
                                            <span style="background:#dcfce7; color:#15803d; font-weight:700; padding:3px 8px; border-radius:4px;">✔ Обработано</span>
                                        <?php else: ?>
                                            <span style="background:#fef3c7; color:#92400e; font-weight:700; padding:3px 8px; border-radius:4px;">Новая</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($s['status'] !== 'processed'): ?>
                                            <a href="admin.php?action=sub_process&id=<?= $s['id'] ?>" class="btn-admin btn-admin-success btn-admin-sm">✔ Обработано</a>
                                        <?php endif; ?>
                                        <a href="admin.php?action=sub_delete&id=<?= $s['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить эту заявку?')">🗑️</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <!-- ===================== СПИСОК СТРАНИЦ ===================== -->
            <?php elseif ($action === 'pages'): ?>
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">Все страницы сайта</h2>
                        <a href="admin.php?action=page_edit" class="btn-admin btn-admin-primary">+ Создать страницу</a>
                    </div>
                    <?php
                    $stmtP = $pdo->query("SELECT * FROM pages ORDER BY is_system DESC, id ASC");
                    $pages = $stmtP->fetchAll();
                    ?>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название (H1)</th>
                                <th>URL адрес</th>
                                <th>Тип</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($pages as $p): ?>
                                <tr>
                                    <td>#<?= $p['id'] ?></td>
                                    <td><strong><?= htmlspecialchars($p['title']) ?></strong></td>
                                    <td><a href="/<?= htmlspecialchars($p['slug']) ?>" target="_blank" style="color:#0a5c36; font-weight:600;">/<?= htmlspecialchars($p['slug']) ?> &nearr;</a></td>
                                    <td><?= $p['is_system'] ? '<span style="color:#0284c7; font-weight:700;">Системная</span>' : 'Пользовательская' ?></td>
                                    <td>
                                        <a href="admin.php?action=page_edit&id=<?= $p['id'] ?>" class="btn-admin btn-admin-primary btn-admin-sm">✏️ Редактор</a>
                                        <a href="admin.php?action=page_duplicate&id=<?= $p['id'] ?>" class="btn-admin btn-admin-secondary btn-admin-sm">📋 Копия</a>
                                        <?php if (!$p['is_system']): ?>
                                            <a href="admin.php?action=page_delete&id=<?= $p['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить страницу?')">🗑️</a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <!-- ===================== РЕДАКТОР СТРАНИЦЫ ===================== -->
            <?php elseif ($action === 'page_edit'):
                $id = (int)($_GET['id'] ?? 0);
                $page = null;
                if ($id > 0) {
                    $st = $pdo->prepare("SELECT * FROM pages WHERE id = ?");
                    $st->execute([$id]);
                    $page = $st->fetch();
                }
            ?>
                <div class="admin-card">
                    <h2 class="admin-card-title"><?= $page ? 'Редактирование: ' . htmlspecialchars($page['title']) : 'Создание новой страницы' ?></h2>
                    <form action="admin.php?action=page_save" method="POST" style="margin-top:20px;">
                        <input type="hidden" name="id" value="<?= $page ? $page['id'] : 0 ?>">
                        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
                            <div class="form-group">
                                <label class="form-label">Заголовок страницы (H1):</label>
                                <input type="text" name="title" class="form-control" value="<?= $page ? htmlspecialchars($page['title']) : '' ?>" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">URL Slug (например, about или site-rules):</label>
                                <input type="text" name="slug" class="form-control" value="<?= $page ? htmlspecialchars($page['slug']) : '' ?>" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">SEO Meta Title:</label>
                            <input type="text" name="meta_title" class="form-control" value="<?= $page ? htmlspecialchars($page['meta_title'] ?? '') : '' ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">SEO Meta Description:</label>
                            <textarea name="meta_description" class="form-control" rows="2"><?= $page ? htmlspecialchars($page['meta_description'] ?? '') : '' ?></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Содержимое страницы (Визуальный WYSIWYG TinyMCE + кнопка вставки HTML кода):</label>
                            <textarea name="content" class="wysiwyg-editor"><?= $page ? htmlspecialchars($page['content']) : '' ?></textarea>
                            <div class="form-hint">💡 Для вставки произвольного HTML кода, видео, кнопок или виджетов нажмите кнопку <code>&lt;&gt;</code> (Исходный код) в панели редактора.</div>
                        </div>
                        <div style="display:flex; gap:12px; margin-top:24px;">
                            <button type="submit" class="btn-admin btn-admin-primary" style="padding:12px 28px; font-size:1rem;">💾 Сохранить страницу</button>
                            <a href="admin.php?action=pages" class="btn-admin btn-admin-secondary">Отмена</a>
                        </div>
                    </form>
                </div>

            <!-- ===================== СПИСОК СТАТЕЙ БЛОГА ===================== -->
            <?php elseif ($action === 'blog'): ?>
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">Статьи блога и Аналитика</h2>
                        <a href="admin.php?action=blog_edit" class="btn-admin btn-admin-primary">+ Новая статья блога</a>
                    </div>
                    <?php
                    $articles = $pdo->query("SELECT * FROM articles ORDER BY published_at DESC")->fetchAll();
                    ?>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Обложка</th>
                                <th>Заголовок статьи</th>
                                <th>Рубрика</th>
                                <th>Автор</th>
                                <th>Дата</th>
                                <th>Выбор ред.</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($articles as $art): ?>
                                <tr>
                                    <td>#<?= $art['id'] ?></td>
                                    <td><img src="<?= htmlspecialchars(resolveImg($art['image'])) ?>" style="width:50px; height:36px; object-fit:cover; border-radius:4px;" alt=""></td>
                                    <td>
                                        <strong><?= htmlspecialchars($art['title']) ?></strong><br>
                                        <a href="/blog/<?= htmlspecialchars($art['category']) ?>/<?= htmlspecialchars($art['slug']) ?>" target="_blank" style="font-size:0.775rem; color:#0a5c36;">/blog/<?= htmlspecialchars($art['category']) ?>/<?= htmlspecialchars($art['slug']) ?> &nearr;</a>
                                    </td>
                                    <td><span style="background:#f1f5f9; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;"><?= strtoupper($art['category']) ?></span></td>
                                    <td><?= htmlspecialchars($art['author_name']) ?></td>
                                    <td><?= formatNewsDate($art['published_at']) ?></td>
                                    <td><?= $art['is_editors_choice'] ? '⭐ Да' : '—' ?></td>
                                    <td>
                                        <a href="admin.php?action=blog_edit&id=<?= $art['id'] ?>" class="btn-admin btn-admin-primary btn-admin-sm">✏️ Редактор</a>
                                        <a href="admin.php?action=blog_duplicate&id=<?= $art['id'] ?>" class="btn-admin btn-admin-secondary btn-admin-sm">📋 Копия</a>
                                        <a href="admin.php?action=blog_delete&id=<?= $art['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить эту статью?')">🗑️</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <!-- ===================== РЕДАКТОР СТАТЬИ БЛОГА ===================== -->
            <?php elseif ($action === 'blog_edit'):
                $id = (int)($_GET['id'] ?? 0);
                $article = null;
                if ($id > 0) {
                    $st = $pdo->prepare("SELECT * FROM articles WHERE id = ?");
                    $st->execute([$id]);
                    $article = $st->fetch();
                }
            ?>
                <div class="admin-card">
                    <h2 class="admin-card-title"><?= $article ? 'Редактирование статьи блога' : 'Создание новой статьи блога' ?></h2>
                    <form action="admin.php?action=blog_save" method="POST" style="margin-top:20px;">
                        <input type="hidden" name="id" value="<?= $article ? $article['id'] : 0 ?>">
                        
                        <div class="form-group">
                            <label class="form-label">Заголовок статьи (H1):</label>
                            <input type="text" name="title" class="form-control" value="<?= $article ? htmlspecialchars($article['title']) : '' ?>" required placeholder="Например: Превью и тактический разбор матчей Ролан Гаррос">
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">URL Slug (ЧПУ):</label>
                                <input type="text" name="slug" class="form-control" value="<?= $article ? htmlspecialchars($article['slug']) : '' ?>" placeholder="avto-translit">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Категория блога:</label>
                                <select name="category" class="form-control">
                                    <?php
                                    $cats = ['previews' => 'Превью и аналитика', 'tactics' => 'Тактика и техника', 'gear' => 'Обзоры экипировки', 'history' => 'История и рекорды', 'interviews' => 'Интервью', 'guides' => 'Обучение и советы'];
                                    $curCat = $article['category'] ?? 'previews';
                                    foreach ($cats as $k => $label) {
                                        $sel = ($k === $curCat) ? 'selected' : '';
                                        echo "<option value=\"$k\" $sel>$label</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Время чтения (мин):</label>
                                <input type="number" name="reading_time" class="form-control" value="<?= $article ? $article['reading_time'] : 5 ?>">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Имя автора (E-E-A-T):</label>
                                <select name="author_name" class="form-control">
                                    <option value="Михаил Соколов" <?= ($article && $article['author_name'] === 'Михаил Соколов') ? 'selected' : '' ?>>Михаил Соколов (Гл. редактор)</option>
                                    <option value="Екатерина Романова" <?= ($article && $article['author_name'] === 'Екатерина Романова') ? 'selected' : '' ?>>Екатерина Романова (WTA/Экипировка)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Статус автора:</label>
                                <input type="text" name="author_role" class="form-control" value="<?= $article ? htmlspecialchars($article['author_role']) : 'Главный редактор, мастер спорта' ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Аватар автора:</label>
                                <input type="text" name="author_avatar" class="form-control" value="<?= $article ? htmlspecialchars($article['author_avatar']) : '/images/author-coach.jpg' ?>">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Обложка статьи (URL фото):</label>
                            <input type="text" name="image" class="form-control" value="<?= $article ? htmlspecialchars($article['image']) : '/images/hero-tennis-ball.jpg' ?>">
                            <div class="form-hint">Доступные фото: /images/hero-tennis-ball.jpg, /images/news-rublev.jpg, /images/news-sinner-alcaraz.jpg, /images/news-medvedev.jpg, /images/racket-pro-staff.jpg и др.</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Краткий анонс статьи (Лид-абзац):</label>
                            <textarea name="excerpt" class="form-control" rows="3" required><?= $article ? htmlspecialchars($article['excerpt']) : '' ?></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Полный текст статьи (Визуальный редактор TinyMCE + кнопка кода):</label>
                            <textarea name="content" class="wysiwyg-editor"><?= $article ? htmlspecialchars($article['content']) : '' ?></textarea>
                            <div class="form-hint">💡 Вы можете форматировать заголовки, вставлять таблицы, картинки, а также вставлять HTML код через кнопку <code>&lt;&gt;</code>.</div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">SEO Meta Title:</label>
                                <input type="text" name="meta_title" class="form-control" value="<?= $article ? htmlspecialchars($article['meta_title'] ?? '') : '' ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">SEO Meta Description:</label>
                                <input type="text" name="meta_description" class="form-control" value="<?= $article ? htmlspecialchars($article['meta_description'] ?? '') : '' ?>">
                            </div>
                        </div>

                        <div class="form-group">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" name="is_editors_choice" value="1" <?= ($article && $article['is_editors_choice']) ? 'checked' : '' ?>>
                                <strong>Отображать в блоке «Выбор редакции» на главной странице</strong>
                            </label>
                        </div>

                        <div style="display:flex; gap:12px; margin-top:24px;">
                            <button type="submit" class="btn-admin btn-admin-primary" style="padding:12px 28px; font-size:1rem;">💾 Сохранить статью</button>
                            <a href="admin.php?action=blog" class="btn-admin btn-admin-secondary">Отмена</a>
                        </div>
                    </form>
                </div>

            <!-- ===================== СПИСОК НОВОСТЕЙ ===================== -->
            <?php elseif ($action === 'news'): ?>
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">Лента новостей тенниса</h2>
                        <div style="display:flex; gap:10px;">
                            <a href="cron_news.php" target="_blank" class="btn-admin btn-admin-warning btn-admin-sm">⚡ Запустить сбор новостей</a>
                            <a href="admin.php?action=news_edit" class="btn-admin btn-admin-primary btn-admin-sm">+ Добавить новость</a>
                        </div>
                    </div>
                    <?php
                    $newsList = $pdo->query("SELECT * FROM news ORDER BY published_at DESC LIMIT 60")->fetchAll();
                    ?>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Изображение</th>
                                <th>Заголовок новости</th>
                                <th>Категория</th>
                                <th>Дата (МСК)</th>
                                <th>Просмотры</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($newsList as $n): ?>
                                <tr>
                                    <td>#<?= $n['id'] ?></td>
                                    <td><img src="<?= htmlspecialchars(resolveImg($n['image'])) ?>" style="width:50px; height:36px; object-fit:cover; border-radius:4px;" alt=""></td>
                                    <td>
                                        <strong><?= htmlspecialchars($n['title']) ?></strong><br>
                                        <a href="/news/<?= htmlspecialchars($n['category']) ?>/<?= htmlspecialchars($n['slug']) ?>" target="_blank" style="font-size:0.775rem; color:#0a5c36;">/news/<?= htmlspecialchars($n['category']) ?>/<?= htmlspecialchars($n['slug']) ?> &nearr;</a>
                                    </td>
                                    <td><span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;"><?= strtoupper($n['category']) ?></span></td>
                                    <td><strong><?= formatNewsDate($n['published_at']) ?></strong></td>
                                    <td><?= $n['views'] ?></td>
                                    <td>
                                        <a href="admin.php?action=news_edit&id=<?= $n['id'] ?>" class="btn-admin btn-admin-primary btn-admin-sm">✏️</a>
                                        <a href="admin.php?action=news_delete&id=<?= $n['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить эту новость?')">🗑️</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <!-- ===================== РЕДАКТОР НОВОСТИ ===================== -->
            <?php elseif ($action === 'news_edit'):
                $id = (int)($_GET['id'] ?? 0);
                $newsItem = null;
                if ($id > 0) {
                    $st = $pdo->prepare("SELECT * FROM news WHERE id = ?");
                    $st->execute([$id]);
                    $newsItem = $st->fetch();
                }
            ?>
                <div class="admin-card">
                    <h2 class="admin-card-title"><?= $newsItem ? 'Редактирование новости' : 'Создание новости' ?></h2>
                    <form action="admin.php?action=news_save" method="POST" style="margin-top:20px;">
                        <input type="hidden" name="id" value="<?= $newsItem ? $newsItem['id'] : 0 ?>">
                        
                        <div class="form-group">
                            <label class="form-label">Заголовок новости (H1):</label>
                            <input type="text" name="title" class="form-control" value="<?= $newsItem ? htmlspecialchars($newsItem['title']) : '' ?>" required>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">URL Slug:</label>
                                <input type="text" name="slug" class="form-control" value="<?= $newsItem ? htmlspecialchars($newsItem['slug']) : '' ?>" placeholder="avto-translit">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Категория турнира/серии:</label>
                                <select name="category" class="form-control">
                                    <option value="atp" <?= ($newsItem && $newsItem['category'] === 'atp') ? 'selected' : '' ?>>ATP Тур</option>
                                    <option value="wta" <?= ($newsItem && $newsItem['category'] === 'wta') ? 'selected' : '' ?>>WTA Тур</option>
                                    <option value="grand-slam" <?= ($newsItem && $newsItem['category'] === 'grand-slam') ? 'selected' : '' ?>>Большой шлем</option>
                                    <option value="team-russia" <?= ($newsItem && $newsItem['category'] === 'team-russia') ? 'selected' : '' ?>>Сборная России</option>
                                    <option value="padel-pickleball" <?= ($newsItem && $newsItem['category'] === 'padel-pickleball') ? 'selected' : '' ?>>Падел и Пиклбол</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Изображение к новости (Уникальное фото):</label>
                            <input type="text" name="image" class="form-control" value="<?= $newsItem ? htmlspecialchars($newsItem['image']) : '/images/news-medvedev.jpg' ?>" required>
                            <div class="form-hint">В базе доступны уникальные фото: /images/news-medvedev.jpg, /images/news-andreeva.jpg, /images/news-sinner-alcaraz.jpg, /images/news-team-russia.jpg, /images/news-padel.jpg, /images/news-rublev.jpg, /images/news-shnaider.jpg, /images/news-khachanov.jpg, /images/news-kasatkina.jpg, /images/news-wimbledon.jpg, /images/news-kremlin-cup.jpg, /images/news-padel-championship.jpg</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Краткий лид новости:</label>
                            <textarea name="excerpt" class="form-control" rows="3" required><?= $newsItem ? htmlspecialchars($newsItem['excerpt']) : '' ?></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Текст новости (Визуальный TinyMCE + код):</label>
                            <textarea name="content" class="wysiwyg-editor"><?= $newsItem ? htmlspecialchars($newsItem['content']) : '' ?></textarea>
                        </div>

                        <div style="display:flex; gap:20px; margin-bottom:20px;">
                            <label style="display:flex; align-items:center; gap:8px;">
                                <input type="checkbox" name="is_featured" value="1" <?= ($newsItem && $newsItem['is_featured']) ? 'checked' : '' ?>>
                                <strong>Главная новость дня</strong>
                            </label>
                            <label style="display:flex; align-items:center; gap:8px;">
                                <input type="checkbox" name="is_hot_24h" value="1" <?= ($newsItem && $newsItem['is_hot_24h']) ? 'checked' : '' ?>>
                                <strong>Топ-24 часа на главной</strong>
                            </label>
                        </div>

                        <div style="display:flex; gap:12px; margin-top:24px;">
                            <button type="submit" class="btn-admin btn-admin-primary" style="padding:12px 28px; font-size:1rem;">💾 Сохранить новость</button>
                            <a href="admin.php?action=news" class="btn-admin btn-admin-secondary">Отмена</a>
                        </div>
                    </form>
                </div>

            <!-- ===================== РАКЕТКИ И ЭКИПИРОВКА 2026 ===================== -->
            <?php elseif ($action === 'gear'): ?>
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">Ракетки и Экипировка 2026</h2>
                        <a href="admin.php?action=gear_edit" class="btn-admin btn-admin-primary">+ Добавить модель</a>
                    </div>
                    <?php
                    $gearList = $pdo->query("SELECT * FROM gear_reviews ORDER BY id ASC")->fetchAll();
                    ?>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Фото</th>
                                <th>Бренд и модель</th>
                                <th>Категория</th>
                                <th>Цена</th>
                                <th>Рейтинг</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($gearList as $g): ?>
                                <tr>
                                    <td>#<?= $g['id'] ?></td>
                                    <td><img src="<?= htmlspecialchars(resolveImg($g['image'])) ?>" style="width:50px; height:36px; object-fit:cover; border-radius:4px;" alt=""></td>
                                    <td><strong><?= htmlspecialchars($g['brand']) ?> <?= htmlspecialchars($g['title']) ?></strong></td>
                                    <td><?= htmlspecialchars($g['category']) ?></td>
                                    <td><strong style="color:#c84c1f;"><?= htmlspecialchars($g['price']) ?></strong></td>
                                    <td>⭐ <?= $g['rating'] ?>/10</td>
                                    <td>
                                        <a href="admin.php?action=gear_edit&id=<?= $g['id'] ?>" class="btn-admin btn-admin-primary btn-admin-sm">✏️</a>
                                        <a href="admin.php?action=gear_delete&id=<?= $g['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить эту модель?')">🗑️</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <!-- ===================== РЕДАКТОР ЭКИПИРОВКИ ===================== -->
            <?php elseif ($action === 'gear_edit'):
                $id = (int)($_GET['id'] ?? 0);
                $gearItem = null;
                if ($id > 0) {
                    $st = $pdo->prepare("SELECT * FROM gear_reviews WHERE id = ?");
                    $st->execute([$id]);
                    $gearItem = $st->fetch();
                }
            ?>
                <div class="admin-card">
                    <h2 class="admin-card-title"><?= $gearItem ? 'Редактирование ракетки/экипировки' : 'Добавление новой ракетки/экипировки' ?></h2>
                    <form action="admin.php?action=gear_save" method="POST" style="margin-top:20px;">
                        <input type="hidden" name="id" value="<?= $gearItem ? $gearItem['id'] : 0 ?>">
                        
                        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Название модели (H1):</label>
                                <input type="text" name="title" class="form-control" value="<?= $gearItem ? htmlspecialchars($gearItem['title']) : '' ?>" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Бренд:</label>
                                <input type="text" name="brand" class="form-control" value="<?= $gearItem ? htmlspecialchars($gearItem['brand']) : 'Wilson' ?>" required>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Категория:</label>
                                <select name="category" class="form-control">
                                    <option value="rackets" <?= ($gearItem && $gearItem['category'] === 'rackets') ? 'selected' : '' ?>>Ракетки</option>
                                    <option value="padel" <?= ($gearItem && $gearItem['category'] === 'padel') ? 'selected' : '' ?>>Падел ракетки</option>
                                    <option value="strings" <?= ($gearItem && $gearItem['category'] === 'strings') ? 'selected' : '' ?>>Струны</option>
                                    <option value="shoes" <?= ($gearItem && $gearItem['category'] === 'shoes') ? 'selected' : '' ?>>Кроссовки</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Ориентировочная цена:</label>
                                <input type="text" name="price" class="form-control" value="<?= $gearItem ? htmlspecialchars($gearItem['price']) : '28 900 ₽' ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Экспертная оценка (0-10):</label>
                                <input type="number" step="0.1" name="rating" class="form-control" value="<?= $gearItem ? $gearItem['rating'] : 9.5 ?>">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">URL фото экипировки:</label>
                            <input type="text" name="image" class="form-control" value="<?= $gearItem ? htmlspecialchars($gearItem['image']) : '/images/racket-pro-staff.jpg' ?>">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Экспертный обзор и характеристики (TinyMCE + код):</label>
                            <textarea name="content" class="wysiwyg-editor"><?= $gearItem ? htmlspecialchars($gearItem['content']) : '' ?></textarea>
                        </div>

                        <div style="display:flex; gap:12px; margin-top:24px;">
                            <button type="submit" class="btn-admin btn-admin-primary" style="padding:12px 28px; font-size:1rem;">💾 Сохранить экипировку</button>
                            <a href="admin.php?action=gear" class="btn-admin btn-admin-secondary">Отмена</a>
                        </div>
                    </form>
                </div>

            <!-- ===================== РЕДАКТОР БЛОКОВ (ШАПКА И ФУТЕР) ===================== -->
            <?php elseif ($action === 'blocks'):
                $settings = getGlobalSettings($pdo);
                $hdr = $settings['header'] ?? [];
                $ftr = $settings['footer'] ?? [];
                $ck = $settings['cookie_banner'] ?? [];
            ?>
                <div class="admin-card">
                    <h2 class="admin-card-title">Редактирование Шапки, Футера и Сквозных Блоков</h2>
                    <form action="admin.php?action=save_blocks" method="POST" style="margin-top:20px;">
                        
                        <h3 style="font-size:1.05rem; font-weight:800; color:#0a5c36; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">1. Верхняя панель и Шапка (Header)</h3>
                        <div class="form-group">
                            <label class="form-label">Название портала (логотип):</label>
                            <input type="text" name="site_name" class="form-control" value="<?= htmlspecialchars($hdr['site_name'] ?? 'Чемпион-Теннис') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Текст бегущей строки (Молния / Live ticker):</label>
                            <input type="text" name="ticker_text" class="form-control" value="<?= htmlspecialchars($hdr['ticker_text'] ?? '🔥 LIVE: Рим ATP 1000 — Медведев в полуфинале • Мирра Андреева в топ-6 WTA!') ?>">
                        </div>

                        <h3 style="font-size:1.05rem; font-weight:800; color:#0a5c36; margin:28px 0 12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">2. Подвал сайта (Footer)</h3>
                        <div class="form-group">
                            <label class="form-label">Слоган в футере (по ТЗ: «лучшее из мира спорта и тенниса»):</label>
                            <textarea name="footer_about" class="form-control" rows="2"><?= htmlspecialchars($ftr['about_text'] ?? 'лучшее из мира спорта и тенниса') ?></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Копирайт и обязательное уведомление о перепечатке:</label>
                            <textarea name="footer_copyright" class="form-control" rows="2"><?= htmlspecialchars($ftr['copyright'] ?? '© ' . date('Y') . ' champion-tennis.ru (Чемпион-Теннис). Все права защищены. При перепечатке материалов с сайта champion-tennis.ru ссылка на сайт обязательна!') ?></textarea>
                        </div>

                        <h3 style="font-size:1.05rem; font-weight:800; color:#0a5c36; margin:28px 0 12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">3. Cookie баннер согласия (152-ФЗ)</h3>
                        <div class="form-group">
                            <label class="form-label">Текст уведомления Cookie для новых посетителей:</label>
                            <textarea name="cookie_text" class="form-control" rows="2"><?= htmlspecialchars($ck['text'] ?? 'Мы используем cookie для персонализации сервиса и аналитики.') ?></textarea>
                        </div>

                        <button type="submit" class="btn-admin btn-admin-primary" style="padding:12px 28px; font-size:1rem; margin-top:16px;">💾 Применить глобальные настройки</button>
                    </form>
                </div>

            <!-- ===================== ЗАЯВКИ С ФОРМ ===================== -->
            <?php elseif ($action === 'subs'):
                $allSubs = $pdo->query("SELECT * FROM form_submissions ORDER BY created_at DESC")->fetchAll();
            ?>
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">Заявки и обращения с форм сайта</h2>
                        <span style="font-size:0.875rem; color:#059669; font-weight:700;">✔ Каждая заявка дублируется на sonicsquad@mail.ru</span>
                    </div>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Дата и время</th>
                                <th>Тип формы</th>
                                <th>Имя / Отправитель</th>
                                <th>Контакт</th>
                                <th>Тема и сообщение</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($allSubs as $s): ?>
                                <tr>
                                    <td>#<?= $s['id'] ?></td>
                                    <td><strong><?= formatNewsDate($s['created_at']) ?></strong></td>
                                    <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.75rem;"><?= htmlspecialchars($s['form_type']) ?></span></td>
                                    <td><strong><?= htmlspecialchars($s['name']) ?></strong></td>
                                    <td><code><?= htmlspecialchars($s['contact_info']) ?></code></td>
                                    <td style="max-width:320px; word-break:break-word;">
                                        <?php if ($s['subject']): ?><strong><?= htmlspecialchars($s['subject']) ?>:</strong> <?php endif; ?>
                                        <?= htmlspecialchars($s['message']) ?>
                                    </td>
                                    <td>
                                        <?php if ($s['status'] === 'processed'): ?>
                                            <span style="background:#dcfce7; color:#15803d; font-weight:800; padding:4px 8px; border-radius:4px; font-size:0.75rem;">✔ Обработано</span>
                                        <?php else: ?>
                                            <span style="background:#fef3c7; color:#92400e; font-weight:800; padding:4px 8px; border-radius:4px; font-size:0.75rem;">Новая</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <div style="display:flex; gap:6px;">
                                            <?php if ($s['status'] !== 'processed'): ?>
                                                <a href="admin.php?action=sub_process&id=<?= $s['id'] ?>" class="btn-admin btn-admin-success btn-admin-sm" title="Пометить как обработанную">✔ Обработано</a>
                                            <?php endif; ?>
                                            <a href="admin.php?action=sub_delete&id=<?= $s['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить эту заявку полностью?')" title="Удалить заявку">🗑️</a>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </main>
    </div>
</body>
</html>
