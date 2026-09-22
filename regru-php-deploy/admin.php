<?php
/**
 * Champion-Tennis.ru — Административная панель (PHP версия для хостинга REG.RU)
 * Доступна по адресу: https://champion-tennis.ru/admin
 */

session_start();
require_once __DIR__ . '/config.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'dashboard';
$error = null;
$success = null;

// Аутентификация
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
        <title>Вход в панель управления — Champion-Tennis.ru</title>
        <link rel="stylesheet" href="/css/admin.css">
    </head>
    <body class="admin-body admin-login-wrap">
        <div class="admin-login-card">
            <div class="login-brand">
                <div style="width: 48px; height: 48px; background: #0a5c36; border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; color: #ccff00;">
                    <svg style="width: 28px; height: 28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke="#ccff00"/>
                        <path d="M4.93 4.93c4.2 4.2 4.2 10.94 0 15.14" stroke="#ffffff"/>
                    </svg>
                </div>
                <h1>Чемпион-Теннис</h1>
                <p>Административная панель портала champion-tennis.ru</p>
            </div>
            <?php if ($error): ?><div class="alert alert-danger"><?= htmlspecialchars($error) ?></div><?php endif; ?>
            <form action="admin.php?action=login" method="POST">
                <div class="form-group">
                    <label class="form-label">Логин:</label>
                    <input type="text" name="username" class="form-control" required placeholder="admin" autofocus>
                </div>
                <div class="form-group">
                    <label class="form-label">Пароль:</label>
                    <input type="password" name="password" class="form-control" required placeholder="••••••••••••">
                </div>
                <button type="submit" class="btn-admin btn-admin-primary" style="width:100%; justify-content:center; padding:12px; font-size:1rem;">Войти в систему &rarr;</button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <a href="/" style="font-size: 0.8125rem; color: #64748b;">&larr; Вернуться на главный сайт</a>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Получаем общую статистику
$countPages = $pdo->query("SELECT COUNT(*) FROM pages")->fetchColumn();
$countArticles = $pdo->query("SELECT COUNT(*) FROM articles")->fetchColumn();
$countNews = $pdo->query("SELECT COUNT(*) FROM news")->fetchColumn();
$countSubs = $pdo->query("SELECT COUNT(*) FROM form_submissions")->fetchColumn();

// Обработка сохранения страниц
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

// Дублирование страницы
if ($action === 'page_duplicate' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM pages WHERE id = ?");
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if ($p) {
        $newSlug = $p['slug'] . '-copy-' . rand(100, 999);
        $newTitle = $p['title'] . ' (Копия)';
        $stmtIns = $pdo->prepare("INSERT INTO pages (slug, title, meta_title, meta_description, meta_keywords, content, is_system) VALUES (?, ?, ?, ?, ?, ?, 0)");
        $stmtIns->execute([$newSlug, $newTitle, $p['meta_title'], $p['meta_description'], $p['meta_keywords'], $p['content']]);
    }
    header("Location: admin.php?action=pages");
    exit;
}

// Удаление страницы
if ($action === 'page_delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM pages WHERE id = ? AND is_system = 0");
    $stmt->execute([$id]);
    header("Location: admin.php?action=pages");
    exit;
}

// Сохранение блоков
if ($action === 'save_blocks' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $current = getGlobalSettings($pdo);
    $current['header']['site_name'] = $_POST['site_name'] ?? $current['header']['site_name'];
    $current['header']['ticker_text'] = $_POST['ticker_text'] ?? $current['header']['ticker_text'];
    $current['footer']['about_text'] = $_POST['footer_about'] ?? $current['footer']['about_text'];
    $current['footer']['copyright'] = $_POST['footer_copyright'] ?? $current['footer']['copyright'];

    $stmt = $pdo->prepare("INSERT INTO global_blocks (key, value_json) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json");
    foreach ($current as $k => $v) {
        $stmt->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);
    }
    header("Location: admin.php?action=blocks&saved=1");
    exit;
}

