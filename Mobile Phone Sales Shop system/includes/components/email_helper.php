<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/../../config/email.php';
require_once __DIR__ . '/../PHPMailer/Exception.php';
require_once __DIR__ . '/../PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/SMTP.php';

/**
 * Sends an OTP email to the user using PHPMailer SMTP settings.
 * If SMTP is disabled or delivery fails, returns false so profile.php can fallback gracefully.
 * 
 * @param string $toEmail
 * @param string $otpCode
 * @return bool
 */
function sendOTPEmail($toEmail, $otpCode) {
    if (!defined('SMTP_ENABLED') || !SMTP_ENABLED) {
        return false; // Fallback to local dev display
    }

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        
        if (SMTP_SECURE === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } elseif (SMTP_SECURE === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = '';
            $mail->SMTPAutoTLS = false;
        }
        
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($toEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Mobile Mart - Password Change OTP Verification';
        
        // Custom Styled Email HTML
        $mail->Body    = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset OTP</title>
            <style>
                body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f6; }
                .header { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                .content p { margin: 0 0 20px; font-size: 15px; }
                .otp-box { background-color: #f1f3f5; border: 1px dashed #ced4da; border-radius: 8px; padding: 15px; text-align: center; font-size: 32px; font-weight: 700; color: #0d6efd; letter-spacing: 5px; margin: 25px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #eef2f6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Mobile Mart Support</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to change the password for your Mobile Mart customer account. Please use the following One-Time Password (OTP) to verify your request:</p>
                    <div class="otp-box">' . $otpCode . '</div>
                    <p>This code is valid for <strong>5 minutes</strong>. If you did not initiate this request, please change your password immediately or contact our support team.</p>
                    <p>Best regards,<br>Mobile Mart Team</p>
                </div>
                <div class="footer">
                    &copy; ' . date('Y') . ' Mobile Mart. All rights reserved.<br>
                    123 Tech Street, Colombo, Sri Lanka.
                </div>
            </div>
        </body>
        </html>
        ';

        // Plain text fallback
        $mail->AltBody = "Hello,\n\nWe received a request to change your Mobile Mart account password. Your OTP code is: " . $otpCode . "\n\nThis code is valid for 5 minutes. If you did not request this, please secure your account immediately.\n\nBest regards,\nMobile Mart Team";

        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Sends an Order Confirmation email.
 */
function sendOrderConfirmationEmail($toEmail, $orderNumber, $totalAmount) {
    if (!defined('SMTP_ENABLED') || !SMTP_ENABLED) {
        return false;
    }
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        if (SMTP_SECURE === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } elseif (SMTP_SECURE === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = '';
            $mail->SMTPAutoTLS = false;
        }
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($toEmail);
        $mail->isHTML(true);
        $mail->Subject = 'Mobile Mart - Order Confirmation #' . $orderNumber;
        
        $mail->Body = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
            <style>
                body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f6; }
                .header { background: linear-gradient(135deg, #198754 0%, #146c43 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                .content p { margin: 0 0 20px; font-size: 15px; }
                .details-box { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #dee2e6; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #eef2f6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Thank You For Your Order!</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We are excited to confirm that we have received your order. We are now preparing your items for shipping.</p>
                    <div class="details-box">
                        <strong>Order Number:</strong> ' . htmlspecialchars($orderNumber) . '<br>
                        <strong>Total Amount:</strong> Rs. ' . number_format($totalAmount, 2) . '<br>
                        <strong>Order Status:</strong> Pending / Processing
                    </div>
                    <p>You can track the status of your order at any time in your customer portal under "My Orders".</p>
                    <p>Best regards,<br>Mobile Mart Team</p>
                </div>
                <div class="footer">
                    &copy; ' . date('Y') . ' Mobile Mart. All rights reserved.<br>
                    123 Tech Street, Colombo, Sri Lanka.
                </div>
            </div>
        </body>
        </html>';
        
        $mail->AltBody = "Hello,\n\nThank you for your order! We have successfully received Order #" . $orderNumber . " for a total of Rs. " . number_format($totalAmount, 2) . ". We are currently processing it.\n\nBest regards,\nMobile Mart Team";
        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Sends a Delivery Status Update email.
 */
function sendDeliveryStatusEmail($toEmail, $orderNumber, $deliveryStatus) {
    if (!defined('SMTP_ENABLED') || !SMTP_ENABLED) {
        return false;
    }
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        if (SMTP_SECURE === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } elseif (SMTP_SECURE === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = '';
            $mail->SMTPAutoTLS = false;
        }
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($toEmail);
        $mail->isHTML(true);
        $mail->Subject = 'Mobile Mart - Delivery Update for Order #' . $orderNumber;
        
        $mail->Body = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Delivery Status Update</title>
            <style>
                body { font-family: \'Inter\', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f6; }
                .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                .content p { margin: 0 0 20px; font-size: 15px; }
                .status-box { background-color: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; border-radius: 8px; padding: 15px; text-align: center; font-size: 20px; font-weight: 700; margin: 25px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #eef2f6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Delivery Status Update</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We are writing to let you know that the delivery status for your Order <strong>#' . htmlspecialchars($orderNumber) . '</strong> has been updated:</p>
                    <div class="status-box">' . htmlspecialchars($deliveryStatus) . '</div>
                    <p>You can view full details of your shipment and invoice in the customer portal.</p>
                    <p>Best regards,<br>Mobile Mart Team</p>
                </div>
                <div class="footer">
                    &copy; ' . date('Y') . ' Mobile Mart. All rights reserved.<br>
                    123 Tech Street, Colombo, Sri Lanka.
                </div>
            </div>
        </body>
        </html>';
        
        $mail->AltBody = "Hello,\n\nThe delivery status for Order #" . $orderNumber . " has been updated to: " . $deliveryStatus . ".\n\nBest regards,\nMobile Mart Team";
        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
}
?>
