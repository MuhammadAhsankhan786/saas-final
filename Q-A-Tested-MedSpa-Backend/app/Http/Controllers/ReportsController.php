<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * Revenue reports (daily, monthly, yearly).
     */
    public function revenue(Request $request)
    {
        $request->validate([
            'granularity' => 'required|in:daily,monthly,yearly',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location_id' => 'nullable|exists:locations,id',
            'export' => 'nullable|in:csv,pdf',
        ]);

        $granularity = $request->granularity;
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subYear();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
        $locationId = $request->location_id;

        $query = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($locationId) {
            $query->whereHas('appointment', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            });
        }

        $revenue = $query->selectRaw('
            DATE(created_at) as date,
            SUM(amount) as total_revenue,
            SUM(tips) as total_tips,
            SUM(commission) as total_commission,
            COUNT(*) as transaction_count
        ')
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        $summary = [
            'total_revenue' => $revenue->sum('total_revenue'),
            'total_tips' => $revenue->sum('total_tips'),
            'total_commission' => $revenue->sum('total_commission'),
            'transaction_count' => $revenue->sum('transaction_count'),
            'average_transaction' => $revenue->sum('total_revenue') / max($revenue->sum('transaction_count'), 1),
        ];

        $response = [
            'granularity' => $granularity,
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'summary' => $summary,
            'data' => $revenue,
        ];

        if ($request->export === 'csv') {
            return $this->exportRevenueCsv($revenue, $summary);
        }

        return response()->json($response);
    }

    /**
     * Client retention metrics.
     */
    public function clientRetention(Request $request)
    {
        $request->validate([
            'period' => 'nullable|in:3months,6months,1year',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $period = $request->period ?? '6months';
        $months = $period === '3months' ? 3 : ($period === '6months' ? 6 : 12);
        $startDate = Carbon::now()->subMonths($months);

        $query = Client::where('created_at', '>=', $startDate);
        
        if ($request->location_id) {
            $query->where('location_id', $request->location_id);
        }

        $totalClients = $query->count();

        // Clients with appointments in the last 30 days
        $activeClients = Client::whereHas('appointments', function ($q) {
            $q->where('created_at', '>=', Carbon::now()->subDays(30));
        })->count();

        // New clients this period
        $newClients = Client::where('created_at', '>=', $startDate)->count();

        // Returning clients (had appointments before this period and during)
        $returningClients = Client::whereHas('appointments', function ($q) use ($startDate) {
            $q->where('created_at', '<', $startDate);
        })->whereHas('appointments', function ($q) use ($startDate) {
            $q->where('created_at', '>=', $startDate);
        })->count();

        $retentionRate = $totalClients > 0 ? ($activeClients / $totalClients) * 100 : 0;

        return response()->json([
            'period' => $period,
            'metrics' => [
                'total_clients' => $totalClients,
                'active_clients' => $activeClients,
                'new_clients' => $newClients,
                'returning_clients' => $returningClients,
                'retention_rate' => round($retentionRate, 2),
            ],
        ]);
    }

    /**
     * Staff performance analytics.
     */
    public function staffPerformance(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location_id' => 'nullable|exists:locations,id',
            'staff_id' => 'nullable|exists:users,id',
        ]);

        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        $query = User::whereIn('role', ['provider', 'reception'])
            ->with(['staff', 'appointments' => function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            }]);

        if ($request->location_id) {
            $query->whereHas('staff', function ($q) use ($request) {
                $q->where('location_id', $request->location_id);
            });
        }

        if ($request->staff_id) {
            $query->where('id', $request->staff_id);
        }

        $staff = $query->get()->map(function ($user) use ($startDate, $endDate) {
            $appointments = $user->appointments;
            $completedAppointments = $appointments->where('status', 'completed');
            
            // Calculate revenue generated by this staff member
            $revenue = Payment::whereHas('appointment', function ($q) use ($user, $startDate, $endDate) {
                $q->where('provider_id', $user->id)
                  ->whereBetween('created_at', [$startDate, $endDate]);
            })->where('status', 'completed')->sum('amount');

            return [
                'staff_id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'location' => $user->staff->location->name ?? 'N/A',
                'total_appointments' => $appointments->count(),
                'completed_appointments' => $completedAppointments->count(),
                'completion_rate' => $appointments->count() > 0 
                    ? round(($completedAppointments->count() / $appointments->count()) * 100, 2) 
                    : 0,
                'revenue_generated' => $revenue,
                'average_appointment_value' => $completedAppointments->count() > 0 
                    ? round($revenue / $completedAppointments->count(), 2) 
                    : 0,
            ];
        });

        return response()->json([
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'staff_performance' => $staff,
        ]);
    }

    /**
     * Export revenue data as CSV.
     */
    private function exportRevenueCsv($revenue, $summary)
    {
        $filename = 'revenue_report_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($revenue, $summary) {
            $file = fopen('php://output', 'w');
            
            // Summary row
            fputcsv($file, ['Summary']);
            fputcsv($file, ['Total Revenue', $summary['total_revenue']]);
            fputcsv($file, ['Total Tips', $summary['total_tips']]);
            fputcsv($file, ['Total Commission', $summary['total_commission']]);
            fputcsv($file, ['Transaction Count', $summary['transaction_count']]);
            fputcsv($file, ['Average Transaction', $summary['average_transaction']]);
            fputcsv($file, []); // Empty row
            
            // Data rows
            fputcsv($file, ['Date', 'Revenue', 'Tips', 'Commission', 'Transactions']);
            foreach ($revenue as $row) {
                fputcsv($file, [
                    $row->date,
                    $row->total_revenue,
                    $row->total_tips,
                    $row->total_commission,
                    $row->transaction_count,
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
