<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

if(!isset($_GET['pid'])) {
    header("Location: shop-mobile.php");
    exit();
}

include('../config/db.php');
include_once('../includes/components/pricing_helper.php');
$pid = (int)$_GET['pid'];

// Handle Add to Cart
if((isset($_POST['add_to_cart']) || isset($_POST['submit'])) && isset($_POST['vid'])) {
    $qty = isset($_POST['qty']) ? (int)$_POST['qty'] : 1;
    $res = processAddToCart($conn, $pid, $_POST['vid'], $qty, 'cart.php');
    if ($res === false) {
        header("Location: single.php?pid=$pid");
        exit();
    }
}

// Handle Add to Wishlist
if((isset($_POST['add_to_wish']) || isset($_POST['submit'])) && (isset($_POST['wpid']) || isset($_POST['pid']))) {
    $wpid = isset($_POST['wpid']) ? $_POST['wpid'] : $pid;
    processAddToWishlist($conn, $wpid);
}

$ret     = mysqli_query($conn, "SELECT tblproducts.* FROM tblproducts INNER JOIN tblbrand ON tblproducts.BrandName = tblbrand.BrandName INNER JOIN tblcategory ON tblproducts.CategoryName = tblcategory.CategoryName WHERE tblproducts.ID='$pid' AND tblproducts.Status='1' AND tblbrand.Status='1' AND tblcategory.Status='1'");
$product = mysqli_fetch_array($ret);

if(!$product) {
    header("Location: shop-mobile.php");
    exit();
}

// Fetch variants
$variants = [];
$variants_q = mysqli_query($conn, "SELECT * FROM tblproduct_variants WHERE ProductId='$pid'");
while ($v = mysqli_fetch_assoc($variants_q)) {
    $v['DiscountedPrice'] = getDiscountedPrice(array_merge($product, ['Price' => $v['Price']]));
    $variants[] = $v;
}

if (empty($variants)) {
    $_SESSION['error_msg'] = "This product is currently out of stock or unavailable.";
    header("Location: shop-mobile.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($product['ProductName']); ?> | Mobile Store</title>
    
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
            background-color: #fcfcfc;
            color: var(--text-dark);
        }

        /* Navbar Enhancements */
        .navbar-custom {
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            font-weight: 500;
        }

        /* Product Gallery */
        .product-gallery {
            background: #fff;
            padding: 30px;
            border-radius: 15px;
            box-shadow: var(--card-shadow);
        }
        .main-image {
            width: 100%;
            height: 400px;
            object-fit: contain;
            margin-bottom: 20px;
        }
        .thumbnail {
            width: 80px;
            height: 80px;
            object-fit: contain;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.3s;
            background: #fbfbfb;
        }
        .thumbnail:hover, .thumbnail.active {
            border-color: var(--primary-color);
        }

        /* Product Details */
        .product-details {
            background: #fff;
            padding: 30px;
            border-radius: 15px;
            box-shadow: var(--card-shadow);
            height: 100%;
        }
        .price-tag {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary-color);
        }
        .stock-badge {
            font-size: 0.9rem;
            padding: 8px 15px;
            border-radius: 20px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
        }
        .feature-list li i {
            color: var(--primary-color);
            margin-right: 15px;
            width: 20px;
            text-align: center;
        }

        .action-buttons button {
            padding: 12px 30px;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 30px;
        }



    </style>
</head>
<body>

