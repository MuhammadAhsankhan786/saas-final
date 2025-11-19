<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    // 🔹 Register
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'nullable|in:admin,provider,reception,client',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role ?? 'client', // default role
        ]);

        // JWT token generate with api guard
        $token = auth('api')->login($user);

        return $this->respondWithToken($token);
    }

    // 🔹 Login
    public function login(Request $request)
    {
        $credentials = $request->only(['email', 'password']);

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        return $this->respondWithToken($token);
    }

    // 🔹 Current User
    public function me()
    {
        try {
            $user = auth('api')->user();

            if (!$user) {
                \Log::warning('AuthController@me: User not found after authentication');
                return response()->json(['error' => 'Unauthorized', 'message' => 'Unauthenticated.'], 401);
            }

            return response()->json($user);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException $e) {
            \Log::warning('AuthController@me: Token expired', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Token expired', 'message' => 'Unauthenticated.'], 401);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException $e) {
            \Log::warning('AuthController@me: Token invalid', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Token invalid', 'message' => 'Unauthenticated.'], 401);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException $e) {
            // Covers cases like token absent/could not be parsed
            \Log::warning('AuthController@me: JWT exception', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Unauthorized', 'message' => 'Unauthenticated.'], 401);
        } catch (\Throwable $e) {
            // Avoid leaking internals; normalize to 401 for auth-related failures
            \Log::error('AuthController@me: Unexpected error', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Unauthorized', 'message' => 'Unauthenticated.'], 401);
        }
    }

    // 🔹 Logout
    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    // 🔹 Refresh token
    public function refresh()
    {
        try {
            $token = auth('api')->refresh();
            return $this->respondWithToken($token);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException $e) {
            \Log::warning('AuthController@refresh: Token expired', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Token expired', 'message' => 'Token has expired and cannot be refreshed. Please login again.'], 401);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException $e) {
            \Log::warning('AuthController@refresh: Token invalid', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Token invalid', 'message' => 'Invalid token. Please login again.'], 401);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException $e) {
            \Log::warning('AuthController@refresh: JWT exception', ['exception' => $e->getMessage()]);
            return response()->json(['error' => 'Token error', 'message' => 'Unable to refresh token. Please login again.'], 401);
        } catch (\Throwable $e) {
            \Log::error('AuthController@refresh: Unexpected error', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Refresh failed', 'message' => 'Unable to refresh token. Please login again.'], 401);
        }
    }

    // 🔹 Helper for token response
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token' => $token, // Also include 'token' for compatibility
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
            'user' => auth('api')->user() // Include user data in login response
        ]);
    }
}
