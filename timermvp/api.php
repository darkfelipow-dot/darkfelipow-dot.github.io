<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'data/mvps.json';

// Ensure data file exists
if (!file_exists($dataFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Data file not found']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = file_get_contents($dataFile);
    echo $data;
} elseif ($method === 'POST') {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Check if it's a batch update
    if (isset($input['batch']) && is_array($input['batch'])) {
        $currentData = json_decode(file_get_contents($dataFile), true);
        $updatedCount = 0;

        foreach ($input['batch'] as $item) {
            if (isset($item['id']) && array_key_exists('last_killed', $item)) {
                foreach ($currentData as &$mvp) {
                    if ($mvp['id'] == $item['id']) {
                        $mvp['last_killed'] = $item['last_killed'];
                        $updatedCount++;
                        break;
                    }
                }
            }
        }

        if ($updatedCount > 0) {
            if (file_put_contents($dataFile, json_encode($currentData, JSON_PRETTY_PRINT))) {
                echo json_encode(['success' => true, 'updated' => $updatedCount]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to save data']);
            }
        } else {
            echo json_encode(['success' => true, 'updated' => 0, 'message' => 'No changes made']);
        }
        exit;
    }

    // Single update
    if (!isset($input['id']) || !isset($input['last_killed'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id or last_killed']);
        exit;
    }

    $currentData = json_decode(file_get_contents($dataFile), true);
    $updated = false;

    foreach ($currentData as &$mvp) {
        if ($mvp['id'] == $input['id']) {
            $mvp['last_killed'] = $input['last_killed'];
            $updated = true;
            break;
        }
    }

    if ($updated) {
        if (file_put_contents($dataFile, json_encode($currentData, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save data']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'MVP not found']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>