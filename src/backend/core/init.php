<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/modules/Response.php';

set_exception_handler(function ($exception) use (&$config) {
    $isDebug = ($config['APP_ENV'] ?? 'production') !== 'production';
    Response::error(
        $isDebug ? $exception->getMessage() : 'Internal server error',
        500,
        $isDebug ? ['file' => $exception->getFile(), 'line' => $exception->getLine()] : null
    );
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

$config = require dirname(__DIR__) . '/config.php';

if (($config['APP_ENV'] ?? 'production') === 'production') {
    ini_set('display_errors', '0');
    error_reporting(0);
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}