<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Revenue Report - {{ ucfirst($period) }}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .summary-grid {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .summary-row {
            display: table-row;
        }
        .summary-cell {
            display: table-cell;
            width: 25%;
            padding: 15px;
            text-align: center;
            border: 1px solid #ddd;
            background: #f8f9fa;
        }
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        .summary-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
        }
        td, th { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
        }
        th { 
            background: #f8f9fa; 
            font-weight: bold;
            color: #495057;
        }
        .amount {
            font-weight: bold;
            color: #28a745;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .period-info {
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedSpa Revenue Report</h1>
        <p>Generated: {{ now()->format('d M Y h:i A') }}</p>
        <p>Period: {{ ucfirst($period) }} Report</p>
    </div>
    
    <div class="period-info">
        <strong>Report Period:</strong> {{ $startDate->format('d M Y') }} to {{ $endDate->format('d M Y') }}
    </div>
    
    <div class="summary-grid">
        <div class="summary-row">
            <div class="summary-cell">
                <div class="summary-value">${{ number_format($totalRevenue, 2) }}</div>
                <div class="summary-label">Total Revenue</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">${{ number_format($totalTips, 2) }}</div>
                <div class="summary-label">Total Tips</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">${{ number_format($totalCommission, 2) }}</div>
                <div class="summary-label">Total Commission</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $totalTransactions }}</div>
                <div class="summary-label">Transactions</div>
            </div>
        </div>
    </div>
    
    <h3>Daily Revenue Breakdown</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Tips</th>
                <th>Commission</th>
                <th>Transactions</th>
            </tr>
        </thead>
        <tbody>
            @forelse($revenueData as $day)
            <tr>
                <td>{{ \Carbon\Carbon::parse($day->date)->format('d M Y') }}</td>
                <td class="amount">${{ number_format($day->revenue, 2) }}</td>
                <td>${{ number_format($day->tips, 2) }}</td>
                <td>${{ number_format($day->commission, 2) }}</td>
                <td>{{ $day->transactions }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="text-align: center; color: #666;">No revenue data for this period</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    
    @if($serviceRevenue->count() > 0)
    <h3>Service Revenue Breakdown</h3>
    <table>
        <thead>
            <tr>
                <th>Service</th>
                <th>Revenue</th>
                <th>Percentage</th>
                <th>Transactions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($serviceRevenue as $service)
            <tr>
                <td>{{ $service['service'] }}</td>
                <td class="amount">${{ number_format($service['revenue'], 2) }}</td>
                <td>{{ $service['percentage'] }}%</td>
                <td>{{ $service['transactions'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
    
    <div class="footer">
        <p><strong>Generated automatically by MedSpa System</strong></p>
        <p>For questions about this report, please contact the administration.</p>
    </div>
</body>
</html>

