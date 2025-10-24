<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Location;

class ClientFactory extends Factory
{
    protected $model = \App\Models\Client::class;

    public function definition()
    {
        return [
            'user_id'       => User::factory(),       // har client ka linked user
            'location_id'   => Location::factory(),   // valid location create karega
            'date_of_birth' => $this->faker->date(),
            'phone'         => $this->faker->phoneNumber(),
            'medical_history' => $this->faker->sentence(),
            'name'          => $this->faker->name(),
            'email'         => $this->faker->unique()->safeEmail(),
        ];
    }
}