<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="container my-5">
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php" class="text-decoration-none">Home</a></li>
            <li class="breadcrumb-item"><a href="shop-mobile.php" class="text-decoration-none">Shop</a></li>
            <li class="breadcrumb-item active" aria-current="page"><?php echo htmlspecialchars($product['ProductName']); ?></li>
        </ol>
    </nav>

    <div class="row g-5">
        <div class="col-lg-5">
            <div class="product-gallery">
                <img src="../uploads/products/<?php echo htmlspecialchars($product['Image1']); ?>" id="mainImg" class="main-image" alt="<?php echo htmlspecialchars($product['ProductName']); ?>">
                
                <div class="d-flex justify-content-center gap-3 mt-4">
                    <img src="../uploads/products/<?php echo htmlspecialchars($product['Image1']); ?>" class="thumbnail active" onclick="changeImage(this.src)">
                    <?php if(!empty($product['Image2'])): ?>
                        <img src="../uploads/products/<?php echo htmlspecialchars($product['Image2']); ?>" class="thumbnail" onclick="changeImage(this.src)">
                    <?php endif; ?>
                    <?php if(!empty($product['Image3'])): ?>
                        <img src="../uploads/products/<?php echo htmlspecialchars($product['Image3']); ?>" class="thumbnail" onclick="changeImage(this.src)">
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div class="col-lg-7">
            <div class="product-details">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <span class="badge bg-secondary mb-2"><?php echo htmlspecialchars($product['BrandName']); ?></span>
                        <h2 class="fw-bold mb-1"><?php echo htmlspecialchars($product['ProductName']); ?></h2>
                    </div>
                    <div id="stockBadgeArea">
                        <?php foreach ($variants as $index => $v): ?>
                            <div class="variant-stock-block" id="stock-block-<?php echo $index; ?>" style="display: <?php echo $index === 0 ? 'block' : 'none'; ?>;">
                                <?php if($v['Stock'] > 0): ?>
                                    <span class="badge bg-success stock-badge">In Stock (<?php echo $v['Stock']; ?>)</span>
                                <?php else: ?>
                                    <span class="badge bg-danger stock-badge">Out of Stock</span>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div id="priceDisplayArea" class="my-3">
                    <?php foreach ($variants as $index => $v): ?>
                        <div class="variant-price-block" id="price-block-<?php echo $index; ?>" style="display: <?php echo $index === 0 ? 'block' : 'none'; ?>;">
                            <?php echo renderPriceHTML(array_merge($product, ['Price' => $v['Price']]), 'large'); ?>
                        </div>
                    <?php endforeach; ?>
                </div>

                <div class="mb-4">
                    <label class="form-label fw-bold text-secondary">Select Configuration</label>
                    <select class="form-select form-select-lg rounded-3 border-2" id="variantSelector" required onchange="updateVariantDetails()">
                        <?php foreach ($variants as $index => $v): 
                            $optLabel = htmlspecialchars($v['Color']);
                            if (!empty($v['RAM']) || !empty($v['ROM'])) {
                                $optLabel .= " (" . htmlspecialchars($v['ROM']) . " / " . htmlspecialchars($v['RAM']) . ")";
                            }
                            $optLabel .= " - Rs. " . number_format($v['DiscountedPrice'], 2);
                            if ($v['Stock'] <= 0) {
                                $optLabel .= " [Out of Stock]";
                            }
                        ?>
                            <option value="<?php echo $v['ID']; ?>" data-index="<?php echo $index; ?>">
                                <?php echo $optLabel; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <ul class="feature-list mb-5">
                    <li id="spec-color-item"><i class="fa-solid fa-palette"></i> <strong>Color:</strong> <span class="ms-2" id="spec-color-val"></span></li>
                    <li id="spec-ram-item"><i class="fa-solid fa-memory"></i> <strong>RAM:</strong> <span class="ms-2" id="spec-ram-val"></span></li>
                    <li id="spec-rom-item"><i class="fa-solid fa-hard-drive"></i> <strong>Storage:</strong> <span class="ms-2" id="spec-rom-val"></span></li>
                    <?php if(!empty($product['SimType'])): ?>
                        <li><i class="fa-solid fa-sim-card"></i> <strong>SIM Support:</strong> <span class="ms-2"><?php echo htmlspecialchars($product['SimType']); ?></span></li>
                    <?php endif; ?>
                    <?php if(!empty($product['Processor'])): ?>
                        <li><i class="fa-solid fa-microchip"></i> <strong>Processor:</strong> <span class="ms-2"><?php echo htmlspecialchars($product['Processor']); ?></span></li>
                    <?php endif; ?>
                    <?php if(!empty($product['Display'])): ?>
                        <li><i class="fa-solid fa-mobile-screen"></i> <strong>Display:</strong> <span class="ms-2"><?php echo htmlspecialchars($product['Display']); ?></span></li>
                    <?php endif; ?>
                    <?php if(!empty($product['FrontCamera'])): ?>
                        <li><i class="fa-solid fa-camera"></i> <strong>Camera:</strong> <span class="ms-2"><?php echo htmlspecialchars($product['FrontCamera']); ?></span></li>
                    <?php endif; ?>
                </ul>

                <div class="d-flex gap-3 action-buttons">
                    <form method="post" class="flex-grow-1 confirm-submit d-flex gap-2" data-confirm-message="Add this mobile to your cart?">
                        <input type="hidden" name="vid" id="hiddenVidInput" value="<?php echo $variants[0]['ID'] ?? 0; ?>">
                        <div style="width: 90px;">
                            <input type="number" name="qty" id="qtyInput" class="form-control" value="1" min="1" max="<?php echo htmlspecialchars($variants[0]['Stock'] ?? 0); ?>" required>
                        </div>
                        <button type="submit" name="add_to_cart" id="addToCartBtn" class="btn btn-primary flex-grow-1 shadow-sm" <?php echo (($variants[0]['Stock'] ?? 0) <= 0) ? 'disabled' : ''; ?>>
                            <i class="fa-solid fa-cart-shopping me-2"></i>Add to Cart
                        </button>
                    </form>
                    <form method="post" class="confirm-submit" data-confirm-message="Add this mobile to your wishlist?">
                        <input type="hidden" name="wpid" value="<?php echo $pid; ?>">
                        <button type="submit" name="add_to_wish" class="btn btn-outline-danger shadow-sm px-4">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="row mt-5">
        <div class="col-12">
            <div class="card border-0 shadow-sm rounded-4 p-4">
                <ul class="nav nav-tabs nav-fill mb-4" id="productTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active fw-bold" id="features-tab" data-bs-toggle="tab" data-bs-target="#features" type="button" role="tab">Key Features</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link fw-bold" id="specs-tab" data-bs-toggle="tab" data-bs-target="#specs" type="button" role="tab">Specifications</button>
                    </li>
                </ul>
                <div class="tab-content" id="productTabsContent">
                    <div class="tab-pane fade show active p-3" id="features" role="tabpanel">
                        <?php echo nl2br(htmlspecialchars($product['KeyFeature'] ?? 'No key features provided.')); ?>
                    </div>
                    <div class="tab-pane fade p-3" id="specs" role="tabpanel">
                        <?php echo nl2br(htmlspecialchars($product['Specification'] ?? 'No specifications provided.')); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
