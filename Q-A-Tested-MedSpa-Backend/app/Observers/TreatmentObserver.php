<?php

namespace App\Observers;

use App\Models\Treatment;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class TreatmentObserver
{
    public function created(Treatment $treatment)
    {
        $userId = Auth::id() ?? 1; // default 1 agar Tinker me null ho

        AuditLog::create([
            'user_id'    => $userId,
            'action'     => 'created',
            'table_name' => 'treatments',
            'record_id'  => $treatment->id,
            'old_data'   => null,
            'new_data'   => json_encode($treatment->toArray()),
        ]);
    }

    public function updated(Treatment $treatment)
    {
        $userId = Auth::id() ?? 1;

        AuditLog::create([
            'user_id'    => $userId,
            'action'     => 'updated',
            'table_name' => 'treatments',
            'record_id'  => $treatment->id,
            'old_data'   => json_encode($treatment->getOriginal()),
            'new_data'   => json_encode($treatment->toArray()),
        ]);
    }

    public function deleted(Treatment $treatment)
    {
        $userId = Auth::id() ?? 1;

        AuditLog::create([
            'user_id'    => $userId,
            'action'     => 'deleted',
            'table_name' => 'treatments',
            'record_id'  => $treatment->id,
            'old_data'   => json_encode($treatment->toArray()),
            'new_data'   => null,
        ]);
    }
}
