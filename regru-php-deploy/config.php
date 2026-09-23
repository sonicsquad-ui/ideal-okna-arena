<?php
/**
 * Champion-Tennis.ru — Конфигурация для хостинга REG.RU
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Настройки базы данных SQLite
$dbPath = __DIR__ . '/data/champion_tennis.db';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Регистрируем функцию нечувствительного к регистру поиска по-русски
    $pdo->sqliteCreateFunction('ru_like', function($haystack, $needle) {
        if (!$haystack || !$needle) return 0;
        return (mb_stripos($haystack, $needle, 0, 'UTF-8') !== false) ? 1 : 0;
    }, 2);
} catch (PDOException $e) {
    die("Ошибка подключения к базе данных. Проверьте права на чтение/запись папки data/: " . htmlspecialchars($e->getMessage()));
}

// Почта для уведомлений о заявках (строго скрыта от публичной части сайта)
define('TARGET_EMAIL', 'sonicsquad@mail.ru');

// Отправка email через стандартную функцию mail() хостинга REG.RU
function sendAdminNotification($subject, $body) {
    $to = TARGET_EMAIL;
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    $headers .= "From: no-reply@champion-tennis.ru\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    @mail($to, $subject, $body, $headers);
}

// Транслитерация для SEO URL
function transliterate($str) {
    $ruMap = [
        'а'=>'a', 'б'=>'b', 'в'=>'v', 'г'=>'g', 'д'=>'d', 'е'=>'e', 'ё'=>'yo',
        'ж'=>'zh', 'з'=>'z', 'и'=>'i', 'й'=>'y', 'к'=>'k', 'л'=>'l', 'м'=>'m',
        'н'=>'n', 'о'=>'o', 'п'=>'p', 'р'=>'r', 'с'=>'s', 'т'=>'t', 'у'=>'u',
        'ф'=>'f', 'х'=>'kh', 'ц'=>'ts', 'ч'=>'ch', 'ш'=>'sh', 'щ'=>'shch',
        'ъ'=>'', 'ы'=>'y', 'ь'=>'', 'э'=>'e', 'ю'=>'yu', 'я'=>'ya'
    ];
    $str = mb_strtolower(trim($str), 'UTF-8');
    $res = '';
    for ($i = 0; $i < mb_strlen($str, 'UTF-8'); $i++) {
        $c = mb_substr($str, $i, 1, 'UTF-8');
        if (isset($ruMap[$c])) {
            $res .= $ruMap[$c];
        } elseif (preg_match('/[a-z0-9]/', $c)) {
            $res .= $c;
        } elseif (preg_match('/[\s\-_]/', $c)) {
            $res .= '-';
        }
    }
    $res = preg_replace('/-+/', '-', $res);
    return trim($res, '-');
}

// Точный формат даты и времени по ТЗ: ДД.ММ.ГГГГ ЧЧ:ММ
function formatNewsDate($dateStr) {
    if (!$dateStr) return date('d.m.Y H:i');
    $timestamp = strtotime($dateStr);
    if (!$timestamp) return $dateStr;
    return date('d.m.Y H:i', $timestamp);
}

function formatDateRu($dateStr) {
    return formatNewsDate($dateStr);
}

function getGlobalSettings($pdo) {
    $settings = [];
    $stmt = $pdo->query("SELECT key, value_json FROM global_blocks");
    while ($row = $stmt->fetch()) {
        $settings[$row['key']] = json_decode($row['value_json'], true);
    }
    return $settings;
}
