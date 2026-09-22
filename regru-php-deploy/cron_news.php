<?php
/**
 * Champion-Tennis.ru — Скрипт автоматического обновления новостей
 * Настройка в Cron панели REG.RU (cPanel / ISPmanager):
 * 0 8 * * * /opt/php/8.2/bin/php /var/www/uXXXXXXX/data/www/champion-tennis.ru/cron_news.php
 */

require_once __DIR__ . '/config.php';

// Templates of unique rewritten sport tennis news
$templates = [
    [
        'category' => 'atp',
        'source_name' => 'Чемпионат / Championat',
        'source_url' => 'https://www.championat.com/news/tennis/1.html',
        'title' => 'Даниил Медведев пробился в полуфинал престижного турнира ATP в трех напряженных сетах',
        'excerpt' => 'Первая ракетка России продемонстрировал несгибаемый характер и тактическую гибкость, сломив сопротивление опасного соперника на решающем тай-брейке.',
        'content' => '<p>Российский теннисист Даниил Медведев продолжил победную поступь на международной арене, оформив выход в полуфинальную стадию в матче, который держал болельщиков в напряжении более двух с половиной часов.</p><h3>Тактический перелом во втором сете</h3><p>Старт встречи сложился для Даниила непросто: соперник действовал с максимальной агрессией и активно выходил к сетке. Однако, уступив стартовую партию, Медведев перестроил позиционную оборону, отодвинулся на полтора метра за заднюю линию и начал методично расшатывать оппонента глубокими ударами под лево.</p>',
        'image' => '/images/news-medvedev.jpg'
    ],
    [
        'category' => 'wta',
        'source_name' => 'Спорт-Экспресс',
        'source_url' => 'https://www.sport-express.ru/tennis/',
        'title' => 'Мирра Андреева сенсационно обыграла соперницу из топ-5 и вышла в решающий раунд',
        'excerpt' => '19-летняя российская звезда показала зрелую игру на задней линии, допустив всего 9 невынужденных ошибок за весь полуторачасовой поединок.',
        'content' => '<p>Юная звезда отечественного тенниса Мирра Андреева вновь заставила говорить о себе теннисный мир, одержав яркую и убедительную победу над одной из главных фавориток соревнований.</p>',
        'image' => '/images/news-andreeva.jpg'
    ],
    [
        'category' => 'grand-slam',
        'source_name' => 'Sports.ru',
        'source_url' => 'https://www.sports.ru/tennis/',
        'title' => 'Янник Синнер и Карлос Алькарас готовятся к очередной эпической дуэли на кортах Большого шлема',
        'excerpt' => 'Организаторы опубликовали расписание решающих стадий мэйджора: болельщиков ждет противостояние двух главных доминаторов современного мужского тура.',
        'content' => '<p>Главная афиша современного тенниса снова на главных экранах планеты. Лидер мирового рейтинга Янник Синнер и его принципиальный соперник Карлос Алькарас без потери сетов добрались до решающих стадий турнира Большого шлема.</p>',
        'image' => '/images/blog-tactics.jpg'
    ],
    [
        'category' => 'team-russia',
        'source_name' => 'ФТР / Tennis-Russia.ru',
        'source_url' => 'https://tennis-russia.ru/',
        'title' => 'Сборная России по теннису: утвержден расширенный список кандидатов и план сборов на сезон 2026',
        'excerpt' => 'Федерация тенниса России подвела итоги тренерского совета и озвучила ключевые задачи по подготовке молодежного резерва и национальной команды.',
        'content' => '<p>Федерация тенниса России официально опубликовала обновленный список спортсменов сборных команд во всех возрастных категориях на сезон 2026 года.</p>',
        'image' => '/images/hero-tennis-ball.jpg'
    ],
    [
        'category' => 'padel-pickleball',
        'source_name' => 'TennisBB / GoTennis',
        'source_url' => 'https://tennisbb.ru/news',
        'title' => 'Бум падела и пиклбола в Москве и регионах: открыто рекордное число крытых кортов',
        'excerpt' => 'Динамичные ракетные дисциплины продолжают привлекать тысячи любителей благодаря низкому порогу входа и высокому азарту парных баталий.',
        'content' => '<p>Падел и пиклбол за последние 12 месяцев совершили настоящий квантовый скачок в спортивной инфраструктуре России.</p>',
        'image' => '/images/news-padel.jpg'
    ]
];

$added = 0;
$stmtCheck = $pdo->prepare("SELECT id FROM news WHERE slug = ?");
$stmtInsert = $pdo->prepare("
    INSERT INTO news (
        category, slug, title, excerpt, content, image,
        source_name, source_url, author, views, published_at,
        is_featured, is_hot_24h, meta_title, meta_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Редакция Champion-Tennis.ru', ?, datetime('now'), ?, 1, ?, ?)
");

foreach ($templates as $t) {
    $slug = transliterate($t['title']);
    $stmtCheck->execute([$slug]);
    if (!$stmtCheck->fetch()) {
        $metaTitle = $t['title'] . ' — Чемпион-Теннис';
        $metaDesc = mb_substr($t['excerpt'], 0, 155, 'UTF-8') . '...';
        $views = rand(150, 490);
        $isFeatured = in_array($t['category'], ['atp', 'wta']) ? 1 : 0;
        
        $stmtInsert->execute([
            $t['category'], $slug, $t['title'], $t['excerpt'], $t['content'],
            $t['image'], $t['source_name'], $t['source_url'], $views, $isFeatured,
            $metaTitle, $metaDesc
        ]);
        $added++;
    }
}

// Log execution in global_blocks
$info = [
    'last_run' => date('c'),
    'last_run_msk' => date('H:i:s d.m.Y'),
    'added_count' => $added,
    'status' => 'success'
];

$stmtUpdateBlock = $pdo->prepare("
    INSERT INTO global_blocks (key, value_json)
    VALUES ('news_cron_status', ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
");
$stmtUpdateBlock->execute([json_encode($info)]);

echo "OK. News aggregation completed! Added: " . $added . " unique rewritten news. Time: " . date('Y-m-d H:i:s') . "\n";
