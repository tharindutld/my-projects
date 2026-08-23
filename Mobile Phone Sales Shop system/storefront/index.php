<?php
session_start();
error_reporting(0);
include('../config/db.php');
include_once('../includes/components/pricing_helper.php');

// Handle Add to Cart
if((isset($_POST['submit']) || isset($_POST['add_to_cart'])) && isset($_POST['pid'])) {
    processAddToCart($conn, $_POST['pid']);
}

// Handle Add to Wishlist
if((isset($_POST['submit']) || isset($_POST['add_to_wish'])) && isset($_POST['wpid'])) {
    processAddToWishlist($conn, $_POST['wpid']);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | Premium Collection</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary-color: #0d6efd;
            --accent-color: #f8f9fa;
            --text-dark: #212529;
            --card-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            background-image: 
                radial-gradient(at 0% 0%, rgba(13, 110, 253, 0.06) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.06) 0px, transparent 50%),
                radial-gradient(#cbd5e1 0.85px, transparent 0.85px);
            background-size: 100% 100%, 100% 100%, 20px 20px;
            color: var(--text-dark);
            min-height: 100vh;
        }

        /* Navbar Enhancements */
        .navbar-custom {
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            font-weight: 500;
        }

        /* Hero Carousel Styling */
        .hero-section {
            border-radius: 15px;
            overflow: hidden;
            box-shadow: var(--card-shadow);
        }
        .carousel-item {
            height: 450px;
            background-size: cover;
            background-position: center;
        }
        .carousel-caption-custom {
            background: rgba(255, 255, 255, 0.9);
            padding: 2rem;
            border-radius: 10px;
            color: #333;
            max-width: 400px;
            text-align: left;
            position: absolute;
            left: 5%;
            top: 20%;
        }

        /* Sidebar Brands */
        .brand-list-group .list-group-item {
            border: none;
            padding: 12px 20px;
            transition: all 0.3s;
            font-weight: 500;
        }
        .brand-list-group .list-group-item:hover {
            background-color: var(--primary-color);
            color: white !important;
            padding-left: 30px;
        }

        /* Product Cards */
        .product-card {
            border: none;
            border-radius: 12px;
            transition: transform 0.3s, box-shadow 0.3s;
            background: #fff;
            height: 100%;
            position: relative;
        }
        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
        .product-img-wrapper {
            position: relative;
            padding: 20px;
            background: #fbfbfb;
            border-radius: 12px 12px 0 0;
            overflow: hidden;
        }
        .product-img {
            max-height: 200px;
            object-fit: contain;
            width: 100%;
        }
        .wishlist-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: white;
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            color: #ff4757;
            transition: 0.3s;
            z-index: 10;
        }
        .wishlist-btn:hover {
            background: #ff4757;
            color: white;
        }
        
        /* Service Cards */
        .service-box {
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            background: white;
            border: 1px solid #eee;
            height: 100%;
        }
        .service-box i {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 15px;
        }

        .section-title {
            font-weight: 700;
            position: relative;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 50px;
            height: 3px;
            background: var(--primary-color);
        }
    </style>
</head>
<body>

