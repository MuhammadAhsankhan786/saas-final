<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

$database = env('DB_DATABASE', 'medspa_db');

function pickEnumValue(string $colType): string {
    if (preg_match("/enum\\((.*)\\)/i", $colType, $m)) {
        $raw = $m[1];
        $vals = array_map(function ($v) { return trim($v, "'\" "); }, explode(',', $raw));
        return $vals[0] ?? 'default';
    }
    return 'default';
}

function fakeValue(object $col) {
    $name = $col->COLUMN_NAME;
    $type = strtolower($col->DATA_TYPE);
    $full = strtolower($col->COLUMN_TYPE);
    $now = Carbon::now();

    if ($name === 'email') return 'user+'.uniqid().'@live.local';
    if (str_contains($name, 'phone')) return '555-'.rand(1000,9999);
    if (str_contains($name, 'name')) return ucfirst($name).' '.rand(100,999);
    if ($type === 'enum') return pickEnumValue($full);
    if (in_array($type, ['int','bigint','mediumint','smallint','tinyint'])) return rand(1, 100);
    if (in_array($type, ['decimal','double','float'])) return rand(10, 500) + (rand(0,99)/100);
    if (in_array($type, ['datetime','timestamp'])) return $now->subMinutes(rand(0, 1000))->toDateTimeString();
    if ($type === 'date') return $now->subDays(rand(0, 1000))->toDateString();
    if ($type === 'time') return $now->toTimeString();
    if (in_array($type, ['json','text','longtext','mediumtext'])) return json_encode(['note' => 'live seed', 'k'=>rand(1,9)]);
    if (in_array($type, ['varchar','char'])) return substr('live_'.uniqid(), 0, (int)$col->CHARACTER_MAXIMUM_LENGTH ?: 191);
    if ($type === 'boolean') return 1;
    return 'live';
}

// FK map
$fks = DB::table('information_schema.KEY_COLUMN_USAGE')
    ->select('TABLE_NAME','COLUMN_NAME','REFERENCED_TABLE_NAME','REFERENCED_COLUMN_NAME')
    ->where('TABLE_SCHEMA', $database)
    ->whereNotNull('REFERENCED_TABLE_NAME')
    ->get()
    ->groupBy('TABLE_NAME');

$tables = DB::table('information_schema.tables')
    ->select('TABLE_NAME')
    ->where('TABLE_SCHEMA', $database)
    ->where('TABLE_TYPE', 'BASE TABLE')
    ->pluck('TABLE_NAME')
    ->toArray();

$filled = [];
$skipped = [];

foreach ($tables as $table) {
    // Skip migrations and system tables
    if (in_array($table, ['migrations', 'password_resets', 'failed_jobs'])) { $skipped[$table] = 'system'; continue; }

    try {
        $count = DB::table($table)->count();
    } catch (Throwable $e) {
        $skipped[$table] = 'inaccessible';
        continue;
    }
    if ($count > 0) { $skipped[$table] = 'has_data'; continue; }

    // Read columns
    $cols = DB::table('information_schema.columns')
        ->where('TABLE_SCHEMA', $database)
        ->where('TABLE_NAME', $table)
        ->orderBy('ORDINAL_POSITION')
        ->get();

    $rows = [];
    for ($i=0; $i<5; $i++) {
        $row = [];
        foreach ($cols as $col) {
            $colName = $col->COLUMN_NAME;
            if ($col->EXTRA === 'auto_increment') continue;
            if (in_array($colName, ['created_at','updated_at'])) continue; // allow defaults

            // FK handling
            $tableFks = $fks[$table] ?? collect();
            $fk = $tableFks->firstWhere('COLUMN_NAME', $colName);
            if ($fk) {
                $refTable = $fk->REFERENCED_TABLE_NAME;
                $refCol = $fk->REFERENCED_COLUMN_NAME;
                try {
                    $refId = DB::table($refTable)->inRandomOrder()->value($refCol);
                } catch (Throwable $e) {
                    $refId = null;
                }
                if (!$refId) { // cannot satisfy FK → skip this table for now
                    $row = null; break;
                }
                $row[$colName] = $refId;
                continue;
            }

            // Required column with no default
            $isNullable = ($col->IS_NULLABLE === 'YES');
            $hasDefault = ($col->COLUMN_DEFAULT !== null);
            if (!$isNullable && !$hasDefault) {
                $row[$colName] = fakeValue($col);
            } else {
                // Optional: provide realistic where possible
                if (in_array(strtolower($col->DATA_TYPE), ['varchar','text']) && rand(0,1)) {
                    $row[$colName] = fakeValue($col);
                }
            }
        }
        if ($row === null) { $rows = []; break; }
        // timestamps if present
        if (Schema::hasColumn($table, 'created_at')) $row['created_at'] = Carbon::now();
        if (Schema::hasColumn($table, 'updated_at')) $row['updated_at'] = Carbon::now();
        $rows[] = $row;
    }

    if (empty($rows)) { $skipped[$table] = 'fk_blocked_or_no_required'; continue; }

    try {
        foreach ($rows as $r) { DB::table($table)->insert($r); }
        $filled[] = $table;
    } catch (Throwable $e) {
        $skipped[$table] = 'insert_error: '.$e->getMessage();
    }
}

echo json_encode(['filled' => $filled, 'skipped' => $skipped], JSON_PRETTY_PRINT) . PHP_EOL;


