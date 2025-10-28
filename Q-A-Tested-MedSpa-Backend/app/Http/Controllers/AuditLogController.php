<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class AuditLogController extends Controller
{
    /**
     * Get all audit logs with optional filters
     */
    public function index(Request $request)
    {
        try {
            $query = AuditLog::with('user:id,name,email,role');

            // Apply filters if provided
            if ($request->has('action') && $request->action !== 'All') {
                $query->where('action', $request->action);
            }

            if ($request->has('table_name') && $request->table_name) {
                $query->where('table_name', $request->table_name);
            }

            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            // Date range filter
            if ($request->has('start_date') && $request->start_date) {
                $query->where('created_at', '>=', $request->start_date);
            }

            if ($request->has('end_date') && $request->end_date) {
                $query->where('created_at', '<=', $request->end_date);
            }

            // Search query
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                      ->orWhere('table_name', 'like', "%{$search}%")
                      ->orWhereHas('user', function($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                     ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            $logs = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 50);

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export audit logs to PDF
     */
    public function exportPDF(Request $request)
    {
        try {
            $query = AuditLog::with('user:id,name,email,role');

            // Apply filters if provided
            if ($request->has('action') && $request->action !== 'All') {
                $query->where('action', $request->action);
            }

            if ($request->has('table_name') && $request->table_name) {
                $query->where('table_name', $request->table_name);
            }

            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            // Date range filter
            if ($request->has('start_date') && $request->start_date) {
                $query->where('created_at', '>=', $request->start_date);
            }

            if ($request->has('end_date') && $request->end_date) {
                $query->where('created_at', '<=', $request->end_date);
            }

            $logs = $query->orderBy('created_at', 'desc')->get();

            // Calculate statistics
            $stats = [
                'total' => $logs->count(),
                'by_action' => $logs->groupBy('action')->map->count(),
                'by_table' => $logs->groupBy('table_name')->map->count(),
                'by_user' => $logs->groupBy('user.name')->map->count(),
                'recent' => $logs->take(100)->values(),
            ];

            $pdf = PDF::loadView('audit.report', compact('logs', 'stats'));
            
            return $pdf->download('audit-logs-' . Carbon::now()->format('Y-m-d') . '.pdf');
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    /**
     * Get audit log statistics
     */
    public function statistics()
    {
        try {
            $total = AuditLog::count();
            $today = AuditLog::whereDate('created_at', Carbon::today())->count();
            $thisWeek = AuditLog::whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->count();
            $thisMonth = AuditLog::whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year)->count();

            return response()->json([
                'total' => $total,
                'today' => $today,
                'this_week' => $thisWeek,
                'this_month' => $thisMonth,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
