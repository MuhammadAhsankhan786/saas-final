<?php

namespace App\Http\Controllers;

use App\Models\ComplianceAlert;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class ComplianceAlertController extends Controller
{
    /**
     * Get all compliance alerts with role-based filtering
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Ensure base data exists for providers
            if ($user && $user->role === 'provider' && ComplianceAlert::count() === 0) {
                \App\Http\Controllers\DatabaseSeederController::seedMissingData();
            }

            $query = ComplianceAlert::query();

            // Role-based filtering: Providers only see alerts assigned to them
            if ($user && $user->role === 'provider') {
                $query->where('assigned_to', $user->id);
            }

            // Apply filters
            if ($request->has('type') && $request->type !== 'All') {
                $query->where('type', $request->type);
            }

            if ($request->has('priority') && $request->priority !== 'All') {
                $query->where('priority', $request->priority);
            }

            if ($request->has('status') && $request->status !== 'All') {
                $query->where('status', $request->status);
            }

            if ($request->has('category') && $request->category !== 'All') {
                $query->where('category', $request->category);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('assigned_to', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%");
                });
            }

            $alerts = $query->orderByRaw("CASE 
                                WHEN priority = 'critical' THEN 1 
                                WHEN priority = 'high' THEN 2 
                                WHEN priority = 'medium' THEN 3 
                                WHEN priority = 'low' THEN 4 
                                ELSE 5 
                            END")
                            ->orderBy('due_date', 'asc')
                            ->get();

            return response()->json($alerts);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching compliance alerts', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([]);
        }
    }

    /**
     * Get a specific compliance alert
     */
    public function show($id)
    {
        $alert = ComplianceAlert::findOrFail($id);
        return response()->json($alert);
    }

    /**
     * Get compliance alert statistics with role-based filtering
     */
    public function statistics()
    {
        try {
            $user = auth()->user();
            
            // Build base query with role-based filtering
            $baseQuery = ComplianceAlert::query();
            if ($user && $user->role === 'provider') {
                $baseQuery->where('assigned_to', $user->id);
            }

            $totalAlerts = $baseQuery->count();
            $activeAlerts = (clone $baseQuery)->where('status', 'active')->count();
            $criticalAlerts = (clone $baseQuery)->where('priority', 'critical')->count();
            $overdueAlerts = (clone $baseQuery)->where('due_date', '<', Carbon::now())
                                               ->where('status', 'active')
                                               ->count();

            return response()->json([
                'total_alerts' => $totalAlerts,
                'active_alerts' => $activeAlerts,
                'critical_alerts' => $criticalAlerts,
                'overdue_alerts' => $overdueAlerts,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching compliance statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'total_alerts' => 0,
                'active_alerts' => 0,
                'critical_alerts' => 0,
                'overdue_alerts' => 0,
            ]);
        }
    }

    /**
     * Mark alert as resolved
     */
    public function resolve($id)
    {
        $alert = ComplianceAlert::findOrFail($id);
        $alert->update(['status' => 'resolved']);
        
        return response()->json(['message' => 'Alert resolved successfully']);
    }

    /**
     * Mark alert as dismissed
     */
    public function dismiss($id)
    {
        $alert = ComplianceAlert::findOrFail($id);
        $alert->update(['status' => 'dismissed']);
        
        return response()->json(['message' => 'Alert dismissed successfully']);
    }

    /**
     * Export compliance alerts to PDF
     */
    public function exportPDF(Request $request)
    {
        try {
            $query = ComplianceAlert::query();

            // Apply filters if provided
            if ($request->has('status') && $request->status !== 'All') {
                $query->where('status', $request->status);
            }

            if ($request->has('priority') && $request->priority !== 'All') {
                $query->where('priority', $request->priority);
            }

            $alerts = $query->orderBy('priority', 'desc')
                            ->orderBy('due_date', 'asc')
                            ->get();

            $stats = [
                'total' => $alerts->count(),
                'active' => $alerts->where('status', 'active')->count(),
                'critical' => $alerts->where('priority', 'critical')->count(),
                'overdue' => $alerts->filter(function($alert) {
                    return $alert->due_date < Carbon::now() && $alert->status === 'active';
                })->count(),
            ];

            $pdf = PDF::loadView('compliance.report', compact('alerts', 'stats'));
            
            return $pdf->download('compliance-alerts-' . Carbon::now()->format('Y-m-d') . '.pdf');
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }
}

