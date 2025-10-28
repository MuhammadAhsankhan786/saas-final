<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'priority',
        'status',
        'affected_items',
        'due_date',
        'created_at',
        'assigned_to',
        'category',
    ];

    protected $casts = [
        'due_date' => 'date',
        'affected_items' => 'integer',
        'created_at' => 'datetime',
    ];

    // Priority scopes
    public function scopeCritical($query)
    {
        return $query->where('priority', 'critical');
    }

    public function scopeHighPriority($query)
    {
        return $query->where('priority', 'high');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->where('status', 'active');
    }
}

