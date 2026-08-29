<?php

declare(strict_types=1);

class RateLimiter {
    public static function check(string $ip, int $maxRequests = 60, int $windowSeconds = 60): void {
        $cacheDir = __DIR__ . '/../../cache';
        
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }

        $cacheFile = $cacheDir . '/rl_' . md5($ip) . '.json';
        $now = time();
        $data = [];

        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true) ?: [];
        }

        $data = array_filter($data, fn($ts) => $ts > ($now - $windowSeconds));
        $data[] = $now;

        file_put_contents($cacheFile, json_encode(array_values($data)), LOCK_EX);

        if (count($data) > $maxRequests) {
            header('Retry-After: ' . $windowSeconds);
            Response::error('Too Many Requests', 429);
        }
    }
}