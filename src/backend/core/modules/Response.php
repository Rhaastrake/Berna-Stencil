<?php

declare(strict_types=1);

if (!defined('CORE_ACCESS')) {
    $errorPage = $_SERVER['DOCUMENT_ROOT'] . '/404.html';
    http_response_code(404);
    if (file_exists($errorPage)) {
        header('Content-Type: text/html; charset=UTF-8');
        echo file_get_contents($errorPage);
    } else {
        echo "404 Not Found";
    }
    exit;
}

class Response
{
    public static function success(mixed $data = null, int $code = 200): never
    {
        http_response_code($code);
        echo json_encode([
            'status' => 'success',
            'data'   => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $code = 400, mixed $details = null): never
    {
        http_response_code($code);
        $body = [
            'status'  => 'error',
            'message' => $message,
            'code'    => $code,
        ];
        if ($details !== null) {
            $body['details'] = $details;
        }
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }
}