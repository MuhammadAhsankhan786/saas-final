<?php

namespace App\Http\Controllers;

use App\Models\ComplianceAlert;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class ComplianceAlertController extends Controller
{
    /**
     * Get all compliance alerts
     */
    public function index(Request $request)
    {
        $query = ComplianceAlert::query();

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
     * Get compliance alert statistics
     */
    public function statistics()
    {
        $totalAlerts = ComplianceAlert::count();
        $activeAlerts = ComplianceAlert::active()->count();
        $criticalAlerts = ComplianceAlert::critical()->count();
        $overdueAlerts = ComplianceAlert::overdue()->count();

        return response()->json([
            'total_alerts' => $totalAlerts,
            'active_alerts' => $activeAlerts,
            'critical_alerts' => $criticalAlerts,
            'overdue_alerts' => $overdueAlerts,
        ]);
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

