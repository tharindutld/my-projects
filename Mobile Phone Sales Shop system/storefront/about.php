<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | About Us</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #495057; }
        .page-title-bar { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 40px 0; margin-bottom: 40px; }
        .about-card { border: none; border-radius: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .feature-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(13, 110, 253, 0.1); color: #0d6efd; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 20px; }
        .lead-text { font-size: 1.15rem; line-height: 1.8; color: black; }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container text-center text-md-start">
        <h2 class="mb-2 fw-bold"><i class="fa-solid fa-circle-info me-3"></i>About Us</h2>
        <p class="mb-0 text-white">Learn more about Mobile Mart, our mission, and our dedication to providing quality mobile devices.</p>
    </div>
</div>

<div class="container mb-5">
    <div class="row g-4 align-items-center mb-5">
        <div class="col-lg-6">
            <h3 class="fw-bold text-dark mb-4">Our Story & Mission</h3>
            <p class="lead-text mb-4">
                Founded in 2026, <strong>Mobile Mart</strong> was established with a singular vision: to make the latest mobile technologies accessible, affordable, and transparent for everyone. We believe that a smartphone is more than just a gadget—it is an essential gateway to communication, work, learning, and self-expression.
            </p>
            <p class="text-secondary mb-4">
                We bridge the gap between premium brands and smart buyers. By curating a catalog of verified high-performance devices from top global manufacturers, we guarantee authenticity, warranty support, and stellar customer service with every checkout.
            </p>
        </div>
        <div class="col-lg-6">
            <div class="card about-card p-5 bg-white">
                <h4 class="fw-bold text-dark mb-4">Why Choose Us?</h4>
                <div class="d-flex align-items-start mb-4">
                    <div class="feature-icon me-3 flex-shrink-0"><i class="fa-solid fa-shield-check"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">100% Genuine Products</h6>
                        <p class="small text-muted mb-0">We work directly with manufacturer representatives to deliver authentic smartphones and accessories with official warranties.</p>
                    </div>
                </div>
                <div class="d-flex align-items-start mb-4">
                    <div class="feature-icon me-3 flex-shrink-0"><i class="fa-solid fa-truck-fast"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">Swift & Secure Delivery</h6>
                        <p class="small text-muted mb-0">Your package is handled with care and shipped securely using our trusted delivery partners straight to your doorstep.</p>
                    </div>
                </div>
                <div class="d-flex align-items-start">
                    <div class="feature-icon me-3 flex-shrink-0"><i class="fa-solid fa-crown"></i></div>
                    <div>
                        <h6 class="fw-bold text-dark mb-1">Exclusive Loyalty Perks</h6>
                        <p class="small text-muted mb-0">We believe in rewarding our community. Earn points on every purchase and climb up to unlock exclusive store benefits.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
</body>
</html>
