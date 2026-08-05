<?php

declare(strict_types=1);

define('CORE_ACCESS', true);
define('CORE_PATH', __DIR__);

/**
 * Load dependencies and initial configuration.
 */
require_once __DIR__ . '/init.php';
require_once __DIR__ . '/modules/Response.php';

// =====================================================
// 1. REQUEST PARSING
// =====================================================

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$uri    = rtrim(preg_replace('#^/api#', '', $uri), '/') ?: '/';
$parts  = array_values(array_filter(explode('/', $uri)));

foreach ($parts as $part) {
    if ($part === '..' || $part === '.') {
        Response::error('Bad Request', 400);
    }
}

// =====================================================
// 2. ENDPOINT RESOLUTION (ROUTING WITH SUBDIRECTORIES)
// =====================================================

$basePublic    = __DIR__ . '/../api/public/';
$baseProtected = __DIR__ . '/../api/protected/';

$endpointFile  = null;
$isProtected   = false;
$requestParams = [];

// Temporary variables for the lookup loop
$checkParts = $parts;
$params     = [];

/**
 * Dynamic routing logic: find the deepest matching endpoint file.
 * At each iteration, the last URL segment is peeled off and stored
 * as a route parameter until a matching file is found.
 */
while (count($checkParts) > 0) {
    $relativePath = implode('/', $checkParts) . '.php';

    // Check first whether this is a public route
    if (file_exists($basePublic . $relativePath)) {
        $endpointFile = $basePublic . $relativePath;
        $isProtected  = false;
        break;
    }

    // Then check whether this is a protected route
    if (file_exists($baseProtected . $relativePath)) {
        $endpointFile = $baseProtected . $relativePath;
        $isProtected  = true;
        break;
    }

    // No file matched: treat the last segment as a route parameter and try again
    array_unshift($params, array_pop($checkParts));
}

/**
 * IF THE ENDPOINT DOES NOT EXIST, RETURN AN HTML 404 PAGE.
 */
if (!$endpointFile) {
    http_response_code(404);
    header_remove('WWW-Authenticate');

    /**
     * In a Nibula build the backend lives at out/backend/, so the site root
     * (out/) is two levels up from _core. DOCUMENT_ROOT is preferred when it
     * resolves, but on shared hosting it often points elsewhere, so the
     * relative path is used as a fallback. Same resolution as index.js.
     */
    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    $errorPage    = $documentRoot . '/404.html';

    if (!file_exists($errorPage)) {
        $errorPage = __DIR__ . '/../../404.html';
    }

    header('Content-Type: text/html; charset=UTF-8');

    if (file_exists($errorPage)) {
        echo file_get_contents($errorPage);
    } else {
        echo "<h1>404 Not Found</h1>";
        echo "The requested URL was not found on this server.";
    }
    exit;
}

$base         = $isProtected ? $baseProtected : $basePublic;
$base         = str_replace('\\', '/', $base);
$endpointPath = str_replace('\\', '/', $endpointFile);
$endpointPath = preg_replace('#\.php$#', '', str_replace($base, '', $endpointPath));

// =====================================================
// 3. HEADERS AND CORS (Only if the endpoint exists)
// =====================================================

header('Content-Type: application/json; charset=UTF-8');
header_remove('WWW-Authenticate');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

$originsForEndpoint = $config['CUSTOM_ENDPOINT_ORIGINS'][$endpointPath]
    ?? $config['GENERAL_ALLOWED_ORIGINS']
    ?? [];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $originsForEndpoint, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} elseif (in_array('*', $originsForEndpoint, true)) {
    header('Access-Control-Allow-Origin: *');
}

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/modules/RateLimiter.php';
RateLimiter::check($_SERVER['REMOTE_ADDR'] ?? '', 60, 60);

// =====================================================
// 4. AUTHENTICATION GUARD
// =====================================================

if ($isProtected) {
    $validKey = $config['CUSTOM_ENDPOINT_KEYS'][$endpointPath] ?? $config['GENERAL_API_KEY'] ?? '';
    $apiKey   = $_SERVER['HTTP_X_API_KEY'] ?? '';

    if ($validKey === '' || !hash_equals($validKey, $apiKey)) {
        Response::error('Unauthorized. X_API_KEY is incorrect or missing', 403);
    }
}

// =====================================================
// 5. DISPATCH
// =====================================================

// Parameters are the remaining URL segments not consumed during endpoint resolution
$requestParams = $params;

// Load and execute the matched endpoint file
require $endpointFile;