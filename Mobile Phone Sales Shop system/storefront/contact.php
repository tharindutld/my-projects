<?php
ob_start();
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
include('../config/email.php');

// Prevent browser caching of the page so that refresh fetches a clean state
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require '../includes/PHPMailer/Exception.php';
require '../includes/PHPMailer/PHPMailer.php';
require '../includes/PHPMailer/SMTP.php';

if (isset($_POST['submit_message'])) {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $subject = trim($_POST['subject']);
    $message = trim($_POST['message']);

    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        $_SESSION['contact_error'] = "All fields are required. Please fill in all fields.";
        $_SESSION['contact_inputs'] = $_POST;
        header("Location: contact.php");
        exit();
    } elseif (!preg_match("/^[a-zA-Z\s]+$/", $name)) {
        $_SESSION['contact_error'] = "Your name can only contain letters and spaces (no numbers or special characters).";
        $_SESSION['contact_inputs'] = $_POST;
        header("Location: contact.php");
        exit();
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['contact_error'] = "Please enter a valid email address.";
        $_SESSION['contact_inputs'] = $_POST;
        header("Location: contact.php");
        exit();
    } elseif (strlen($subject) <= 3) {
        $_SESSION['contact_error'] = "Subject must be greater than 3 characters.";
        $_SESSION['contact_inputs'] = $_POST;
        header("Location: contact.php");
        exit();
    } elseif (strlen($message) <= 5) {
        $_SESSION['contact_error'] = "Message must be greater than 5 characters.";
        $_SESSION['contact_inputs'] = $_POST;
        header("Location: contact.php");
        exit();
    } else {
        if (defined('SMTP_ENABLED') && SMTP_ENABLED) {
            $mail = new PHPMailer(true);
            try {
                // Server settings
                $mail->isSMTP();
                $mail->Host       = SMTP_HOST;
                $mail->SMTPAuth   = true;
                $mail->Username   = SMTP_USER;
                $mail->Password   = SMTP_PASS;
                $mail->SMTPSecure = (SMTP_SECURE === 'ssl') ? PHPMailer::ENCRYPTION_SMTPS : (SMTP_SECURE === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : '');
                $mail->Port       = SMTP_PORT;

                // Recipients
                $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
                $mail->addAddress(SMTP_FROM_EMAIL); // Sends the email to support/owner inbox
                $mail->addReplyTo($email, $name);

                // Content
                $mail->isHTML(true);
                $mail->Subject = "Contact Form Inquiry: " . $subject;
                $mail->Body    = "
                    <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px; color: #334155;'>
                        <h2 style='color: #0d6efd; margin-top: 0;'>New Contact Inquiry</h2>
                        <hr style='border: none; border-top: 1px solid #e2e8f0; margin-bottom: 20px;'>
                        <p><strong>Customer Name:</strong> {$name}</p>
                        <p><strong>Customer Email:</strong> <a href='mailto:{$email}'>{$email}</a></p>
                        <p><strong>Subject:</strong> {$subject}</p>
                        <p><strong>Message:</strong></p>
                        <blockquote style='background: #f8fafc; padding: 15px; border-left: 4px solid #cbd5e1; margin: 0;'>
                            " . nl2br(htmlspecialchars($message)) . "
                        </blockquote>
                    </div>
                ";
                $mail->AltBody = "New Contact Inquiry\n\nName: {$name}\nEmail: {$email}\nSubject: {$subject}\nMessage:\n{$message}";

                $mail->send();
                $_SESSION['contact_success'] = "Thank you, $name! Your message has been sent successfully. We will get back to you soon.";
                header("Location: contact.php");
                exit();
            } catch (Exception $e) {
                $_SESSION['contact_error'] = "Inquiry could not be sent via email. Error: {$mail->ErrorInfo}";
                $_SESSION['contact_inputs'] = $_POST;
                header("Location: contact.php");
                exit();
            }
        } else {
            // Simulation fallback
            $_SESSION['contact_success'] = "Thank you, $name! Your message has been validated successfully (Dev Simulation Mode: SMTP is currently disabled).";
            header("Location: contact.php");
            exit();
        }
    }
}

$success_msg = isset($_SESSION['contact_success']) ? $_SESSION['contact_success'] : '';
$error_msg = isset($_SESSION['contact_error']) ? $_SESSION['contact_error'] : '';
$inputs = isset($_SESSION['contact_inputs']) ? $_SESSION['contact_inputs'] : [];

