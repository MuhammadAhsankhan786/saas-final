<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Client Analytics Report</title>
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
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            background: #e9ecef;
            padding: 10px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #495057;
        }
        .chart-placeholder {
            background: #f8f9fa;
            border: 1px solid #ddd;
            padding: 20px;
            text-align: center;
            color: #666;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedSpa Client Analytics Report</h1>
        <p>Generated: {{ now()->format('d M Y h:i A') }}</p>
        <p>Complete Client Analysis & Demographics</p>
    </div>
    
    <div class="summary-grid">
        <div class="summary-row">
            <div class="summary-cell">
                <div class="summary-value">{{ $demographicsData['totalClients'] }}</div>
                <div class="summary-label">Total Clients</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $growthData[count($growthData)-1]['newClients'] ?? 0 }}</div>
                <div class="summary-label">New This Month</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $growthData[count($growthData)-1]['returningClients'] ?? 0 }}</div>
                <div class="summary-label">Returning This Month</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $retentionData[count($retentionData)-1]['retentionRate'] ?? 0 }}%</div>
                <div class="summary-label">Retention Rate</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Client Growth Trends (Last {{ $months }} Months)</div>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>New Clients</th>
                    <th>Returning Clients</th>
                    <th>Total Clients</th>
                    <th>Growth Rate</th>
                </tr>
            </thead>
            <tbody>
                @foreach($growthData as $index => $month)
                <tr>
                    <td>{{ $month['month'] }}</td>
                    <td>{{ $month['newClients'] }}</td>
                    <td>{{ $month['returningClients'] }}</td>
                    <td class="amount">{{ $month['totalClients'] }}</td>
                    <td>
                        @if($index > 0)
                            @php
                                $prevTotal = $growthData[$index-1]['totalClients'];
                                $currentTotal = $month['totalClients'];
                                $growthRate = $prevTotal > 0 ? round((($currentTotal - $prevTotal) / $prevTotal) * 100, 1) : 0;
                            @endphp
                            {{ $growthRate }}%
                        @else
                            —
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">Client Demographics - Age Distribution</div>
        <table>
            <thead>
                <tr>
                    <th>Age Group</th>
                    <th>Number of Clients</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                @foreach($demographicsData['ageGroups'] as $ageGroup => $count)
                <tr>
                    <td>{{ $ageGroup }}</td>
                    <td class="amount">{{ $count }}</td>
                    <td>
                        @if($demographicsData['totalClients'] > 0)
                            {{ round(($count / $demographicsData['totalClients']) * 100, 1) }}%
                        @else
                            0%
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">Client Demographics - Gender Distribution</div>
        <table>
            <thead>
                <tr>
                    <th>Gender</th>
                    <th>Number of Clients</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                @foreach($demographicsData['genderDistribution'] as $gender => $count)
                <tr>
                    <td>{{ $gender }}</td>
                    <td class="amount">{{ $count }}</td>
                    <td>
                        @if($demographicsData['totalClients'] > 0)
                            {{ round(($count / $demographicsData['totalClients']) * 100, 1) }}%
                        @else
                            0%
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">Client Retention Analysis</div>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Retention Rate</th>
                    <th>Performance</th>
                </tr>
            </thead>
            <tbody>
                @foreach($retentionData as $month)
                <tr>
                    <td>{{ $month['month'] }}</td>
                    <td class="amount">{{ $month['retentionRate'] }}%</td>
                    <td>
                        @if($month['retentionRate'] >= 70)
                            <span style="color: #28a745; font-weight: bold;">Excellent</span>
                        @elseif($month['retentionRate'] >= 50)
                            <span style="color: #ffc107; font-weight: bold;">Good</span>
                        @else
                            <span style="color: #dc3545; font-weight: bold;">Needs Improvement</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <p><strong>Generated automatically by MedSpa System</strong></p>
        <p>For questions about this client analytics report, please contact the administration.</p>
    </div>
</body>
</html>

