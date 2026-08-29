<?php
declare(strict_types=1);

/**
 * Mirror of src/backend/example.config.php
 *
 * Copy this file to config.php and fill in real values. config.php is git-ignored and stays local.
 */

return [
    // Default key for protected endpoints that don't have a specific key in CUSTOM_ENDPOINT_KEYS
    'GENERAL_API_KEY' => 'DEFAULT_KEY',

    // If you want to restrict access to protected endpoints to specific clients, define custom keys per endpoint.
    // For subfolder endpoints, use the relative path ('subfolder/endpoint')
    'CUSTOM_ENDPOINT_KEYS' => [
        'subfolder/example-protected' => 'custom-key',
    ],

    'GENERAL_ALLOWED_ORIGINS' => [
        '*',
        // 'https://example.com',
    ],

    'CUSTOM_ENDPOINT_ORIGINS' => [
        'subfolder/example-protected' => ['https://app.example.com'],
    ],

    // Database configuration
    'DB_HOST' => '127.0.0.1',
    'DB_NAME' => 'example_db',
    'DB_USER' => 'root',
    'DB_PASS' => '',

    // Environment: 'production' hides error details; anything else = debug.
    'APP_ENV' => 'production',
];