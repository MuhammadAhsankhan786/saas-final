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
            // Skip auto-seeding for performance - data should be seeded manually or via scheduled jobs
            // Auto-seeding on every dashboard load is too slow

            $now = now();
            $today = $now->copy()->startOfDay();
            $tomorrow = $today->copy()->addDay();
            $twelveMonthsAgo = $today->copy()->subMonths(11)->startOfMonth();

            // Optimized aggregate counts - use DB queries directly for better performance
            $todaysAppointments = Schema::hasTable('appointments')
                ? DB::table('appointments')
                    ->whereNotNull('start_time')
                    ->whereBetween('start_time', [$today, $tomorrow])
                    ->count()
                : 0;
            $upcomingAppointments = Schema::hasTable('appointments')
                ? DB::table('appointments')
                    ->whereNotNull('start_time')
                    ->where('start_time', '>=', $now)
                    ->count()
                : 0;

            $totalRevenue = Schema::hasTable('payments')
                ? (float) DB::table('payments')
                    ->where('status', 'completed')
                    ->sum('amount')
                : 0.0;
            $todayRevenue = Schema::hasTable('payments')
                ? (float) DB::table('payments')
                    ->where('status', 'completed')
                    ->whereNotNull('created_at')
                    ->whereBetween('created_at', [$today, $tomorrow])
                    ->sum('amount')
                : 0.0;

            $totalClients = Schema::hasTable('clients') 
                ? DB::table('clients')->count() 
                : 0;
            $newClientsToday = Schema::hasTable('clients')
                ? DB::table('clients')
                    ->whereBetween('created_at', [$today, $tomorrow])
                    ->count()
                : 0;

            $totalProviders = Schema::hasTable('users') 
                ? DB::table('users')->where('role', 'provider')->count() 
                : 0;
            $totalReception = Schema::hasTable('users') 
                ? DB::table('users')->where('role', 'reception')->count() 
                : 0;
            $totalLocations = Schema::hasTable('locations') 
                ? DB::table('locations')->count() 
                : 0;

            // Appointments by location (optimized with join)
            $appointmentsByLocation = (Schema::hasTable('appointments') && Schema::hasTable('locations'))
                ? DB::table('appointments')
                    ->join('locations', 'appointments.location_id', '=', 'locations.id')
                    ->select('locations.name as location', DB::raw('COUNT(*) as total'))
                    ->whereNotNull('appointments.location_id')
                    ->groupBy('locations.id', 'locations.name')
                    ->get()
                    ->map(function ($a) {
                        return [
                            'location' => $a->location ?? 'Unknown',
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

            // Calculate percentage changes (current month vs previous month)
            $currentMonthStart = $now->copy()->startOfMonth();
            $currentMonthEnd = $now->copy()->endOfMonth();
            $previousMonthStart = $now->copy()->subMonth()->startOfMonth();
            $previousMonthEnd = $now->copy()->subMonth()->endOfMonth();

            // Revenue change - optimized DB queries
            $currentMonthRevenue = Schema::hasTable('payments')
                ? (float) DB::table('payments')
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
                    ->sum('amount')
                : 0.0;
            $previousMonthRevenue = Schema::hasTable('payments')
                ? (float) DB::table('payments')
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
                    ->sum('amount')
                : 0.0;
            $revenueChange = $previousMonthRevenue > 0
                ? round((($currentMonthRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100, 1)
                : ($currentMonthRevenue > 0 ? 100 : 0);

            // Clients change - optimized DB queries
            $currentMonthClients = Schema::hasTable('clients')
                ? DB::table('clients')
                    ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
                    ->count()
                : 0;
            $previousMonthClients = Schema::hasTable('clients')
                ? DB::table('clients')
                    ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
                    ->count()
                : 0;
            $clientsChange = $previousMonthClients > 0
                ? round((($currentMonthClients - $previousMonthClients) / $previousMonthClients) * 100, 1)
                : ($currentMonthClients > 0 ? 100 : 0);

            // Appointments change (today vs yesterday) - optimized DB query
            $yesterday = $today->copy()->subDay();
            $yesterdayAppointments = Schema::hasTable('appointments')
                ? DB::table('appointments')
                    ->whereNotNull('start_time')
                    ->whereBetween('start_time', [$yesterday, $today])
                    ->count()
                : 0;
            $appointmentsChange = $yesterdayAppointments > 0
                ? round((($todaysAppointments - $yesterdayAppointments) / $yesterdayAppointments) * 100, 1)
                : ($todaysAppointments > 0 ? 100 : 0);

            // Top Services by Revenue and Sessions (real data from database)
            $topServices = [];
            if (Schema::hasTable('appointments') && Schema::hasTable('payments') && Schema::hasTable('services')) {
                // Get top services by revenue from payments linked to appointments with services
                $serviceRevenue = DB::table('payments')
                    ->join('appointments', 'payments.appointment_id', '=', 'appointments.id')
                    ->join('services', 'appointments.service_id', '=', 'services.id')
                    ->where('payments.status', 'completed')
                    ->where('appointments.created_at', '>=', $currentMonthStart)
                    ->select(
                        'services.name as service_name',
                        DB::raw('SUM(payments.amount) as revenue'),
                        DB::raw('COUNT(DISTINCT appointments.id) as sessions')
                    )
                    ->groupBy('services.id', 'services.name')
                    ->orderByDesc('revenue')
                    ->limit(3)
                    ->get();

                // If no service-based revenue, try package-based
                if ($serviceRevenue->isEmpty() && Schema::hasTable('packages')) {
                    $packageRevenue = DB::table('payments')
                        ->join('appointments', 'payments.appointment_id', '=', 'appointments.id')
                        ->join('packages', 'appointments.package_id', '=', 'packages.id')
                        ->where('payments.status', 'completed')
                        ->where('appointments.created_at', '>=', $currentMonthStart)
                        ->select(
                            'packages.name as service_name',
                            DB::raw('SUM(payments.amount) as revenue'),
                            DB::raw('COUNT(DISTINCT appointments.id) as sessions')
                        )
                        ->groupBy('packages.id', 'packages.name')
                        ->orderByDesc('revenue')
                        ->limit(3)
                        ->get();
                    
                    $topServices = $packageRevenue->map(function ($row) {
                        return [
                            'service' => $row->service_name ?? 'Unknown',
                            'revenue' => round((float) $row->revenue, 2),
                            'sessions' => (int) $row->sessions,
                        ];
                    })->toArray();
                } else {
                    $topServices = $serviceRevenue->map(function ($row) {
                        return [
                            'service' => $row->service_name ?? 'Unknown',
                            'revenue' => round((float) $row->revenue, 2),
                            'sessions' => (int) $row->sessions,
                        ];
                    })->toArray();
                }
            }

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
                'revenue_change' => $revenueChange,
                'clients_change' => $clientsChange,
                'appointments_change' => $appointmentsChange,
                'top_services' => $topServices,
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
                    'revenue_change' => 0,
                    'clients_change' => 0,
                    'appointments_change' => 0,
                    'top_services' => [],
                ],
                'message' => 'Defaulted due to error',
            ], 200);
        }
    }
}
