<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Location;

class LocationFactory extends Factory
{
    protected $model = Location::class;

    public function definition()
    {
        return [
            'name'     => $this->faker->company(),
            'address'  => $this->faker->address(),
            'city'     => $this->faker->city(),
            'state'    => $this->faker->state(),
            'zip'      => $this->faker->postcode(),
            'timezone' => 'UTC',
        ];
    }
}
