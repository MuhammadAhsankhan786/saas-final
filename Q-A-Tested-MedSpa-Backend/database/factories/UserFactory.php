<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'), // default test password
            'role' => 'client', // default role
            'remember_token' => Str::random(10),
        ];
    }

    // 🔹 Admin state
    public function admin()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }

    // 🔹 Provider state
    public function provider()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'provider',
        ]);
    }

    // 🔹 Reception state
    public function reception()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'reception',
        ]);
    }

    // 🔹 Client state
    public function client()
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'client',
        ]);
    }
}
