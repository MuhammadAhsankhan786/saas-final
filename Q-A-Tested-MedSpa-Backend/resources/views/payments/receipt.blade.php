<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt</title>
</head>
<body>
    <h2>Payment Receipt Test</h2>
    <p>ID: {{ $payment->id }}</p>
    <p>Date: {{ $payment->created_at->format('d M Y') }}</p>
    <p>Client: {{ optional($payment->client->clientUser)->name }}</p>
    <p>Amount: {{ $payment->amount }}</p>
</body>
</html>
