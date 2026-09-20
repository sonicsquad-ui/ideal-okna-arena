<?php
session_start();

$usersFile = __DIR__ . '/../data/users.json';
$users = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];
$settingsFile = __DIR__ . '/../data/settings.json';
$settings = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];

// Check login action
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $u = trim($_POST['username'] ?? '');
    $p = trim($_POST['password'] ?? '');

    if (isset($users[$u])) {
        $user = $users[$u];
        $salt = $user['salt'] ?? 'orientir_salt_2026';
        $hashed = hash('sha256', $p . $salt);
        if ($hashed === $user['passwordHash']) {
            $_SESSION['orientir_admin'] = $u;
            header('Location: /admin/');
            exit;
        }
    }
    $error = 'Неверный логин или пароль администратора';
}

if (isset($_GET['logout'])) {
    unset($_SESSION['orientir_admin']);
    header('Location: /admin/');
    exit;
}

$isLoggedIn = !empty($_SESSION['orientir_admin']);

if (!$isLoggedIn):
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Вход в панель управления | orientirprof.ru</title>
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
  <div class="admin-login-wrap">
    <div class="admin-login-box">
      <img class="admin-login-logo" src="/images/logo-compass.svg" alt="Логотип">
      <h1 class="admin-login-title">Вход в панель управления</h1>
      <p class="admin-login-sub">Сайт профориентолога Марины Бондаревой</p>
      <?php if (!empty($error)): ?>
        <div style="background:#fee2e2;color:#991b1b;padding:12px;border-radius:8px;font-size:0.88rem;margin-bottom:18px;">
          <?= htmlspecialchars($error) ?>
        </div>
      <?php endif; ?>
      <form method="POST">
        <input type="hidden" name="action" value="login">
        <div style="margin-bottom:16px;text-align:left;">
          <label class="form-label">Логин администратора</label>
          <input class="form-control" type="text" name="username" required autofocus placeholder="admin">
        </div>
        <div style="margin-bottom:24px;text-align:left;">
          <label class="form-label">Пароль</label>
          <input class="form-control" type="password" name="password" required placeholder="••••••••">
        </div>
        <button class="form-control" type="submit" style="background:#2563eb;color:#fff;font-weight:700;cursor:pointer;padding:12px;border:none;">
          Войти в панель
        </button>
      </form>
      <div style="margin-top:20px;">
        <a href="/" style="font-size:0.84rem;color:#64748b;text-decoration:none;">← Вернуться на сайт</a>
      </div>
    </div>
  </div>
</body>
</html>
<?php
exit;
endif;

// Handle save actions if logged in
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_section'])) {
    $sec = $_POST['save_section'];
    if ($sec === 'robots' && isset($_POST['robotsContent'])) {
        file_put_contents(__DIR__ . '/../robots.txt', $_POST['robotsContent']);
        $saveSuccess = 'Файл robots.txt успешно обновлен!';
    } elseif ($sec === 'header') {
        $settings['contacts']['phone'] = $_POST['phone'] ?? $settings['contacts']['phone'];
        $settings['contacts']['phoneSecondary'] = $_POST['phoneSecondary'] ?? $settings['contacts']['phoneSecondary'];
        $settings['contacts']['workHours'] = $_POST['workHours'] ?? $settings['contacts']['workHours'];
        $settings['contacts']['address'] = $_POST['address'] ?? $settings['contacts']['address'];
        $settings['contacts']['email'] = $_POST['email'] ?? $settings['contacts']['email'];
        file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $saveSuccess = 'Шапка и контакты сохранены!';
    }
}