<script>
    function changeImage(src) {
        document.getElementById('mainImg').src = src;
        document.querySelectorAll('.thumbnail').forEach(el => el.classList.remove('active'));
        event.target.classList.add('active');
    }

    const variants = <?php echo json_encode($variants); ?>;
    
    function updateVariantDetails() {
        const selector = document.getElementById('variantSelector');
        if (!selector) return;
        const selectedIndex = selector.options[selector.selectedIndex].getAttribute('data-index');
        const selectedVariant = variants[selectedIndex];
        
        // Show the correct price block
        document.querySelectorAll('.variant-price-block').forEach((el, idx) => {
            el.style.display = (idx == selectedIndex) ? 'block' : 'none';
        });
        
        // Show the correct stock block
        document.querySelectorAll('.variant-stock-block').forEach((el, idx) => {
            el.style.display = (idx == selectedIndex) ? 'block' : 'none';
        });
        
        // Update specification labels
        document.getElementById('spec-color-val').textContent = selectedVariant.Color || 'N/A';
        document.getElementById('spec-ram-val').textContent = selectedVariant.RAM || 'N/A';
        document.getElementById('spec-rom-val').textContent = selectedVariant.ROM || 'N/A';
        
        // Update form qty max and add_to_cart disabled state
        const qtyInput = document.getElementById('qtyInput');
        const addToCartBtn = document.getElementById('addToCartBtn');
        const hiddenVidInput = document.getElementById('hiddenVidInput');
        
        hiddenVidInput.value = selectedVariant.ID;
        
        if (selectedVariant.Stock > 0) {
            qtyInput.max = selectedVariant.Stock;
            qtyInput.disabled = false;
            addToCartBtn.disabled = false;
        } else {
            qtyInput.max = 0;
            qtyInput.disabled = true;
            addToCartBtn.disabled = true;
        }
    }

    // Call on load
    document.addEventListener("DOMContentLoaded", function() {
        updateVariantDetails();
    });
</script>
