<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_payment()
    {
        $adminUser = User::factory()->admin()->create(); // ✅ factory role use
        $client = Client::factory()->create();

        $response = $this->actingAs($adminUser, 'api')->postJson('/api/admin/payments', [
            'client_id'      => $client->id,
            'amount'         => 100,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('payments', ['amount' => 100]);
    }
}