$leadsFile = __DIR__ . '/../data/leads.json';
$leads = file_exists($leadsFile) ? json_decode(file_get_contents($leadsFile), true) : [];
$pagesFile = __DIR__ . '/../data/pages.json';
$pages = file_exists($pagesFile) ? json_decode(file_get_contents($pagesFile), true) : [];
$robotsContent = file_exists(__DIR__ . '/../robots.txt') ? file_get_contents(__DIR__ . '/../robots.txt') : '';
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Панель управления CMS | orientirprof.ru</title>
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
  <aside class="admin-sidebar">
    <div class="admin-sidebar-brand">
      <img src="/images/logo-compass.svg" alt="ОриентирПроф" width="36" height="36">
      <div>
        <div style="font-weight:800;font-size:1.05rem;color:#fff;">ОриентирПроф</div>
        <div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;">Хостинг CMS</div>
      </div>
    </div>
    <nav class="admin-sidebar-menu">
      <button class="admin-menu-item active" data-tab="tab-dashboard">📊 Дашборд</button>
      <button class="admin-menu-item" data-tab="tab-header">📞 Шапка и контакты</button>
      <button class="admin-menu-item" data-tab="tab-robots">🤖 robots.txt</button>
      <button class="admin-menu-item" data-tab="tab-leads">📬 Заявки (<?= count($leads) ?>)</button>
    </nav>
    <div class="admin-sidebar-footer">
      <a href="/" target="_blank" style="color:#94a3b8;font-size:0.84rem;">На сайт ↗</a>
      <a href="/admin/?logout=1" style="color:#ef4444;font-size:0.84rem;">Выйти</a>
    </div>
  </aside>

  <div class="admin-main">
    <div class="admin-topbar">
      <h2 class="admin-topbar-title">Панель управления на хостинге</h2>
      <a class="form-control" href="/" target="_blank" style="width:auto;text-decoration:none;background:#2563eb;color:#fff;font-weight:600;padding:8px 16px;">Перейти на сайт ↗</a>
    </div>

    <div class="admin-content-area">
      <?php if (!empty($saveSuccess)): ?>
        <div style="background:#dcfce7;color:#166534;padding:12px;border-radius:8px;margin-bottom:20px;">
          <?= htmlspecialchars($saveSuccess) ?>
        </div>
      <?php endif; ?>

      <div class="admin-tab-pane active" id="tab-dashboard">
        <div class="admin-card">
          <h3 class="admin-card-title">Сайт Профориентолог Марина Бондарева</h3>
          <p style="color:#64748b;margin:12px 0 20px;">
            Сайт успешно функционирует на вашем хостинге и прикреплен к домену <strong>https://orientirprof.ru/</strong>.
          </p>
          <div style="display:flex;gap:14px;">
            <div style="background:#f1f5f9;padding:16px 20px;border-radius:10px;">
              <div style="font-size:1.4rem;font-weight:800;color:#0f172a;"><?= count($pages) ?></div>
              <div style="font-size:0.82rem;color:#64748b;">Страниц на сайте</div>
            </div>
            <div style="background:#f1f5f9;padding:16px 20px;border-radius:10px;">
              <div style="font-size:1.4rem;font-weight:800;color:#0f172a;"><?= count($leads) ?></div>
              <div style="font-size:0.82rem;color:#64748b;">Полученных заявок</div>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <h3 class="admin-card-title">Входящие заявки клиентов</h3>
          <div class="admin-table-wrap" style="margin-top:16px;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Услуга</th>
                  <th>Сообщение</th>
                </tr>
              </thead>
              <tbody>
                <?php if (empty($leads)): ?>
                  <tr><td colspan="5" style="text-align:center;padding:20px;">Заявок пока нет</td></tr>
                <?php else: foreach (array_reverse($leads) as $l): ?>
                  <tr>
                    <td><?= htmlspecialchars($l['date'] ?? '') ?></td>
                    <td><strong><?= htmlspecialchars($l['name'] ?? '') ?></strong></td>
                    <td><a href="tel:<?= preg_replace('/\D/', '', $l['phone'] ?? '') ?>"><?= htmlspecialchars($l['phone'] ?? '') ?></a></td>
                    <td><?= htmlspecialchars($l['service'] ?? '') ?></td>
                    <td style="font-size:0.84rem;"><?= htmlspecialchars($l['message'] ?? $l['testSummary'] ?? '') ?></td>
                  </tr>
                <?php endforeach; endif; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="admin-tab-pane" id="tab-header">
        <div class="admin-card">
          <h3 class="admin-card-title">Редактирование контактов</h3>
          <form method="POST">
            <input type="hidden" name="save_section" value="header">
            <div style="margin-bottom:14px;">
              <label class="form-label">Телефон</label>
              <input class="form-control" type="text" name="phone" value="<?= htmlspecialchars($settings['contacts']['phone'] ?? '') ?>">
            </div>
            <div style="margin-bottom:14px;">
              <label class="form-label">Второй телефон</label>
              <input class="form-control" type="text" name="phoneSecondary" value="<?= htmlspecialchars($settings['contacts']['phoneSecondary'] ?? '') ?>">
            </div>
            <div style="margin-bottom:14px;">
              <label class="form-label">Режим работы</label>
              <input class="form-control" type="text" name="workHours" value="<?= htmlspecialchars($settings['contacts']['workHours'] ?? '') ?>">
            </div>
            <div style="margin-bottom:14px;">
              <label class="form-label">Адрес</label>
              <input class="form-control" type="text" name="address" value="<?= htmlspecialchars($settings['contacts']['address'] ?? '') ?>">
            </div>
            <div style="margin-bottom:20px;">
              <label class="form-label">Email для заявок</label>
              <input class="form-control" type="email" name="email" value="<?= htmlspecialchars($settings['contacts']['email'] ?? '') ?>">
            </div>
            <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:10px 24px;">Сохранить</button>
          </form>
        </div>
      </div>

      <div class="admin-tab-pane" id="tab-robots">
        <div class="admin-card">
          <h3 class="admin-card-title">Редактор robots.txt</h3>
          <form method="POST">
            <input type="hidden" name="save_section" value="robots">
            <div style="margin-bottom:16px;">
              <textarea class="form-control" name="robotsContent" rows="10" style="font-family:monospace;"><?= htmlspecialchars($robotsContent) ?></textarea>
            </div>
            <button class="form-control" type="submit" style="width:auto;background:#2563eb;color:#fff;font-weight:700;padding:10px 24px;">Сохранить robots.txt</button>
          </form>
        </div>
      </div>

      <div class="admin-tab-pane" id="tab-leads">
        <div class="admin-card">
          <h3 class="admin-card-title">Журнал всех заявок</h3>
          <div class="admin-table-wrap" style="margin-top:16px;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Услуга</th>
                  <th>Сообщение</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach (array_reverse($leads) as $l): ?>
                  <tr>
                    <td><?= htmlspecialchars($l['date'] ?? '') ?></td>
                    <td><strong><?= htmlspecialchars($l['name'] ?? '') ?></strong></td>
                    <td><?= htmlspecialchars($l['phone'] ?? '') ?></td>
                    <td><?= htmlspecialchars($l['service'] ?? '') ?></td>
                    <td><?= htmlspecialchars($l['message'] ?? $l['testSummary'] ?? '') ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="/js/admin.js"></script>
</body>
</html>