// Вывод административного интерфейса
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Панель управления — Champion-Tennis.ru</title>
    <link rel="stylesheet" href="/css/admin.css">
    <link rel="stylesheet" href="/public/css/admin.css">
    <style>
        :root { --admin-primary: #0a5c36; --admin-bg: #f1f5f9; --admin-sidebar-bg: #0f172a; }
        body.admin-body { margin: 0; font-family: system-ui, sans-serif; background: var(--admin-bg); display: flex; min-height: 100vh; }
        .admin-sidebar { width: 260px; background: var(--admin-sidebar-bg); color: #94a3b8; display: flex; flex-direction: column; flex-shrink: 0; }
        .admin-main { flex: 1; display: flex; flex-direction: column; }
        .admin-topbar { background: white; padding: 14px 28px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .admin-content { padding: 28px; }
    </style>
</head>
<body class="admin-body">
    <aside class="admin-sidebar">
        <div class="admin-sidebar-header">
            <a href="admin.php" class="admin-brand">
                <span>Чемпион-Теннис</span>
            </a>
        </div>
        <nav class="admin-nav">
            <a href="admin.php?action=dashboard" class="admin-nav-item <?= $action === 'dashboard' ? 'active' : '' ?>">Сводка</a>
            <a href="admin.php?action=pages" class="admin-nav-item <?= $action === 'pages' ? 'active' : '' ?>">Страницы (<?= $countPages ?>)</a>
            <a href="admin.php?action=blog" class="admin-nav-item <?= $action === 'blog' ? 'active' : '' ?>">Статьи блога (<?= $countArticles ?>)</a>
            <a href="admin.php?action=news" class="admin-nav-item <?= $action === 'news' ? 'active' : '' ?>">Новости (<?= $countNews ?>)</a>
            <a href="admin.php?action=blocks" class="admin-nav-item <?= $action === 'blocks' ? 'active' : '' ?>">Шапка и Футер</a>
            <a href="admin.php?action=subs" class="admin-nav-item <?= $action === 'subs' ? 'active' : '' ?>">Заявки с форм (<?= $countSubs ?>)</a>
            <hr style="border:0; border-top:1px solid #1e293b; margin:10px 0;">
            <a href="/" target="_blank" class="admin-nav-item">Открыть сайт &nearr;</a>
        </nav>
        <div class="admin-sidebar-footer">
            <span style="color:white; font-size:0.8rem;">admin</span>
            <a href="admin.php?action=logout" class="admin-logout-btn">Выход</a>
        </div>
    </aside>

    <div class="admin-main">
        <header class="admin-topbar">
            <h1 class="admin-page-title">Панель управления Champion-Tennis.ru</h1>
            <div class="admin-topbar-actions">
                <a href="cron_news.php" target="_blank" class="btn-admin btn-admin-warning btn-admin-sm">⚡ Запустить Cron вручную</a>
                <a href="admin.php?action=page_edit" class="btn-admin btn-admin-primary btn-admin-sm">+ Создать страницу</a>
            </div>
        </header>

        <main class="admin-content">
            <?php if ($action === 'dashboard'): ?>
                <div class="admin-stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-title">Страниц сайта</div>
                        <div class="stat-card-val"><?= $countPages ?></div>
                        <div class="stat-card-desc"><a href="admin.php?action=pages">Управление &rarr;</a></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Статей блога</div>
                        <div class="stat-card-val"><?= $countArticles ?></div>
                        <div class="stat-card-desc"><a href="admin.php?action=blog">Редактор &rarr;</a></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Новостей в базе</div>
                        <div class="stat-card-val"><?= $countNews ?></div>
                        <div class="stat-card-desc">Авто-Cron в 8:00 МСК</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Заявок с форм</div>
                        <div class="stat-card-val"><?= $countSubs ?></div>
                        <div class="stat-card-desc" style="color:#059669;">Дублируются на sonicsquad@mail.ru</div>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header">
                        <h2 class="admin-card-title">📬 Последние входящие обращения с сайта</h2>
                    </div>
                    <?php
                    $stmtSubs = $pdo->query("SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 5");
                    $subs = $stmtSubs->fetchAll();
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
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($subs as $s): ?>
                                <tr>
                                    <td><?= htmlspecialchars($s['created_at']) ?></td>
                                    <td><strong><?= htmlspecialchars($s['form_type']) ?></strong></td>
                                    <td><?= htmlspecialchars($s['name']) ?></td>
                                    <td><code><?= htmlspecialchars($s['contact_info']) ?></code></td>
                                    <td><?= htmlspecialchars($s['subject'] . ' ' . $s['message']) ?></td>
                                    <td><span style="color:#16a34a; font-weight:700;">✔ Отправлено на sonicsquad@mail.ru</span></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

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
                                <th>Название</th>
                                <th>URL</th>
                                <th>Тип</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($pages as $p): ?>
                                <tr>
                                    <td>#<?= $p['id'] ?></td>
                                    <td><strong><?= htmlspecialchars($p['title']) ?></strong></td>
                                    <td><a href="/<?= htmlspecialchars($p['slug']) ?>" target="_blank">/<?= htmlspecialchars($p['slug']) ?> &nearr;</a></td>
                                    <td><?= $p['is_system'] ? 'Системная' : 'Пользовательская' ?></td>
                                    <td>
                                        <a href="admin.php?action=page_edit&id=<?= $p['id'] ?>" class="btn-admin btn-admin-primary btn-admin-sm">Редактор</a>
                                        <a href="admin.php?action=page_duplicate&id=<?= $p['id'] ?>" class="btn-admin btn-admin-secondary btn-admin-sm">Копия</a>
                                        <?php if (!$p['is_system']): ?>
                                            <a href="admin.php?action=page_delete&id=<?= $p['id'] ?>" class="btn-admin btn-admin-danger btn-admin-sm" onclick="return confirm('Удалить?')">🗑️</a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

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
                    <h2 class="admin-card-title"><?= $page ? 'Редактирование страницы' : 'Создание новой страницы' ?></h2>
                    <form action="admin.php?action=page_save" method="POST">
                        <input type="hidden" name="id" value="<?= $page ? $page['id'] : 0 ?>">
                        <div class="form-group">
                            <label class="form-label">Заголовок страницы (H1):</label>
                            <input type="text" name="title" class="form-control" value="<?= $page ? htmlspecialchars($page['title']) : '' ?>" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">URL Slug:</label>
                            <input type="text" name="slug" class="form-control" value="<?= $page ? htmlspecialchars($page['slug']) : '' ?>" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Meta Title:</label>
                            <input type="text" name="meta_title" class="form-control" value="<?= $page ? htmlspecialchars($page['meta_title']) : '' ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Meta Description:</label>
                            <textarea name="meta_description" class="form-control" rows="2"><?= $page ? htmlspecialchars($page['meta_description']) : '' ?></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Контент страницы (HTML и текст):</label>
                            <textarea name="content" class="form-control" rows="14"><?= $page ? htmlspecialchars($page['content']) : '' ?></textarea>
                            <div class="form-hint">Поддерживается полный HTML код, вставка изображений, кнопок и ссылок.</div>
                        </div>
                        <button type="submit" class="btn-admin btn-admin-primary" style="padding:12px 24px;">💾 Сохранить страницу</button>
                    </form>
                </div>

            <?php elseif ($action === 'subs'): ?>
                <div class="admin-card">
                    <h2 class="admin-card-title">Все заявки с форм сайта</h2>
                    <?php
                    $stmtAllSubs = $pdo->query("SELECT * FROM form_submissions ORDER BY created_at DESC");
                    $allSubs = $stmtAllSubs->fetchAll();
                    ?>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Дата</th>
                                <th>Тип</th>
                                <th>Имя</th>
                                <th>Контакт</th>
                                <th>Сообщение</th>
                                <th>Маршрутизация</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($allSubs as $s): ?>
                                <tr>
                                    <td>#<?= $s['id'] ?></td>
                                    <td><?= htmlspecialchars($s['created_at']) ?></td>
                                    <td><?= htmlspecialchars($s['form_type']) ?></td>
                                    <td><?= htmlspecialchars($s['name']) ?></td>
                                    <td><?= htmlspecialchars($s['contact_info']) ?></td>
                                    <td><?= htmlspecialchars($s['subject'] . ' | ' . $s['message']) ?></td>
                                    <td><span style="color:#16a34a; font-weight:700;">✔ sonicsquad@mail.ru</span></td>
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
