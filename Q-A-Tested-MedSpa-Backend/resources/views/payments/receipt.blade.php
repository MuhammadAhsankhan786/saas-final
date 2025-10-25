<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt</title>
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
        }
        .header p {
            margin: 5px 0;
            color: #666;
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
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
        }
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .status.completed {
            background: #d4edda;
            color: #155724;
        }
        .status.pending {
            background: #fff3cd;
            color: #856404;
        }
        .status.failed {
            background: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedSpa Payment Receipt</h1>
        <p>Receipt #{{ $payment->id }}</p>
        <p>Generated: {{ now()->format('d M Y h:i A') }}</p>
    </div>
    
    <table>
        <tr>
            <th>Client Name</th>
            <td>{{ $payment->client->clientUser->name ?? $payment->client->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <th>Client Email</th>
            <td>{{ $payment->client->email ?? 'N/A' }}</td>
        </tr>
        <tr>
            <th>Service/Package</th>
            <td>{{ $payment->package->name ?? $payment->appointment->service->name ?? 'General Service' }}</td>
        </tr>
        <tr>
            <th>Amount</th>
            <td class="amount">${{ number_format($payment->amount, 2) }}</td>
        </tr>
        <tr>
            <th>Payment Method</th>
            <td>{{ ucfirst($payment->payment_method) }}</td>
        </tr>
        <tr>
            <th>Status</th>
            <td>
                <span class="status {{ $payment->status }}">
                    {{ ucfirst($payment->status) }}
                </span>
            </td>
        </tr>
        <tr>
            <th>Tips</th>
            <td>${{ number_format($payment->tips ?? 0, 2) }}</td>
        </tr>
        <tr>
            <th>Commission</th>
            <td>${{ number_format($payment->commission ?? 0, 2) }}</td>
        </tr>
        <tr>
            <th>Payment Date</th>
            <td>{{ $payment->created_at->format('d M Y h:i A') }}</td>
        </tr>
    </table>
    
    <div class="footer">
        <p><strong>Thank you for choosing MedSpa!</strong></p>
        <p>For any questions about this receipt, please contact us.</p>
    </div>
</body>
</html>
