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

            return response()->json([
                'success' => true,
                'data' => $logs
            ], 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching audit logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit logs',
                'data' => []
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

    /**
     * Store a newly created audit log
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'action' => 'required|string|max:255',
                'table_name' => 'required|string|max:255',
                'record_id' => 'required|integer',
                'old_data' => 'nullable|array',
                'new_data' => 'nullable|array',
            ]);

            $auditLog = AuditLog::create($validated);
            $auditLog->load('user:id,name,email,role');

            \Log::info('Audit log created: ' . $auditLog->id);

            return response()->json([
                'success' => true,
                'message' => 'Audit log created successfully',
                'data' => $auditLog
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating audit log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create audit log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified audit log
     */
    public function show($id)
    {
        try {
            $auditLog = AuditLog::with('user:id,name,email,role')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $auditLog
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified audit log
     */
    public function update(Request $request, $id)
    {
        try {
            $auditLog = AuditLog::findOrFail($id);

            $validated = $request->validate([
                'user_id' => 'sometimes|exists:users,id',
                'action' => 'sometimes|string|max:255',
                'table_name' => 'sometimes|string|max:255',
                'record_id' => 'sometimes|integer',
                'old_data' => 'nullable|array',
                'new_data' => 'nullable|array',
            ]);

            $auditLog->update($validated);
            $auditLog->load('user:id,name,email,role');

            \Log::info('Audit log updated: ' . $auditLog->id);

            return response()->json([
                'success' => true,
                'message' => 'Audit log updated successfully',
                'data' => $auditLog
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating audit log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update audit log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified audit log
     */
    public function destroy($id)
    {
        try {
            $auditLog = AuditLog::findOrFail($id);
            $auditLogId = $auditLog->id;
            $auditLog->delete();

            \Log::info('Audit log deleted: ' . $auditLogId);

            return response()->json([
                'success' => true,
                'message' => 'Audit log deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error deleting audit log: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete audit log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
