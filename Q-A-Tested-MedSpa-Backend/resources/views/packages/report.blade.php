<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Packages Summary Report</title>
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
        .popular {
            background-color: #d4edda;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedSpa Packages Summary</h1>
        <p>Generated: {{ now()->format('d M Y h:i A') }}</p>
        <p>Complete Package Analysis</p>
    </div>
    
    <div class="summary-grid">
        <div class="summary-row">
            <div class="summary-cell">
                <div class="summary-value">{{ $totalPackages }}</div>
                <div class="summary-label">Total Packages</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">${{ number_format($totalValue, 2) }}</div>
                <div class="summary-label">Total Value</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">${{ number_format($avgPrice, 2) }}</div>
                <div class="summary-label">Average Price</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $totalAssignments }}</div>
                <div class="summary-label">Total Assignments</div>
            </div>
        </div>
    </div>
    
    <h3>Package Assignment Statistics</h3>
    <table>
        <thead>
            <tr>
                <th>Package Name</th>
                <th>Price</th>
                <th>Assignments</th>
                <th>Revenue Generated</th>
            </tr>
        </thead>
        <tbody>
            @foreach($assignedPackages as $assignment)
            <tr class="@if($assignment['assignments_count'] > 2) popular @endif">
                <td>{{ $assignment['package_name'] }}</td>
                <td class="amount">${{ number_format($assignment['package_price'], 2) }}</td>
                <td>{{ $assignment['assignments_count'] }}</td>
                <td class="amount">${{ number_format($assignment['package_price'] * $assignment['assignments_count'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <h3>All Packages Details</h3>
    <table>
        <thead>
            <tr>
                <th>Package Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Duration (Days)</th>
                <th>Services Included</th>
            </tr>
        </thead>
        <tbody>
            @foreach($packages as $package)
            <tr>
                <td><strong>{{ $package->name }}</strong></td>
                <td>{{ $package->description ?: 'No description' }}</td>
                <td class="amount">${{ number_format($package->price, 2) }}</td>
                <td>{{ $package->duration ?: 'N/A' }}</td>
                <td>
                    @if($package->services_included && is_array($package->services_included))
                        {{ implode(', ', $package->services_included) }}
                    @else
                        Not specified
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p><strong>Generated automatically by MedSpa System</strong></p>
        <p>For questions about this packages report, please contact the administration.</p>
    </div>
</body>
</html>

