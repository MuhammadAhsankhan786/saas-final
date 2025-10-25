<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'product_name',
        'sku',
        'category',
        'supplier',
        'current_stock',
        'min_stock',
        'max_stock',
        'unit',
        'alert_type',
        'priority',
        'days_until_out',
        'last_restocked',
        'expiry_date',
        'cost',
        'selling_price',
        'status',
        'notes',
    ];

    protected $casts = [
        'last_restocked' => 'date',
        'expiry_date' => 'date',
        'cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
    ];

    // Relationship with Product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Scope for active alerts
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Scope for critical alerts
    public function scopeCritical($query)
    {
        return $query->where('priority', 'critical');
    }

    // Scope for high priority alerts
    public function scopeHighPriority($query)
    {
        return $query->where('priority', 'high');
    }

    // Scope for out of stock alerts
    public function scopeOutOfStock($query)
    {
        return $query->where('alert_type', 'out-of-stock');
    }
}