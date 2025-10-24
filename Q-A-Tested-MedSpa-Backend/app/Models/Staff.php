<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable; // ✅ add this

class Staff extends Model
{
    use HasFactory, Notifiable; // ✅ include Notifiable here

    protected $fillable = ['user_id', 'location_id', 'position'];

    // Staff belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Staff belongs to a location
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function locations()
    {
        return $this->belongsToMany(Location::class, 'location_staff');
    }
}
