<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ComplianceAlert;
use Carbon\Carbon;

class ComplianceAlertsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $alerts = [
            [
                'title' => 'Consent Form Expiring Soon',
                'description' => '5 consent forms will expire within the next 7 days. Please review and renew all patient consent forms to ensure continued legal compliance.',
                'type' => 'consent',
                'priority' => 'high',
                'status' => 'active',
                'affected_items' => 5,
                'due_date' => Carbon::now()->addDays(7),
                'assigned_to' => 'Dr. Chen',
                'category' => 'Documentation',
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
            [
                'title' => 'HIPAA Compliance Review Required',
                'description' => 'Quarterly HIPAA compliance review is due. Complete security audit and update privacy policies.',
                'type' => 'compliance',
                'priority' => 'critical',
                'status' => 'active',
                'affected_items' => 1,
                'due_date' => Carbon::now()->addDays(2),
                'assigned_to' => 'Admin',
                'category' => 'Security',
                'created_at' => Carbon::now()->subDays(4),
                'updated_at' => Carbon::now()->subDays(4),
            ],
            [
                'title' => 'Staff Training Certification Expired',
                'description' => '2 staff members have expired training certifications. Schedule renewal training sessions immediately.',
                'type' => 'training',
                'priority' => 'medium',
                'status' => 'active',
                'affected_items' => 2,
                'due_date' => Carbon::now()->addDays(5),
                'assigned_to' => 'HR Manager',
                'category' => 'Training',
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'title' => 'Equipment Maintenance Overdue',
                'description' => 'Laser equipment maintenance is overdue. Schedule service appointment to ensure equipment safety.',
                'type' => 'equipment',
                'priority' => 'high',
                'status' => 'resolved',
                'affected_items' => 1,
                'due_date' => Carbon::now()->subDays(5),
                'assigned_to' => 'Dr. Smith',
                'category' => 'Equipment',
                'created_at' => Carbon::now()->subDays(7),
                'updated_at' => Carbon::now()->subDays(1),
            ],
            [
                'title' => 'Data Backup Verification Failed',
                'description' => 'Weekly data backup verification failed. Check backup system and verify data integrity.',
                'type' => 'backup',
                'priority' => 'critical',
                'status' => 'active',
                'affected_items' => 1,
                'due_date' => Carbon::now()->addDays(1),
                'assigned_to' => 'IT Admin',
                'category' => 'Data Security',
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'Medication Storage Audit Required',
                'description' => 'Annual medication storage audit is due. Check temperature logs and verify proper storage compliance.',
                'type' => 'compliance',
                'priority' => 'high',
                'status' => 'active',
                'affected_items' => 3,
                'due_date' => Carbon::now()->addDays(10),
                'assigned_to' => 'Pharmacy Manager',
                'category' => 'Documentation',
                'created_at' => Carbon::now()->subDays(1),
                'updated_at' => Carbon::now()->subDays(1),
            ],
            [
                'title' => 'OSHA Safety Inspection Pending',
                'description' => 'OSHA annual safety inspection is scheduled for next week. Complete all safety checks and documentation.',
                'type' => 'compliance',
                'priority' => 'medium',
                'status' => 'active',
                'affected_items' => 1,
                'due_date' => Carbon::now()->addDays(14),
                'assigned_to' => 'Safety Officer',
                'category' => 'Security',
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'Fire Safety Equipment Check',
                'description' => 'Monthly fire extinguisher and smoke detector inspection is due. Verify all equipment is functional.',
                'type' => 'equipment',
                'priority' => 'low',
                'status' => 'active',
                'affected_items' => 8,
                'due_date' => Carbon::now()->addDays(6),
                'assigned_to' => 'Facilities Manager',
                'category' => 'Equipment',
                'created_at' => Carbon::now()->subDays(4),
                'updated_at' => Carbon::now()->subDays(4),
            ],
            [
                'title' => 'Patient Records Access Audit',
                'description' => 'Quarterly patient records access audit required. Review all access logs and verify authorization.',
                'type' => 'compliance',
                'priority' => 'critical',
                'status' => 'dismissed',
                'affected_items' => 1,
                'due_date' => Carbon::now()->subDays(3),
                'assigned_to' => 'Compliance Officer',
                'category' => 'Security',
                'created_at' => Carbon::now()->subDays(10),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'title' => 'Employee Background Check Updates',
                'description' => '3 employees require annual background check renewal. Submit requests to HR immediately.',
                'type' => 'training',
                'priority' => 'medium',
                'status' => 'active',
                'affected_items' => 3,
                'due_date' => Carbon::now()->addDays(21),
                'assigned_to' => 'HR Manager',
                'category' => 'Training',
                'created_at' => Carbon::now()->subDays(6),
                'updated_at' => Carbon::now()->subDays(6),
            ],
        ];

        foreach ($alerts as $alert) {
            ComplianceAlert::create($alert);
        }
    }
}

