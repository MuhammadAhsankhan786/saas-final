<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'sku', 'price', 'current_stock', 'minimum_stock', 'unit', 'active',
        'category', 'expiry_date', 'lot_number', 'low_stock_threshold', 'location_id'
    ];

    public function stockAdjustments()
    {
        return $this->hasMany(StockAdjustment::class);
    }

    public function stockNotifications()
    {
        return $this->hasMany(StockNotification::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
