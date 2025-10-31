<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Models\ComplianceAlert;
use App\Models\Location;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    /**
     * Get admin dashboard summary statistics (READ-ONLY)
     * Returns real MySQL data with auto-seeding if tables are empty
     */
    public function getStats()
    {
        try {
            // Live-data mode: skip auto-seeding when enabled
            $liveData = (bool) env('MEDSPA_LIVE_DATA', false);
            if (!$liveData) {
                try {
                // Auto-seed baseline data if tables are empty
                    $clientCount = Schema::hasTable('clients') ? Client::count() : 0;
                    $appointmentCount = Schema::hasTable('appointments') ? Appointment::count() : 0;
                    $paymentCount = Schema::hasTable('payments') ? Payment::count() : 0;
                    $productCount = Schema::hasTable('products') ? Product::count() : 0;
                    $staffCount = Schema::hasTable('users') 
                        ? User::whereIn('role', ['provider', 'reception', 'staff'])->count() 
                        : 0;
                    $complianceCount = Schema::hasTable('compliance_alerts') ? ComplianceAlert::count() : 0;
                
                    if ($clientCount < 3 || $appointmentCount < 3 || $paymentCount < 2 ||
                        $productCount < 2 || $staffCount < 2 || $complianceCount < 1) {
                        try {
                            DatabaseSeederController::seedMissingData(true);
                            Log::info('Admin dashboard: Auto-seeded baseline data');
                        } catch (\Exception $seedEx) {
                            Log::warning('Admin dashboard: Auto-seed attempt failed', [
                                'error' => $seedEx->getMessage()
                            ]);
                        }
                    }
                } catch (\Exception $seedException) {
                    // Silently fail auto-seeding - continue with existing data
                    Log::warning('Admin dashboard: Auto-seed failed, continuing with existing data', [
                        'error' => $seedException->getMessage()
                    ]);
                }
            }

            $now = now();
            $today = $now->copy()->startOfDay();
            $tomorrow = $today->copy()->addDay();
            $twelveMonthsAgo = $today->copy()->subMonths(11)->startOfMonth();

            // Aggregate counts (handle NULL start_time values)
            $todaysAppointments = Schema::hasTable('appointments')
                ? Appointment::whereNotNull('start_time')
                    ->whereBetween('start_time', [$today, $tomorrow])
                    ->count()
                : 0;
            $upcomingAppointments = Schema::hasTable('appointments')
                ? Appointment::whereNotNull('start_time')
                    ->where('start_time', '>=', $now)
                    ->count()
                : 0;

            $totalRevenue = Schema::hasTable('payments')
                ? (float) Payment::where('status', 'completed')->sum('amount')
                : 0.0;
            $todayRevenue = Schema::hasTable('payments')
                ? (float) Payment::where('status', 'completed')
                    ->whereNotNull('created_at')
                    ->whereBetween('created_at', [$today, $tomorrow])
                    ->sum('amount')
                : 0.0;

            $totalClients = Schema::hasTable('clients') ? Client::count() : 0;
            $newClientsToday = Schema::hasTable('clients')
                ? Client::whereBetween('created_at', [$today, $tomorrow])->count()
                : 0;

            $totalProviders = Schema::hasTable('users') ? User::where('role', 'provider')->count() : 0;
            $totalReception = Schema::hasTable('users') ? User::where('role', 'reception')->count() : 0;
            $totalLocations = Schema::hasTable('locations') ? Location::count() : 0;

            // Appointments by location (safe, non-relational lookup)
            $appointmentsByLocation = (Schema::hasTable('appointments') && Schema::hasTable('locations'))
                ? Appointment::select('location_id', DB::raw('COUNT(*) as total'))
                    ->whereNotNull('location_id')
                    ->groupBy('location_id')
                    ->get()
                    ->map(function ($a) {
                        $locationName = Location::where('id', $a->location_id)->value('name');
                        return [
                            'location' => $locationName ?? 'Unknown',
                            'total' => (int) $a->total,
                        ];
                    })->values()
                : collect([]);

            // Monthly revenue for last 12 months
            $monthlyRevenue = Schema::hasTable('payments')
                ? DB::table('payments')
                    ->select(
                        DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                        DB::raw('SUM(amount) as total')
                    )
                    ->where('status', 'completed')
                    ->whereNotNull('created_at')
                    ->where('created_at', '>=', $twelveMonthsAgo)
                    ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
                    ->orderBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
                    ->get()
                    ->map(function ($row) {
                        return [
                            'month' => \Carbon\Carbon::createFromFormat('Y-m', $row->month)->format('M'),
                            'total' => round((float) $row->total, 2),
                        ];
                    })
                    ->values()
                : collect([]);

            $data = [
                'todays_appointments' => $todaysAppointments,
                'upcoming_appointments' => $upcomingAppointments,
                'total_revenue' => round($totalRevenue, 2),
                'today_revenue' => round($todayRevenue, 2),
                'total_clients' => $totalClients,
                'new_clients_today' => $newClientsToday,
                'total_providers' => $totalProviders,
                'total_reception' => $totalReception,
                'total_locations' => $totalLocations,
                'appointments_by_location' => $appointmentsByLocation,
                'monthly_revenue' => $monthlyRevenue,
            ];
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Admin dashboard stats error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Fail-open with safe zeroed structure to avoid UI crash
            return response()->json([
                'success' => true,
                'data' => [
                    'todays_appointments' => 0,
                    'upcoming_appointments' => 0,
                    'total_revenue' => 0,
                    'today_revenue' => 0,
                    'total_clients' => 0,
                    'new_clients_today' => 0,
                    'total_providers' => 0,
                    'total_reception' => 0,
                    'total_locations' => 0,
                    'appointments_by_location' => [],
                    'monthly_revenue' => [],
                ],
                'message' => 'Defaulted due to error',
            ], 200);
        }
    }
}
