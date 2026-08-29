<?php
declare(strict_types=1);

require_once CORE_PATH . '/modules/Response.php';

if ($method !== 'GET') {
    Response::error('Method not allowed', 405);
}

//
// Your endpoint logic here. You can access route parameters in $requestParams array
//

Response::success([
    'message'    => 'Protected endpoint is working',
    'params'     => $requestParams,
]);