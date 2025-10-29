<?php

namespace App\Http\Controllers;

use App\Models\ConsentForm;
use Illuminate\Http\Request;

class ConsentFormController extends Controller
{
    /**
     * Display a listing of the consent forms.
     */
    public function index()
    {
        $user = auth()->user();
        $query = ConsentForm::with(['client.clientUser', 'service']);

        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if ($client) {
                $query->where('client_id', $client->id);
            } else {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
        } elseif ($user->role === 'provider') {
            // Provider only sees consent forms for their assigned clients
            $query->whereHas('client', function ($q) use ($user) {
                $q->where('preferred_provider_id', $user->id);
            });
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created consent form.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        
        // Client can only create consent forms for themselves
        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
            // Force client_id to be the logged-in client's ID
            $request->merge(['client_id' => $client->id]);
        }
        
        $request->validate([
            'client_id'        => 'required|exists:clients,id',
            'service_id'       => 'required|exists:services,id',
            'form_type'        => 'required|in:consent,GFE,intake',
            'digital_signature'=> 'nullable|string',
            'file'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        // Store file securely in private storage
        $fileUrl = $request->hasFile('file') 
            ? $request->file('file')->store('consents', 'local') 
            : null;

        $consentForm = ConsentForm::create([
            'client_id'         => $request->client_id,
            'service_id'        => $request->service_id,
            'form_type'         => $request->form_type,
            'digital_signature' => $request->digital_signature,
            'file_url'          => $fileUrl,
            'date_signed'       => now(),
        ]);

        return response()->json([
            'message' => 'Consent form created successfully',
            'consent_form' => $consentForm->load(['client.clientUser','service'])
        ], 201);
    }

    /**
     * Display the specified consent form.
     */
    public function show(string $id)
    {
        $consentForm = ConsentForm::with(['client.clientUser','service'])->findOrFail($id);
        $user = auth()->user();

        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($user->role === 'provider') {
            // Provider can only see consent forms for their assigned clients
            if ($consentForm->client->preferred_provider_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($consentForm);
    }

    /**
     * Update the specified consent form.
     */
    public function update(Request $request, string $id)
    {
        $consentForm = ConsentForm::findOrFail($id);
        $user = auth()->user();

        // Client can only update their own consent forms
        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $request->validate([
            'form_type'        => 'nullable|in:consent,GFE,intake',
            'digital_signature'=> 'nullable|string',
            'file'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('file')) {
            $consentForm->file_url = $request->file('file')->store('consents', 'local');
        }

        $consentForm->update($request->only(['form_type','digital_signature']));

        return response()->json([
            'message' => 'Consent form updated successfully',
            'consent_form' => $consentForm->load(['client.clientUser','service'])
        ]);
    }

    /**
     * Remove the specified consent form.
     */
    public function destroy(string $id)
    {
        $consentForm = ConsentForm::findOrFail($id);
        $user = auth()->user();

        // Client can only delete their own consent forms
        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client || $consentForm->client_id !== $client->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $consentForm->delete();

        return response()->json(['message' => 'Consent form deleted successfully']);
    }
}
