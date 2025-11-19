<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Consent Form - {{ $consentForm->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #2c3e50;
        }
        .header p {
            margin: 5px 0;
            color: #7f8c8d;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
            color: #555;
        }
        .info-value {
            flex: 1;
            color: #333;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 11px;
        }
        .status-signed {
            background-color: #27ae60;
            color: white;
        }
        .status-pending {
            background-color: #f39c12;
            color: white;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #7f8c8d;
        }
        .signature-section {
            margin-top: 40px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 300px;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONSENT FORM</h1>
        <p>Medical Spa Consent Documentation</p>
        <p>Form ID: #{{ $consentForm->id }}</p>
    </div>

    <div class="section">
        <div class="section-title">Client Information</div>
        <div class="info-row">
            <div class="info-label">Client Name:</div>
            <div class="info-value">{{ $client->name ?? 'N/A' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">{{ $client->email ?? 'N/A' }}</div>
        </div>
        @if(isset($client->phone))
        <div class="info-row">
            <div class="info-label">Phone:</div>
            <div class="info-value">{{ $client->phone }}</div>
        </div>
        @endif
    </div>

    <div class="section">
        <div class="section-title">Service Information</div>
        <div class="info-row">
            <div class="info-label">Service:</div>
            <div class="info-value">{{ $service->name ?? 'N/A' }}</div>
        </div>
        @if(isset($service->description))
        <div class="info-row">
            <div class="info-label">Description:</div>
            <div class="info-value">{{ $service->description }}</div>
        </div>
        @endif
    </div>

    <div class="section">
        <div class="section-title">Form Details</div>
        <div class="info-row">
            <div class="info-label">Form Type:</div>
            <div class="info-value">{{ strtoupper($consentForm->form_type) }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">
                <span class="status-badge status-{{ $status }}">
                    {{ strtoupper($status) }}
                </span>
            </div>
        </div>
        <div class="info-row">
            <div class="info-label">Signed Date:</div>
            <div class="info-value">{{ $signedDate }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Expiry Date:</div>
            <div class="info-value">{{ $expiryDate }}</div>
        </div>
        @if($consentForm->digital_signature)
        <div class="info-row">
            <div class="info-label">Digital Signature:</div>
            <div class="info-value">✓ Signed</div>
        </div>
        @endif
    </div>

    @if($consentForm->file_url)
    <div class="section">
        <div class="section-title">Attached Document</div>
        <div class="info-row">
            <div class="info-label">File:</div>
            <div class="info-value">Document attached ({{ basename($consentForm->file_url) }})</div>
        </div>
    </div>
    @endif

    <div class="signature-section">
        <div class="section-title">Client Signature</div>
        @if($consentForm->date_signed)
            <p><strong>Signed:</strong> {{ $signedDate }}</p>
            <p><strong>Digital Signature:</strong> Verified</p>
        @else
            <p><em>This consent form has not been signed yet.</em></p>
        @endif
        <div class="signature-line"></div>
        <p style="margin-top: 5px;">Client Signature</p>
    </div>

    <div class="footer">
        <p>Generated on {{ date('F d, Y \a\t g:i A') }}</p>
        <p>This is an official document. Please retain for your records.</p>
    </div>
</body>
</html>

