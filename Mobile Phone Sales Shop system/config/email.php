<?php
/**
 * SMTP Email Configurations for PHPMailer
 * Edit these settings to match your SMTP service.
 */

// Toggle SMTP delivery (Set to true to use SMTP; if false, it will use the local dev alert fallback)
define('SMTP_ENABLED', true); 

// SMTP Server Settings
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');                        // Encryption: 'tls', 'ssl', or empty
define('SMTP_USER', 'tharindutld@gmail.com');
define('SMTP_PASS', 'tfskqgwjurlqohbq');            // SMTP password

// Sender Info
define('SMTP_FROM_EMAIL', 'tharindutld@gmail.com');
define('SMTP_FROM_NAME', 'Mobile Mart Support');
?>
