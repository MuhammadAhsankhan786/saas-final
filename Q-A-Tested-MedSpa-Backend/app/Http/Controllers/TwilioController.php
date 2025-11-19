<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\TwilioService;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\SmsLog;
use App\Models\User;

class TwilioController extends Controller
{
    protected $twilioService;

    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }

    /**
     * ============================================================
     * ADMIN ROLE - SMS Functions
     * ============================================================
     */

    /**
     * Send marketing SMS (Admin)
     * POST /api/admin/sms/marketing
     */
    public function sendMarketingSms(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'to' => 'required|string',
            'message' => 'required|string|max:1600',
            'client_id' => 'nullable|exists:clients,id',
        ]);

        try {
            $smsLog = $this->twilioService->sendMarketingSms(
                $request->to,
                $request->message,
                $request->client_id
            );

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Marketing SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send marketing SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Marketing SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to send marketing SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send system alert SMS (Admin)
     * POST /api/admin/sms/system-alert
     */
    public function sendSystemAlert(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'to' => 'required|string',
            'message' => 'required|string|max:1600',
            'user_id' => 'nullable|exists:users,id',
        ]);

        try {
            $smsLog = $this->twilioService->sendSystemAlert(
                $request->to,
                $request->message,
                $request->user_id
            );

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'System alert SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send system alert SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('System alert SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to send system alert SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get SMS logs (Admin)
     * GET /api/admin/sms/logs
     */
    public function getSmsLogs(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = SmsLog::with(['user', 'appointment', 'payment', 'client']);

        // Filters
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $logs = $query->orderByDesc('created_at')->paginate(50);

        return response()->json($logs, 200);
    }

    /**
     * ============================================================
     * PROVIDER ROLE - SMS Functions
     * ============================================================
     */

    /**
     * Send follow-up SMS (Provider)
     * POST /api/provider/sms/follow-up
     */
    public function sendFollowUp(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'provider') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider'])->find($request->appointment_id);

            // Verify appointment belongs to this provider
            if ($appointment->provider_id !== $user->id) {
                return response()->json(['message' => 'Appointment not found or access denied'], 404);
            }

            $smsLog = $this->twilioService->sendFollowUpSms($appointment, $appointment->client);

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Follow-up SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send follow-up SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Follow-up SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send follow-up SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send review request SMS (Provider)
     * POST /api/provider/sms/review-request
     */
    public function sendReviewRequest(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'provider') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider'])->find($request->appointment_id);

            // Verify appointment belongs to this provider
            if ($appointment->provider_id !== $user->id) {
                return response()->json(['message' => 'Appointment not found or access denied'], 404);
            }

            $smsLog = $this->twilioService->sendReviewRequest($appointment, $appointment->client);

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Review request SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send review request SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Review request SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send review request SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send post-care instructions SMS (Provider)
     * POST /api/provider/sms/post-care
     */
    public function sendPostCareInstructions(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'provider') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'instructions' => 'nullable|string|max:1600',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider'])->find($request->appointment_id);

            // Verify appointment belongs to this provider
            if ($appointment->provider_id !== $user->id) {
                return response()->json(['message' => 'Appointment not found or access denied'], 404);
            }

            $smsLog = $this->twilioService->sendPostCareInstructions(
                $appointment,
                $appointment->client,
                $request->instructions
            );

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Post-care instructions SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send post-care instructions SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Post-care instructions SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send post-care instructions SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ============================================================
     * RECEPTION ROLE - SMS Functions
     * ============================================================
     */

    /**
     * Send appointment confirmation SMS (Reception)
     * POST /api/reception/sms/confirmation
     */
    public function sendConfirmation(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider', 'location'])->find($request->appointment_id);

            $smsLog = $this->twilioService->sendAppointmentConfirmation($appointment, $appointment->client);

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Appointment confirmation SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send appointment confirmation SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Appointment confirmation SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send appointment confirmation SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send appointment reminder SMS (Reception)
     * POST /api/reception/sms/reminder
     */
    public function sendReminder(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider', 'location'])->find($request->appointment_id);

            $smsLog = $this->twilioService->sendAppointmentReminder($appointment, $appointment->client);

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Appointment reminder SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send appointment reminder SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Appointment reminder SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send appointment reminder SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send appointment rescheduled SMS (Reception)
     * POST /api/reception/sms/reschedule
     */
    public function sendRescheduled(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'old_time' => 'nullable|date',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider', 'location'])->find($request->appointment_id);

            $smsLog = $this->twilioService->sendAppointmentRescheduled(
                $appointment,
                $appointment->client,
                $request->old_time
            );

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Appointment rescheduled SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send appointment rescheduled SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Appointment rescheduled SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send appointment rescheduled SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send appointment cancellation SMS (Reception)
     * POST /api/reception/sms/cancellation
     */
    public function sendCancellation(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        try {
            $appointment = Appointment::with(['client.clientUser', 'provider', 'location'])->find($request->appointment_id);

            $smsLog = $this->twilioService->sendAppointmentCancelled($appointment, $appointment->client);

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Appointment cancellation SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send appointment cancellation SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Appointment cancellation SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'appointment_id' => $request->appointment_id,
            ]);

            return response()->json([
                'message' => 'Failed to send appointment cancellation SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send welcome SMS to new client (Reception)
     * POST /api/reception/sms/welcome
     */
    public function sendWelcome(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'reception') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'client_id' => 'required|exists:clients,id',
        ]);

        try {
            $client = Client::with('clientUser')->find($request->client_id);

            $smsLog = $this->twilioService->sendWelcomeSms($client);

            if ($smsLog && $smsLog->status === 'sent') {
                return response()->json([
                    'message' => 'Welcome SMS sent successfully',
                    'sms_log' => $smsLog,
                ], 200);
            } else {
                return response()->json([
                    'message' => 'Failed to send welcome SMS',
                    'error' => $smsLog->error_message ?? 'Unknown error',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Welcome SMS send failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'client_id' => $request->client_id,
            ]);

            return response()->json([
                'message' => 'Failed to send welcome SMS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
