<?php

// Check and fix appointments table structure
require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Checking appointments table structure...\n";

try {
    // Check if appointments table exists
    if (!Schema::hasTable('appointments')) {
        echo "❌ Appointments table does not exist!\n";
        exit(1);
    }

    // Get current columns
    $columns = Schema::getColumnListing('appointments');
    echo "📋 Current columns: " . implode(', ', $columns) . "\n";

    // Check for required columns
    $requiredColumns = ['id', 'client_id', 'provider_id', 'location_id', 'service_id', 'package_id', 'status', 'start_time', 'end_time', 'notes', 'created_at', 'updated_at'];
    
    $missingColumns = [];
    $extraColumns = [];
    
    foreach ($requiredColumns as $column) {
        if (!in_array($column, $columns)) {
            $missingColumns[] = $column;
        }
    }
    
    foreach ($columns as $column) {
        if (!in_array($column, $requiredColumns)) {
            $extraColumns[] = $column;
        }
    }

    if (empty($missingColumns) && empty($extraColumns)) {
        echo "✅ Table structure is perfect! All required columns present.\n";
    } else {
        if (!empty($missingColumns)) {
            echo "❌ Missing columns: " . implode(', ', $missingColumns) . "\n";
        }
        if (!empty($extraColumns)) {
            echo "⚠️  Extra columns: " . implode(', ', $extraColumns) . "\n";
        }
    }

    // Check if provider_id exists
    if (in_array('provider_id', $columns)) {
        echo "✅ provider_id column exists\n";
    } else {
        echo "❌ provider_id column missing - this needs to be added\n";
    }

    // Check if staff_id exists (should be removed)
    if (in_array('staff_id', $columns)) {
        echo "⚠️  staff_id column exists - should be removed\n";
    } else {
        echo "✅ staff_id column not present (good)\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

