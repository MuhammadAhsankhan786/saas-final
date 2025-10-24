<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;

class SmsChannel
{
    public function send($notifiable, Notification $notification)
    {
        if (! method_exists($notification, 'toSms')) {
            return;
        }

        return $notification->toSms($notifiable);
    }
}
