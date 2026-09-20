/**
 * ORIENTIRPROF.RU — Генератор сборки для простого хостинга
 * Собирает статические HTML страницы, PHP-скрипты отправки и панель управления
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { buildPageBySlug } = require('./lib/pageBuilder');
const { getPages, getBlog } = require('./lib/renderer');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function exportSite() {
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  console.log('1. Копирование статических ресурсов...');
  // Copy public assets
  const publicDir = path.join(__dirname, 'public');
  copyDir(publicDir, distDir);

  // Copy data directory
  const dataDir = path.join(__dirname, 'data');
  copyDir(dataDir, path.join(distDir, 'data'));

  console.log('2. Рендеринг всех страниц сайта в статический HTML...');
  const pages = getPages();
  const blog = getBlog();

  // Render system & custom pages
  for (const [key, page] of Object.entries(pages)) {
    const html = buildPageBySlug(page.slug);
    if (!html) continue;

    let targetFile;
    if (page.slug === '/') {
      targetFile = path.join(distDir, 'index.html');
    } else {
      const cleanSlug = page.slug.replace(/^\//, '').replace(/\/$/, '');
      const subDir = path.join(distDir, cleanSlug);
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      targetFile = path.join(subDir, 'index.html');
    }

    fs.writeFileSync(targetFile, html, 'utf8');
    console.log(`   ✓ Сгенерирована страница: ${page.slug} -> ${path.relative(distDir, targetFile)}`);
  }

  // Render blog articles
  for (const article of blog) {
    const articleSlug = `/blog/${article.slug}/`;
    const html = buildPageBySlug(articleSlug);
    if (!html) continue;

    const subDir = path.join(distDir, 'blog', article.slug);
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    const targetFile = path.join(subDir, 'index.html');
    fs.writeFileSync(targetFile, html, 'utf8');
    console.log(`   ✓ Сгенерирована статья: ${articleSlug} -> ${path.relative(distDir, targetFile)}`);
  }

  console.log('3. Генерация PHP скриптов для простого хостинга...');

  // 3a. dist/api/send.php and dist/send.php
  const sendPhpDir = path.join(distDir, 'api');
  if (!fs.existsSync(sendPhpDir)) fs.mkdirSync(sendPhpDir, { recursive: true });

  const sendPhpContent = `<?php
header('Content-Type: application/json; charset=utf-8');

// Получение данных JSON или POST
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!$data) {
    $data = $_POST;
}

$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$service = isset($data['service']) ? trim($data['service']) : 'Заявка с сайта';
$message = isset($data['message']) ? trim($data['message']) : '';
$testSummary = isset($data['testSummary']) ? trim($data['testSummary']) : '';
$audience = isset($data['audience']) ? trim($data['audience']) : '';

if (empty($name) || empty($phone)) {
    echo json_encode([
        'success' => false,
        'error' => 'Пожалуйста, укажите имя и номер телефона.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Сохранение заявки в базу данных leads.json
$leadsFile = __DIR__ . '/../data/leads.json';
if (!file_exists($leadsFile)) {
    $leadsFile = __DIR__ . '/data/leads.json';
}

$leads = [];
if (file_exists($leadsFile)) {
    $content = file_get_contents($leadsFile);
    $leads = json_decode($content, true) ?: [];
}

$newLead = [
    'id' => time() . '_' . rand(100, 999),
    'date' => date('d.m.Y H:i'),
    'name' => $name,
    'phone' => $phone,
    'service' => $service,
    'message' => $message,
    'audience' => $audience,
    'testSummary' => $testSummary,
    'status' => 'new'
];

$leads[] = $newLead;
@file_put_contents($leadsFile, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// 2. Отправка уведомления на электронную почту sunvard@yandex.ru
$toEmail = 'sunvard@yandex.ru';
$subject = "Новая заявка с сайта orientirprof.ru: {$name}";

$body = "Получена новая заявка с персонального сайта профориентолога orientirprof.ru:\\n\\n";
$body .= "Имя клиента: {$name}\\n";
$body .= "Телефон: {$phone}\\n";
$body .= "Услуга / Тип: {$service}\\n";
if (!empty($audience)) {
    $body .= "Категория: {$audience}\\n";
}
if (!empty($testSummary)) {
    $body .= "Результат онлайн-теста:\\n{$testSummary}\\n";
}
if (!empty($message)) {
    $body .= "Сообщение / вопрос:\\n{$message}\\n";
}
$body .= "\\nДата и время: " . date('d.m.Y H:i') . "\\n";
$body .= "IP-адрес: " . $_SERVER['REMOTE_ADDR'] . "\\n";

$headers = "From: noreply@orientirprof.ru\\r\\n" .
           "Reply-To: noreply@orientirprof.ru\\r\\n" .
           "X-Mailer: PHP/" . phpversion() . "\\r\\n" .
           "Content-Type: text/plain; charset=utf-8\\r\\n";

@mail($toEmail, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);

echo json_encode([
    'success' => true,
    'message' => 'Спасибо! Ваша заявка успешно отправлена. Марина Бондарева свяжется с вами в ближайшее время.'
], JSON_UNESCAPED_UNICODE);
`;

  fs.writeFileSync(path.join(distDir, 'api', 'send.php'), sendPhpContent, 'utf8');
  fs.writeFileSync(path.join(distDir, 'send.php'), sendPhpContent, 'utf8');

  // 3b. .htaccess for shared hosting
  const htaccessContent = `# ORIENTIRPROF.RU — Apache конфигурация для простого хостинга

RewriteEngine On

# Принудительный HTTPS (раскомментируйте после установки SSL-сертификата)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Отправка заявок в скрипт
RewriteRule ^api/send/?$ api/send.php [L,QSA]

# Чистые ссылки: перенаправление на index.html внутри папок
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
RewriteRule ^(.*)/?$ $1/index.html [L]

# Кеширование браузера для ускорения загрузки
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Сжатие Gzip для быстрой отдачи
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>
`;
  fs.writeFileSync(path.join(distDir, '.htaccess'), htaccessContent, 'utf8');

  // 3c. Standalone PHP Admin Panel in dist/admin/
  const adminDir = path.join(distDir, 'admin');
  if (!fs.existsSync(adminDir)) fs.mkdirSync(adminDir, { recursive: true });

  const phpAdminIndex = `<?php
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
                    <td><a href="tel:<?= preg_replace('/\\D/', '', $l['phone'] ?? '') ?>"><?= htmlspecialchars($l['phone'] ?? '') ?></a></td>
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
`;
  fs.writeFileSync(path.join(adminDir, 'index.php'), phpAdminIndex, 'utf8');

  console.log('4. Создание архива ZIP для хостинга...');
  await createZipArchive(distDir);
  console.log('✅ Экспорт и сборка успешно завершены!');
}

const { execSync } = require('child_process');

function createZipArchive(distDir) {
  return new Promise((resolve, reject) => {
    try {
      const zipPath = path.join(__dirname, 'public', 'orientirprof-site.zip');
      const pyScript = `
import zipfile, os
def make_zip(source_dir, output_filename):
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                if file.endswith('.zip'): continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                zipf.write(full_path, rel_path)
make_zip('${distDir}', '${zipPath}')
`;
      execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`);
      if (fs.existsSync(zipPath)) {
        fs.copyFileSync(zipPath, path.join(distDir, 'orientirprof-site.zip'));
        const stats = fs.statSync(zipPath);
        console.log(`   ✓ Сформирован ZIP-архив: orientirprof-site.zip (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

if (require.main === module) {
  exportSite().catch(err => {
    console.error('Ошибка экспорта:', err);
    process.exit(1);
  });
}

module.exports = { exportSite };
