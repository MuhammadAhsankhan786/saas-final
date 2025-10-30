<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

class VerifyJwtCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verify:jwt';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify JWT configuration and API readiness (env keys, guard, routes, /api/me test)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Verifying JWT configuration...');

        $env = [
            'JWT_SECRET' => env('JWT_SECRET'),
            'JWT_ALGO' => env('JWT_ALGO'),
            'JWT_TTL' => env('JWT_TTL'),
            'JWT_REFRESH_TTL' => env('JWT_REFRESH_TTL'),
        ];

        $allOk = true;

        foreach ($env as $key => $value) {
            if (empty($value)) {
                $this->error("❌ Missing $key in .env");
                $allOk = false;
            } else {
                $this->info("✅ $key = $value");
            }
        }

        // Check guard
        $guard = Config::get('auth.guards.api.driver');
        if ($guard === 'jwt') {
            $this->info("✅ Guard 'api' uses driver 'jwt'");
        } else {
            $this->error("❌ Guard 'api' driver is '$guard', should be 'jwt'");
            $allOk = false;
        }

        // Test /api/me if running
        try {
            $response = Http::withoutVerifying()
                ->get('http://127.0.0.1:8000/api/me');

            if ($response->status() === 200) {
                $this->info("✅ /api/me reachable (200 OK)");
            } else {
                $this->warn("⚠️ /api/me responded with " . $response->status() . " - likely needs auth token");
            }
        } catch (\Exception $e) {
            $this->warn("⚠️ Could not reach /api/me: " . $e->getMessage());
        }

        if ($allOk) {
            $this->info("\n🎉 JWT verification successful. Backend ready for tokens.");
        } else {
            $this->error("\n❌ JWT configuration incomplete. Fix above issues and rerun this command.");
        }

        return Command::SUCCESS;
    }
}
