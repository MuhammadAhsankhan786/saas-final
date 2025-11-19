<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BusinessSettings;
use Illuminate\Http\JsonResponse;

class BusinessSettingsController extends Controller
{
    /**
     * Get business settings
     */
    public function index(): JsonResponse
    {
        $settings = BusinessSettings::first();
        
        if (!$settings) {
            // Return default settings if none exist
            $settings = $this->getDefaultSettings();
        }
        
        return response()->json($settings);
    }

    /**
     * Update business settings
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'business_name' => 'required|string|max:255',
                'business_type' => 'required|string|max:255',
                'license_number' => 'nullable|string|max:255',
                'tax_id' => 'nullable|string|max:255',
                'website' => 'nullable|url|max:255',
                'description' => 'nullable|string',
                'address' => 'required|string|max:255',
                'city' => 'required|string|max:255',
                'state' => 'required|string|max:255',
                'zip_code' => 'required|string|max:10',
                'phone' => 'required|string|max:20',
                'email' => 'required|email|max:255',
                'hours' => 'required|array',
                'currency' => 'required|string|max:3',
                'timezone' => 'required|string|max:50',
                'date_format' => 'required|string|max:20',
                'time_format' => 'required|string|max:2',
                'features' => 'required|array',
                'locations' => 'required|array',
            ]);

            // Ensure JSON fields are arrays (Laravel will auto-encode to JSON)
            $data = $validated;
            // Laravel's array cast will handle encoding, but ensure we have arrays
            if (isset($data['hours']) && !is_array($data['hours'])) {
                $data['hours'] = json_decode($data['hours'], true) ?? [];
            }
            if (isset($data['features']) && !is_array($data['features'])) {
                $data['features'] = json_decode($data['features'], true) ?? [];
            }
            if (isset($data['locations']) && !is_array($data['locations'])) {
                $data['locations'] = json_decode($data['locations'], true) ?? [];
            }

            $settings = BusinessSettings::first();
            
            if ($settings) {
                // Update existing settings - Laravel will automatically handle JSON casting
                $settings->fill($data);
                $settings->save();
            } else {
                // Create new settings
                $settings = BusinessSettings::create($data);
            }

            return response()->json([
                'message' => 'Business settings updated successfully',
                'data' => $settings
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Business settings update error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to update business settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get default business settings
     */
    private function getDefaultSettings(): array
    {
        return [
            'business_name' => 'MediSpa Wellness Center',
            'business_type' => 'Medical Spa',
            'license_number' => 'MED-2024-001',
            'tax_id' => '12-3456789',
            'website' => 'https://www.medispa-wellness.com',
            'description' => 'Premier medical spa offering advanced aesthetic treatments and wellness services.',
            'address' => '123 Medical Plaza',
            'city' => 'New York',
            'state' => 'NY',
            'zip_code' => '10001',
            'phone' => '(555) 123-4567',
            'email' => 'info@medispa-wellness.com',
            'hours' => [
                'monday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'tuesday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'wednesday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'thursday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'friday' => ['open' => '09:00', 'close' => '18:00', 'closed' => false],
                'saturday' => ['open' => '10:00', 'close' => '16:00', 'closed' => false],
                'sunday' => ['open' => '10:00', 'close' => '16:00', 'closed' => true],
            ],
            'currency' => 'USD',
            'timezone' => 'America/New_York',
            'date_format' => 'MM/DD/YYYY',
            'time_format' => '12',
            'features' => [
                'onlineBooking' => true,
                'clientPortal' => true,
                'inventoryTracking' => true,
                'staffScheduling' => true,
                'reporting' => true,
                'complianceTracking' => true,
            ],
            'locations' => [
                [
                    'id' => '1',
                    'name' => 'Downtown Clinic',
                    'address' => '123 Medical Plaza',
                    'city' => 'New York',
                    'state' => 'NY',
                    'zip_code' => '10001',
                    'phone' => '(555) 123-4567',
                    'isActive' => true,
                ],
                [
                    'id' => '2',
                    'name' => 'Westside Location',
                    'address' => '456 Oak Avenue',
                    'city' => 'New York',
                    'state' => 'NY',
                    'zip_code' => '10002',
                    'phone' => '(555) 234-5678',
                    'isActive' => true,
                ],
            ],
        ];
    }
}
