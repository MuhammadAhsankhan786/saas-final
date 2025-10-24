<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // ✅ Show all products
    public function index()
    {
        return Product::all();
    }

    // ✅ Create new product
    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'sku'            => 'required|string|unique:products',
            'stock'          => 'required|integer|min:0',
            'minimum_stock'  => 'required|integer|min:0',
            'price'          => 'required|numeric|min:0',
        ]);

        return Product::create($request->all());
    }

    // ✅ Show single product
    public function show(Product $product)
    {
        return $product;
    }

    // ✅ Update product
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name'          => 'string|max:255',
            'sku'           => 'string|unique:products,sku,' . $product->id,
            'stock'         => 'integer|min:0',
            'minimum_stock' => 'integer|min:0',
            'price'         => 'numeric|min:0',
        ]);

        $product->update($request->all());
        return $product;
    }

    // ✅ Delete product
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
