<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Models\ComplianceAlert;
use App\Http\Controllers\DatabaseSeederController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

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
                // Auto-seed baseline data if tables are empty
                $clientCount = Client::count();
                $appointmentCount = Appointment::count();
                $paymentCount = Payment::count();
                $productCount = Product::count();
                $staffCount = User::whereIn('role', ['provider', 'reception', 'staff'])->count();
                $complianceCount = ComplianceAlert::count();
                
                if ($clientCount < 3 || $appointmentCount < 3 || $paymentCount < 2 || 
                    $productCount < 2 || $staffCount < 2 || $complianceCount < 1) {
                    DatabaseSeederController::seedMissingData(true);
                    Log::info('Admin dashboard: Auto-seeded baseline data');
                }
            }
            
            // Calculate statistics from real database data
            $today = now()->startOfDay();
            $tomorrow = $today->copy()->addDay();
            
            // Appointments stats
            $todaysAppointments = Appointment::whereDate('appointment_time', $today)->count();
            $upcomingAppointments = Appointment::where('appointment_time', '>=', $today)
                ->where('appointment_time', '<', $tomorrow)
                ->count();
            $totalAppointments = Appointment::count();
            $confirmedAppointments = Appointment::whereIn('status', ['confirmed', 'booked'])
                ->count();
            $completedAppointments = Appointment::where('status', 'completed')->count();
            
            // Clients stats
            $totalClients = Client::count();
            $activeClients = Client::where('status', 'active')->count();
            $newClientsThisMonth = Client::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count();
            
            // Revenue stats (from payments)
            $totalRevenue = Payment::where('status', 'completed')
                ->sum('amount');
            $monthlyRevenue = Payment::where('status', 'completed')
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->sum('amount');
            $pendingPayments = Payment::where('status', 'pending')->count();
            
            // Inventory stats
            $totalProducts = Product::count();
            // Use schema column name for minimum threshold (minimum_stock)
            $lowStockProducts = Product::whereColumn('current_stock', '<=', 'minimum_stock')->count();
            $outOfStockProducts = Product::where('current_stock', 0)->count();
            
            // Staff stats
            $totalStaff = User::whereIn('role', ['provider', 'reception', 'staff'])->count();
            $providers = User::where('role', 'provider')->count();
            $receptionStaff = User::where('role', 'reception')->count();
            
            // Compliance stats
            $totalComplianceAlerts = ComplianceAlert::count();
            $activeComplianceAlerts = ComplianceAlert::where('status', 'active')->count();
            $criticalComplianceAlerts = ComplianceAlert::where('priority', 'critical')
                ->where('status', 'active')
                ->count();
            
            return response()->json([
                'appointments' => [
                    'total' => $totalAppointments,
                    'today' => $todaysAppointments,
                    'upcoming' => $upcomingAppointments,
                    'confirmed' => $confirmedAppointments,
                    'completed' => $completedAppointments,
                ],
                'clients' => [
                    'total' => $totalClients,
                    'active' => $activeClients,
                    'new_this_month' => $newClientsThisMonth,
                ],
                'revenue' => [
                    'total' => round($totalRevenue, 2),
                    'monthly' => round($monthlyRevenue, 2),
                    'pending_payments' => $pendingPayments,
                ],
                'inventory' => [
                    'total_products' => $totalProducts,
                    'low_stock' => $lowStockProducts,
                    'out_of_stock' => $outOfStockProducts,
                ],
                'staff' => [
                    'total' => $totalStaff,
                    'providers' => $providers,
                    'reception' => $receptionStaff,
                ],
                'compliance' => [
                    'total_alerts' => $totalComplianceAlerts,
                    'active_alerts' => $activeComplianceAlerts,
                    'critical_alerts' => $criticalComplianceAlerts,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Admin dashboard stats error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'appointments' => ['total' => 0, 'today' => 0, 'upcoming' => 0, 'confirmed' => 0, 'completed' => 0],
                'clients' => ['total' => 0, 'active' => 0, 'new_this_month' => 0],
                'revenue' => ['total' => 0, 'monthly' => 0, 'pending_payments' => 0],
                'inventory' => ['total_products' => 0, 'low_stock' => 0, 'out_of_stock' => 0],
                'staff' => ['total' => 0, 'providers' => 0, 'reception' => 0],
                'compliance' => ['total_alerts' => 0, 'active_alerts' => 0, 'critical_alerts' => 0],
            ]);
        }
    }
}
