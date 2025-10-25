<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inventory Report</title>
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
            font-size: 12px;
        }
        td, th { 
            border: 1px solid #ddd; 
            padding: 8px; 
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
        .low-stock {
            background-color: #fff3cd;
            color: #856404;
        }
        .out-of-stock {
            background-color: #f8d7da;
            color: #721c24;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .category-section {
            margin-bottom: 30px;
        }
        .category-title {
            background: #e9ecef;
            padding: 10px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MedSpa Inventory Report</h1>
        <p>Generated: {{ now()->format('d M Y h:i A') }}</p>
        <p>Complete Inventory Analysis</p>
    </div>
    
    <div class="summary-grid">
        <div class="summary-row">
            <div class="summary-cell">
                <div class="summary-value">{{ $totalProducts }}</div>
                <div class="summary-label">Total Products</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $activeProducts }}</div>
                <div class="summary-label">Active Products</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">{{ $lowStockProducts }}</div>
                <div class="summary-label">Low Stock Items</div>
            </div>
            <div class="summary-cell">
                <div class="summary-value">${{ number_format($totalValue, 2) }}</div>
                <div class="summary-label">Total Value</div>
            </div>
        </div>
    </div>
    
    <h3>Category Breakdown</h3>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Total Value</th>
                <th>Average Price</th>
            </tr>
        </thead>
        <tbody>
            @foreach($categoryBreakdown as $category)
            <tr>
                <td>{{ $category['category'] }}</td>
                <td>{{ $category['count'] }}</td>
                <td class="amount">${{ number_format($category['total_value'], 2) }}</td>
                <td>${{ number_format($category['avg_price'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <h3>Product Details</h3>
    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Min Stock</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Location</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
            <tr class="@if($product->current_stock == 0) out-of-stock @elseif($product->current_stock <= $product->minimum_stock) low-stock @endif">
                <td>{{ $product->sku }}</td>
                <td>{{ $product->name }}</td>
                <td>{{ $product->category ?: 'Uncategorized' }}</td>
                <td>{{ $product->current_stock }}</td>
                <td>{{ $product->minimum_stock }}</td>
                <td>${{ number_format($product->price, 2) }}</td>
                <td class="amount">${{ number_format($product->current_stock * $product->price, 2) }}</td>
                <td>{{ $product->location ? $product->location->name : 'N/A' }}</td>
                <td>
                    @if($product->current_stock == 0)
                        <span style="color: #721c24; font-weight: bold;">Out of Stock</span>
                    @elseif($product->current_stock <= $product->minimum_stock)
                        <span style="color: #856404; font-weight: bold;">Low Stock</span>
                    @else
                        <span style="color: #155724; font-weight: bold;">In Stock</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        <p><strong>Generated automatically by MedSpa System</strong></p>
        <p>For questions about this inventory report, please contact the administration.</p>
    </div>
</body>
</html>