unset($_SESSION['contact_success']);
unset($_SESSION['contact_error']);
unset($_SESSION['contact_inputs']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | Contact Us</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #495057; }
        .page-title-bar { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 40px 0; margin-bottom: 40px; }
        .contact-card { border: none; border-radius: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.05); }
        .info-item { display: flex; align-items: center; margin-bottom: 25px; }
        .info-icon { width: 50px; height: 50px; border-radius: 50%; background: rgba(13, 110, 253, 0.1); color: #0d6efd; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-right: 20px; transition: all 0.3s; }
        .info-item:hover .info-icon { background: #0d6efd; color: white; transform: scale(1.1); }
        .social-link { width: 40px; height: 40px; border-radius: 50%; background: #f1f3f5; color: #495057; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; transition: all 0.3s; text-decoration: none; }
        .social-link:hover { background: #0d6efd; color: white; transform: translateY(-3px); }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container text-center text-md-start">
        <h2 class="mb-2 fw-bold"><i class="fa-solid fa-paper-plane me-3"></i>Contact Us</h2>
        <p class="mb-0 text-white-50">Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.</p>
    </div>
</div>

<div class="container mb-5">
    <div class="row g-4">
        <!-- Contact Form -->
        <div class="col-lg-7">
            <div class="card contact-card p-4 p-md-5 bg-white">
                <h3 class="fw-bold text-dark mb-4">Send a Message</h3>
                
                <?php if ($success_msg): ?>
                    <div class="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4 border-0 shadow-sm rounded-3" role="alert">
                        <i class="fa-solid fa-circle-check fs-4 me-3 text-success"></i>
                        <div><?php echo $success_msg; ?></div>
                        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>
                
                <?php if ($error_msg): ?>
                    <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4 border-0 shadow-sm rounded-3" role="alert">
                        <i class="fa-solid fa-circle-exclamation fs-4 me-3 text-danger"></i>
                        <div><?php echo $error_msg; ?></div>
                        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>

                <form method="post" action="contact.php" class="needs-validation" novalidate>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold text-secondary">Your Name</label>
                            <input type="text" class="form-control" name="name" placeholder="John Doe" required pattern="^[a-zA-Z\s]+$" title="Name must only contain letters and spaces." value="<?php echo isset($inputs['name']) ? htmlspecialchars($inputs['name']) : ''; ?>">
                            <div class="invalid-feedback">Your name can only contain letters and spaces (no numbers or special characters).</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold text-secondary">Email Address</label>
                            <input type="email" class="form-control" name="email" placeholder="john@example.com" required value="<?php echo isset($inputs['email']) ? htmlspecialchars($inputs['email']) : ''; ?>">
                            <div class="invalid-feedback">Please enter a valid email address.</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold text-secondary">Subject</label>
                            <input type="text" class="form-control" name="subject" placeholder="How can we help you?" required minlength="4" value="<?php echo isset($inputs['subject']) ? htmlspecialchars($inputs['subject']) : ''; ?>">
                            <div class="invalid-feedback">Please provide a subject (greater than 3 characters).</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold text-secondary">Message</label>
                            <textarea class="form-control" name="message" rows="5" placeholder="Type your message here..." required minlength="6"><?php echo isset($inputs['message']) ? htmlspecialchars($inputs['message']) : ''; ?></textarea>
                            <div class="invalid-feedback">Please type your message (greater than 5 characters).</div>
                        </div>
                        <div class="col-12 mt-4">
                            <button type="submit" name="submit_message" class="btn btn-primary btn-lg rounded-pill px-5">
                                <i class="fa-solid fa-paper-plane me-2"></i>Send Message
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Contact Info -->
        <div class="col-lg-5">
            <div class="card contact-card p-4 p-md-5 bg-white h-100">
                <h3 class="fw-bold text-dark mb-4">Contact Information</h3>
                <p class="text-muted mb-4">Feel free to reach out to us using any of the contact methods below or visit our brick-and-mortar storefront.</p>
                
                <div class="info-item">
                    <div class="info-icon"><i class="fa-solid fa-location-dot"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">Our Location</h6>
                        <p class="mb-0 text-secondary">123 Tech Street, Colombo, Sri Lanka</p>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-icon"><i class="fa-solid fa-phone"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">Phone Number</h6>
                        <p class="mb-0 text-secondary">+94 11 234 5678</p>
                    </div>
                </div>
                
                <div class="info-item">
                    <div class="info-icon"><i class="fa-solid fa-envelope"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">Email Address</h6>
                        <p class="mb-0 text-secondary">support@mobilestore.com</p>
                    </div>
                </div>

                <div class="info-item mb-4">
                    <div class="info-icon"><i class="fa-solid fa-clock"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">Working Hours</h6>
                        <p class="mb-0 text-secondary">Monday - Saturday: 9:00 AM - 6:00 PM</p>
                        <p class="mb-0 text-secondary">Sunday: Closed</p>
                    </div>
                </div>

                <hr class="text-muted opacity-25 my-4">

                <h5 class="fw-bold text-dark mb-3">Connect With Us</h5>
                <div>
                    <a href="#" class="social-link"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="social-link"><i class="fa-brands fa-twitter"></i></a>
                    <a href="#" class="social-link"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="social-link"><i class="fa-brands fa-linkedin-in"></i></a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
<script>
document.addEventListener("DOMContentLoaded", function() {
    // Automatically close success or error alerts after 5 seconds
    setTimeout(function() {
        let alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            let bsAlert = bootstrap.Alert.getInstance(alert);
            if (!bsAlert) {
                bsAlert = new bootstrap.Alert(alert);
            }
            bsAlert.close();
        });
    }, 5000);

    // Bootstrap validation script
    let forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
});
</script>
</body>
</html>
