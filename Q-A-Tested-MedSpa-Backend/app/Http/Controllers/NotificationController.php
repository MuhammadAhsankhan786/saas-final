<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // 🔹 Get all notifications (unread + read)
    public function index(Request $request)
    {
        return response()->json($request->user()->notifications);
    }

    // 🔹 Get only unread notifications
    public function unread(Request $request)
    {
        return response()->json($request->user()->unreadNotifications);
    }

    // 🔹 Mark specific notification as read
    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->find($id);

        if ($notification) {
            $notification->markAsRead();
            return response()->json(['message' => 'Notification marked as read']);
        }

        return response()->json(['message' => 'Notification not found'], 404);
    }
}
