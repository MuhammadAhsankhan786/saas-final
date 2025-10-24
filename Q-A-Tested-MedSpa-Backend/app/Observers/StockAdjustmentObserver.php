<?php

namespace App\Observers;

use App\Models\StockAdjustment;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class StockAdjustmentObserver
{
    public function created(StockAdjustment $adjustment)
    {
        AuditLog::create([
            'user_id'    => Auth::id() ?? 1, // 👈 default admin for testing
            'action'     => 'created',
            'table_name' => 'stock_adjustments',
            'record_id'  => $adjustment->id,
            'old_data'   => null,
            'new_data'   => json_encode($adjustment->getAttributes()),
        ]);
    }

    public function updated(StockAdjustment $adjustment)
    {
        $changes = $adjustment->getChanges();

        AuditLog::create([
            'user_id'    => Auth::id() ?? 1,
            'action'     => 'updated',
            'table_name' => 'stock_adjustments',
            'record_id'  => $adjustment->id,
            'old_data'   => json_encode($adjustment->getOriginal()),
            'new_data'   => json_encode($changes),
        ]);
    }

    public function deleted(StockAdjustment $adjustment)
    {
        AuditLog::create([
            'user_id'    => Auth::id() ?? 1,
            'action'     => 'deleted',
            'table_name' => 'stock_adjustments',
            'record_id'  => $adjustment->id,
            'old_data'   => json_encode($adjustment->getAttributes()),
            'new_data'   => null,
        ]);
    }
}
