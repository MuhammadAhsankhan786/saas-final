<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'package_id', 'assigned_at'
    ];

    // Relations
    public function client() {
        return $this->belongsTo(Client::class);
    }

    public function package() {
        return $this->belongsTo(Package::class);
    }
}