<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="container my-5">
    <div class="row g-4">
        <div class="col-lg-3">
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="mb-0 fw-bold"><i class="fa-solid fa-layer-group me-2 text-primary"></i>All Brands</h5>
                </div>
                <div class="list-group brand-list-group">
                    <?php
                    $ret=mysqli_query($conn,"select * from tblbrand where Status='1'");
                    while ($row=mysqli_fetch_array($ret)) {
                    ?>
                        <a href="shop-mobile.php?bname=<?php echo urlencode($row['BrandName']);?>" class="list-group-item list-group-item-action text-muted">
                            <?php echo $row['BrandName'];?>
                        </a>
                    <?php } ?>
                </div>
            </div>
        </div>

        <div class="col-lg-9">
            <div id="heroCarousel" class="carousel slide hero-section mb-5" data-bs-ride="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('../assets/img/hero/hero-home-2-img-1.png');">
                        <div class="carousel-caption-custom d-none d-md-block">
                            <span class="badge bg-primary mb-2">New Arrivals</span>
                            <h2 class="fw-bold">Premium Collections</h2>
                            <p class="text-muted">Get amazing deals on the latest smartphones this week.</p>
                            <a href="shop-mobile.php" class="btn btn-primary px-4 py-2 rounded-pill">Shop Now</a>
                        </div>
                    </div>
                    <div class="carousel-item" style="background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('../assets/img/hero/hero-home-2-img-2.png');">
                        <div class="carousel-caption-custom d-none d-md-block">
                            <span class="badge bg-danger mb-2">Sale Offer</span>
                            <h2 class="fw-bold">Samsung S24 Series</h2>
                            <p class="text-muted">Experience the future of AI in your hand with 20% off.</p>
                            <a href="shop-mobile.php" class="btn btn-dark px-4 py-2 rounded-pill">View Deals</a>
                        </div>
                    </div>
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="section-title mb-0">Featured Mobiles</h4>
                <a href="shop-mobile.php" class="btn btn-outline-primary btn-sm rounded-pill">View All <i class="fa-solid fa-arrow-right ms-1"></i></a>
            </div>

   <div class="row row-cols-1 row-cols-md-3 g-4">
    <?php
    $count_query = mysqli_query($conn, "SELECT COUNT(DISTINCT tblproducts.ID) as total FROM tblproducts INNER JOIN tblproduct_variants ON tblproducts.ID = tblproduct_variants.ProductId INNER JOIN tblbrand ON tblproducts.BrandName = tblbrand.BrandName INNER JOIN tblcategory ON tblproducts.CategoryName = tblcategory.CategoryName WHERE tblproducts.Status='1' AND tblbrand.Status='1' AND tblcategory.Status='1'");
    $count_row = mysqli_fetch_assoc($count_query);
    $total_results = $count_row['total'];

    $limit = 8;
    $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
    if ($page < 1) $page = 1;
    $total_pages = ceil($total_results / $limit);
    if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
    $offset = ($page - 1) * $limit;

    $ret = mysqli_query($conn, "SELECT tblproducts.*, MIN(tblproduct_variants.Price) as Price, MIN(tblproduct_variants.Price) as MinPrice, MAX(tblproduct_variants.Price) as MaxPrice, SUM(tblproduct_variants.Stock) as TotalStock FROM tblproducts INNER JOIN tblproduct_variants ON tblproducts.ID = tblproduct_variants.ProductId INNER JOIN tblbrand ON tblproducts.BrandName = tblbrand.BrandName INNER JOIN tblcategory ON tblproducts.CategoryName = tblcategory.CategoryName WHERE tblproducts.Status='1' AND tblbrand.Status='1' AND tblcategory.Status='1' GROUP BY tblproducts.ID LIMIT $limit OFFSET $offset");
    
    while ($row = mysqli_fetch_array($ret)) {
        $total_stock = (int)($row['TotalStock'] ?? 0);
        $is_out_of_stock = ($total_stock <= 0);
    ?>
    <div class="col">
        <div class="card product-card shadow-sm">
            <form method="post" class="confirm-submit" data-confirm-message="Add this item to your wishlist?">
                <input type="hidden" name="wpid" value="<?php echo $row['ID'];?>">
                <button type="submit" name="add_to_wish" class="wishlist-btn" title="Add to Wishlist">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </form>

            <div class="product-img-wrapper position-relative">
                <?php if($is_out_of_stock): ?>
                    <span class="badge bg-danger position-absolute top-0 start-0 m-2 px-2 py-1 shadow-sm" style="z-index: 2;">Out of Stock</span>
                <?php endif; ?>
                <a href="single.php?pid=<?php echo $row['ID'];?>">
                    <img src="../uploads/products/<?php echo $row['Image1'];?>" class="product-img <?php echo $is_out_of_stock ? 'opacity-50' : ''; ?>" alt="<?php echo htmlspecialchars($row['ProductName']);?>">
                </a>
            </div>
            
            <div class="card-body text-center">
                <p class="text-uppercase text-muted small mb-1"><?php echo htmlspecialchars($row['BrandName']);?></p>
                <h6 class="fw-bold mb-2">
                    <a href="single.php?pid=<?php echo $row['ID'];?>" class="text-decoration-none text-dark">
                        <?php echo htmlspecialchars($row['ProductName']);?>
                    </a>
                </h6>
                <?php echo renderPriceHTML($row);?>
                
                <?php if($is_out_of_stock): ?>
                    <button type="button" class="btn btn-secondary w-100 rounded-pill" disabled>
                        <i class="fa-solid fa-ban me-2"></i>Out of Stock
                    </button>
                <?php else: ?>
                    <form method="post" class="confirm-submit" data-confirm-message="Add this mobile to your cart?">
                        <input type="hidden" name="pid" value="<?php echo $row['ID'];?>">
                        <button type="submit" name="add_to_cart" class="btn btn-dark w-100 rounded-pill">
                            <i class="fa-solid fa-cart-shopping me-2"></i>Add to Cart
                        </button>
                    </form>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <?php } ?>
</div>

<!-- Pagination Controls -->
<?php if ($total_pages > 1): ?>
<nav class="d-flex justify-content-center mt-5">
    <ul class="pagination pagination-custom gap-1">
        <!-- Previous Page -->
        <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
            <a class="page-link" href="?page=<?php echo $page - 1; ?>" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
        
        <!-- Page Numbers -->
        <?php for($i = 1; $i <= $total_pages; $i++): ?>
            <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                <a class="page-link" href="?page=<?php echo $i; ?>">
                    <?php echo $i; ?>
                </a>
            </li>
        <?php endfor; ?>
        
        <!-- Next Page -->
        <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
            <a class="page-link" href="?page=<?php echo $page + 1; ?>" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    </ul>
</nav>
<?php endif; ?>
        </div>
    </div>

    <div class="row mt-5 g-4">
        <div class="col-md-3">
            <div class="service-box shadow-sm">
                <i class="fa-solid fa-truck-fast"></i>
                <h6 class="fw-bold">Free Delivery</h6>
                <p class="small text-muted mb-0">For all orders over very lower cost</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="service-box shadow-sm">
                <i class="fa-solid fa-shield-halved"></i>
                <h6 class="fw-bold">Safe Payment</h6>
                <p class="small text-muted mb-0">100% secure checkout</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="service-box shadow-sm">
                <i class="fa-solid fa-arrows-rotate"></i>
                <h6 class="fw-bold">Easy Returns</h6>
                <p class="small text-muted mb-0">30 days money back</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="service-box shadow-sm">
                <i class="fa-solid fa-headset"></i>
                <h6 class="fw-bold">24/7 Support</h6>
                <p class="small text-muted mb-0">Dedicated help center</p>
            </div>
        </div>
    </div>
</div>

<?php include_once('../includes/storefront/front_footer.php');?>