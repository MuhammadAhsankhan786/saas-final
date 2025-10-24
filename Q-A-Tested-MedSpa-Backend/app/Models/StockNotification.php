<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockNotification extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'current_stock', 'is_read'];

    public function product() { return $this->belongsTo(Product::class); }
}
