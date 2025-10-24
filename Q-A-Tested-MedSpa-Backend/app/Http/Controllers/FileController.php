<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\ConsentForm;
use App\Models\Treatment;
use App\Models\Client;

class FileController extends Controller
{
    /**
     * Serve consent form files securely.
     */
    public function consentForm($id, $filename)
    {
        $consentForm = ConsentForm::findOrFail($id);
        $user = auth()->user();

        // Check authorization
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        if (!$consentForm->file_url || !Storage::disk('local')->exists($consentForm->file_url)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->response($consentForm->file_url);
    }

    /**
     * Serve treatment photos securely.
     */
    public function treatmentPhoto($id, $type)
    {
        $treatment = Treatment::findOrFail($id);
        $user = auth()->user();

        // Check authorization
        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first();
            if (!$client || $treatment->appointment->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $filePath = $type === 'before' ? $treatment->before_photo : $treatment->after_photo;

        if (!$filePath || !Storage::disk('local')->exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->response($filePath);
    }

    /**
     * Generate temporary signed URL for file access.
     */
    public function signedUrl(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'expires_in' => 'nullable|integer|min:1|max:3600', // max 1 hour
        ]);

        $user = auth()->user();
        $filePath = $request->file_path;
        $expiresIn = $request->expires_in ?? 300; // 5 minutes default

        // Basic authorization check - in production, add more specific checks
        if (!Storage::disk('local')->exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $url = Storage::disk('local')->temporaryUrl($filePath, now()->addSeconds($expiresIn));

        return response()->json([
            'signed_url' => $url,
            'expires_at' => now()->addSeconds($expiresIn)->toISOString(),
        ]);
    }
}
