package com.fapor7.fms.notifications;

/**
 * Sends SMS messages through a configurable provider.
 */
public interface SmsSender {

    void send(String mobileNumber, String message);
}
