<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Audit Log Report</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #1e40af;
            margin: 0 0 10px 0;
            font-size: 24pt;
        }
        
        .header p {
            color: #64748b;
            margin: 5px 0;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .stat-box {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            padding: 15px;
            margin: 5px;
            flex: 1;
            min-width: 150px;
            text-align: center;
        }
        
        .stat-label {
            font-size: 9pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-value {
            font-size: 18pt;
            font-weight: bold;
            color: #1e40af;
            margin-top: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
        }
        
        th {
            background-color: #1e40af;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #1e3a8a;
        }
        
        td {
            padding: 8px;
            border: 1px solid #e5e7eb;
        }
        
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        tr:hover {
            background-color: #e0e7ff;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-success {
            background-color: #10b981;
            color: white;
        }
        
        .badge-warning {
            background-color: #f59e0b;
            color: white;
        }
        
        .badge-danger {
            background-color: #ef4444;
            color: white;
        }
        
        .badge-info {
            background-color: #3b82f6;
            color: white;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #64748b;
            font-size: 8pt;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }
        
        .detail {
            font-size: 8pt;
            color: #64748b;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Audit Log Report</h1>
        <p><strong>Generated:</strong> {{ Carbon\Carbon::now()->format('F d, Y \a\t g:i A') }}</p>
        <p><strong>Total Records:</strong> {{ $logs->count() }}</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <div class="stat-label">Total Events</div>
            <div class="stat-value">{{ $stats['total'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">By Action</div>
            <div class="stat-value">{{ $stats['by_action']->count() }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Affected Tables</div>
            <div class="stat-value">{{ $stats['by_table']->count() }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Active Users</div>
            <div class="stat-value">{{ $stats['by_user']->count() }}</div>
        </div>
    </div>

    @if($logs->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Record ID</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                @foreach($logs->take(200) as $log)
                <tr>
                    <td>
                        <div style="font-weight: bold;">{{ $log->created_at->format('M d, Y') }}</div>
                        <div class="detail">{{ $log->created_at->format('g:i A') }}</div>
                    </td>
                    <td>
                        @if($log->user)
                            <div style="font-weight: bold;">{{ $log->user->name }}</div>
                            <div class="detail">{{ $log->user->email }}</div>
                        @else
                            <span style="color: #94a3b8;">Unknown User</span>
                        @endif
                    </td>
                    <td>
                        @php
                            $actionColors = [
                                'create' => 'badge-success',
                                'update' => 'badge-info',
                                'delete' => 'badge-danger',
                                'login' => 'badge-success',
                                'logout' => 'badge-info',
                                'view' => 'badge-info',
                            ];
                            $colorClass = $actionColors[strtolower($log->action)] ?? 'badge-info';
                        @endphp
                        <span class="badge {{ $colorClass }}">{{ ucfirst($log->action) }}</span>
                    </td>
                    <td>
                        {{ $log->table_name }}
                    </td>
                    <td>
                        <strong>{{ $log->record_id }}</strong>
                    </td>
                    <td style="max-width: 300px; word-wrap: break-word;">
                        @if($log->new_data)
                            {{ is_array($log->new_data) ? json_encode($log->new_data, JSON_PRETTY_PRINT) : $log->new_data }}
                        @elseif($log->old_data)
                            {{ is_array($log->old_data) ? json_encode($log->old_data, JSON_PRETTY_PRINT) : $log->old_data }}
                        @else
                            No additional details
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div class="no-data">
            <h3>No Audit Logs Found</h3>
            <p>No audit logs match the selected criteria.</p>
        </div>
    @endif

    <div class="footer">
        <p>This is an automated audit log report generated by MedSpa Management System</p>
        <p>Confidential - For Internal Use Only</p>
    </div>
</body>
</html>
