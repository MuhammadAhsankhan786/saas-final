<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\Treatment;
use App\Models\ConsentForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ProviderDashboardController extends Controller
{
    /**
     * Get provider dashboard summary statistics
     * Returns only data for the logged-in provider
     */
    public function getStats()
    {
        try {
            $provider = Auth::user();
            
            if (!$provider || $provider->role !== 'provider') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Provider access only.'
                ], 403);
            }

            $providerId = $provider->id;
            $now = now();
            $today = $now->copy()->startOfDay();
            $tomorrow = $today->copy()->addDay();
            $thisMonth = $today->copy()->startOfMonth();
            $lastMonth = $thisMonth->copy()->subMonth();

            // Today's appointments
            $todaysAppointments = Appointment::where('provider_id', $providerId)
                ->whereBetween('start_time', [$today, $tomorrow])
                ->count();

            // Upcoming appointments (future)
            $upcomingAppointments = Appointment::where('provider_id', $providerId)
                ->where('start_time', '>=', $now)
                ->count();

            // Total clients (unique clients from appointments) - Optimized query
            $totalClients = DB::table('appointments')
                ->where('provider_id', $providerId)
                ->whereNotNull('client_id')
                ->distinct('client_id')
                ->count('client_id');

            // This month's appointments
            $thisMonthAppointments = Appointment::where('provider_id', $providerId)
                ->whereBetween('start_time', [$thisMonth, $now])
                ->count();

            // Last month's appointments
            $lastMonthAppointments = Appointment::where('provider_id', $providerId)
                ->whereBetween('start_time', [$lastMonth, $thisMonth])
                ->count();

            // Appointments change percentage
            $appointmentsChange = 0;
            if ($lastMonthAppointments > 0) {
                $appointmentsChange = round((($thisMonthAppointments - $lastMonthAppointments) / $lastMonthAppointments) * 100, 1);
            } elseif ($thisMonthAppointments > 0) {
                $appointmentsChange = 100;
            }

            // Total treatments
            $totalTreatments = Treatment::where('provider_id', $providerId)->count();

            // Completed treatments
            $completedTreatments = Treatment::where('provider_id', $providerId)
                ->where('status', 'completed')
                ->count();

            // Pending consents - Optimized: Use subquery instead of pluck + whereIn
            $pendingConsents = 0;
            try {
                $pendingConsents = ConsentForm::whereNull('date_signed')
                    ->whereHas('client', function ($q) use ($providerId) {
                        $q->whereHas('appointments', function ($q2) use ($providerId) {
                            $q2->where('provider_id', $providerId);
                        });
                    })
                    ->count();
            } catch (\Exception $e) {
                Log::warning('Failed to load pending consents for provider', [
                    'provider_id' => $providerId,
                    'error' => $e->getMessage()
                ]);
                $pendingConsents = 0;
            }

            // Recent appointments (last 5)
            $recentAppointments = [];
            try {
                $recentAppointments = Appointment::where('provider_id', $providerId)
                    ->with(['client:id,name,email', 'service:id,name'])
                    ->orderBy('start_time', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function($apt) {
                        return [
                            'id' => $apt->id,
                            'client_name' => $apt->client->name ?? 'Unknown',
                            'service_name' => $apt->service->name ?? 'Unknown',
                            'start_time' => $apt->start_time,
                            'status' => $apt->status ?? 'pending',
                        ];
                    })
                    ->toArray();
            } catch (\Exception $e) {
                Log::warning('Failed to load recent appointments for provider', [
                    'provider_id' => $providerId,
                    'error' => $e->getMessage()
                ]);
                $recentAppointments = [];
            }

            $data = [
                'todays_appointments' => $todaysAppointments,
                'upcoming_appointments' => $upcomingAppointments,
                'total_clients' => $totalClients,
                'total_treatments' => $totalTreatments,
                'completed_treatments' => $completedTreatments,
                'pending_consents' => $pendingConsents,
                'appointments_change' => $appointmentsChange,
                'recent_appointments' => $recentAppointments,
            ];
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Provider dashboard stats failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'todays_appointments' => 0,
                    'upcoming_appointments' => 0,
                    'total_clients' => 0,
                    'total_treatments' => 0,
                    'completed_treatments' => 0,
                    'pending_consents' => 0,
                    'appointments_change' => 0,
                    'recent_appointments' => [],
                ],
                'message' => 'Defaulted due to error',
            ], 200);
        }
    }
}

