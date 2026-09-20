<?php
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

$body = "Получена новая заявка с персонального сайта профориентолога orientirprof.ru:\n\n";
$body .= "Имя клиента: {$name}\n";
$body .= "Телефон: {$phone}\n";
$body .= "Услуга / Тип: {$service}\n";
if (!empty($audience)) {
    $body .= "Категория: {$audience}\n";
}
if (!empty($testSummary)) {
    $body .= "Результат онлайн-теста:\n{$testSummary}\n";
}
if (!empty($message)) {
    $body .= "Сообщение / вопрос:\n{$message}\n";
}
$body .= "\nДата и время: " . date('d.m.Y H:i') . "\n";
$body .= "IP-адрес: " . $_SERVER['REMOTE_ADDR'] . "\n";

$headers = "From: noreply@orientirprof.ru\r\n" .
           "Reply-To: noreply@orientirprof.ru\r\n" .
           "X-Mailer: PHP/" . phpversion() . "\r\n" .
           "Content-Type: text/plain; charset=utf-8\r\n";

@mail($toEmail, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);

echo json_encode([
    'success' => true,
    'message' => 'Спасибо! Ваша заявка успешно отправлена. Марина Бондарева свяжется с вами в ближайшее время.'
], JSON_UNESCAPED_UNICODE);
