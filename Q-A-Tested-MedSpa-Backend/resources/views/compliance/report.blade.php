<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Compliance Alerts Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #333;
        }
        .summary {
            margin-bottom: 30px;
        }
        .summary-boxes {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }
        .summary-box {
            text-align: center;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .summary-box h3 {
            margin: 5px 0;
            font-size: 24px;
            color: #c62828;
        }
        .summary-box p {
            margin: 0;
            color: #666;
            font-size: 11px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #2c3e50;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .priority-critical {
            color: #c62828;
            font-weight: bold;
        }
        .priority-high {
            color: #f57c00;
            font-weight: bold;
        }
        .priority-medium {
            color: #fbc02d;
        }
        .priority-low {
            color: #1565c0;
        }
        .status-active {
            color: #c62828;
            font-weight: bold;
        }
        .status-resolved {
            color: #2e7d32;
        }
        .status-dismissed {
            color: #757575;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Compliance Alerts Report</h1>
        <p>Generated on {{ Carbon\Carbon::now()->format('F d, Y') }}</p>
    </div>

    <div class="summary">
        <div class="summary-boxes">
            <div class="summary-box">
                <h3>{{ $stats['total'] }}</h3>
                <p>Total Alerts</p>
            </div>
            <div class="summary-box">
                <h3>{{ $stats['active'] }}</h3>
                <p>Active Alerts</p>
            </div>
            <div class="summary-box">
                <h3>{{ $stats['critical'] }}</h3>
                <p>Critical Alerts</p>
            </div>
            <div class="summary-box">
                <h3>{{ $stats['overdue'] }}</h3>
                <p>Overdue Alerts</p>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Category</th>
                <th>Affected Items</th>
                <th>Due Date</th>
                <th>Assigned To</th>
            </tr>
        </thead>
        <tbody>
            @foreach($alerts as $alert)
            <tr>
                <td>{{ $alert->title }}</td>
                <td>{{ ucfirst($alert->type) }}</td>
                <td class="priority-{{ $alert->priority }}">{{ ucfirst($alert->priority) }}</td>
                <td class="status-{{ $alert->status }}">{{ ucfirst($alert->status) }}</td>
                <td>{{ $alert->category }}</td>
                <td>{{ $alert->affected_items }}</td>
                <td>{{ Carbon\Carbon::parse($alert->due_date)->format('M d, Y') }}</td>
                <td>{{ $alert->assigned_to }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($alerts->isEmpty())
        <p style="text-align: center; color: #666; margin-top: 30px;">No compliance alerts found.</p>
    @endif

    <div class="footer">
        <p>This report was generated on {{ Carbon\Carbon::now()->format('M d, Y H:i:s') }}</p>
    </div>
</body>
</html>

