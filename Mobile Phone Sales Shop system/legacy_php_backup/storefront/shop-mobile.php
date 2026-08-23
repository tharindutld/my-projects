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

// --- Build dynamic query based on filters ---
$where_clauses = ["tblproducts.Status='1'", "tblbrand.Status='1'", "tblcategory.Status='1'"];
$search_term = '';
$selected_brand = '';
$selected_category = '';
$min_price = '';
$max_price = '';
$sort_by = '';

if(isset($_GET['bname']) && !empty($_GET['bname'])) {
    $selected_brand = mysqli_real_escape_string($conn, $_GET['bname']);
    $where_clauses[] = "tblproducts.BrandName='$selected_brand'";
}

if(isset($_GET['category']) && !empty($_GET['category'])) {
    $selected_category = mysqli_real_escape_string($conn, $_GET['category']);
    $where_clauses[] = "tblproducts.CategoryName='$selected_category'";
}

if(isset($_GET['search']) && !empty(trim($_GET['search']))) {
    $search_term = mysqli_real_escape_string($conn, trim($_GET['search']));
    $where_clauses[] = "(tblproducts.ProductName LIKE '%$search_term%' OR tblproducts.BrandName LIKE '%$search_term%' OR tblproducts.ModelNumber LIKE '%$search_term%')";
}

if(isset($_GET['min_price']) && $_GET['min_price'] !== '') {
    $min_price = floatval($_GET['min_price']);
    $where_clauses[] = "v.Price >= $min_price";
}

if(isset($_GET['max_price']) && $_GET['max_price'] !== '') {
    $max_price = floatval($_GET['max_price']);
    $where_clauses[] = "v.Price <= $max_price";
}

$order_by = "ORDER BY tblproducts.CreationDate DESC"; // default: newest first
if(isset($_GET['sort']) && !empty($_GET['sort'])) {
    $sort_by = $_GET['sort'];
    switch($sort_by) {
        case 'price_low':  $order_by = "ORDER BY MIN(v.Price) ASC"; break;
        case 'price_high': $order_by = "ORDER BY MAX(v.Price) DESC"; break;
        case 'name_az':    $order_by = "ORDER BY tblproducts.ProductName ASC"; break;
        case 'name_za':    $order_by = "ORDER BY tblproducts.ProductName DESC"; break;
        case 'newest':     $order_by = "ORDER BY tblproducts.CreationDate DESC"; break;
        default:           $order_by = "ORDER BY tblproducts.CreationDate DESC"; break;
    }
}

$where_sql = implode(' AND ', $where_clauses);
$product_query = "SELECT tblproducts.*, MIN(v.Price) as Price, MIN(v.Price) as MinPrice, MAX(v.Price) as MaxPrice, SUM(v.Stock) as TotalStock 
                  FROM tblproducts 
                  INNER JOIN tblproduct_variants v ON tblproducts.ID = v.ProductId
                  INNER JOIN tblbrand ON tblproducts.BrandName = tblbrand.BrandName 
                  INNER JOIN tblcategory ON tblproducts.CategoryName = tblcategory.CategoryName 
                  WHERE $where_sql 
                  GROUP BY tblproducts.ID 
                  $order_by";
$ret = mysqli_query($conn, $product_query);
$total_results = mysqli_num_rows($ret);

// Pagination Config
$limit = 9;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_results / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

$paginated_query = "SELECT tblproducts.*, MIN(v.Price) as Price, MIN(v.Price) as MinPrice, MAX(v.Price) as MaxPrice, SUM(v.Stock) as TotalStock 
                    FROM tblproducts 
                    INNER JOIN tblproduct_variants v ON tblproducts.ID = v.ProductId
                    INNER JOIN tblbrand ON tblproducts.BrandName = tblbrand.BrandName 
                    INNER JOIN tblcategory ON tblproducts.CategoryName = tblcategory.CategoryName 
                    WHERE $where_sql 
                    GROUP BY tblproducts.ID 
                    $order_by 
                    LIMIT $limit OFFSET $offset";
$ret_paginated = mysqli_query($conn, $paginated_query);

// Build general parameters array to preserve filters in links
$all_params = [];
if(!empty($search_term)) $all_params['search'] = $search_term;
if(!empty($selected_brand)) $all_params['bname'] = $selected_brand;
if(!empty($selected_category)) $all_params['category'] = $selected_category;
if($min_price !== '') $all_params['min_price'] = $min_price;
if($max_price !== '') $all_params['max_price'] = $max_price;
if(!empty($sort_by)) $all_params['sort'] = $sort_by;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | Shop</title>
    
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
        .brand-list-group .list-group-item.active-brand {
            background-color: var(--primary-color);
            color: white !important;
            font-weight: 700;
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

        /* Search & Filter Styles */
        .search-box {
            position: relative;
        }
        .search-box input {
            border-radius: 30px !important;
            padding: 7px 20px 7px 45px !important;
            border: 2px solid #e9ecef !important;
            transition: border-color 0.3s;
        }
        .search-box input:focus {
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1) !important;
        }
        .search-box .search-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #adb5bd;
        }

        .filter-card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .filter-card .card-header {
            border-radius: 12px 12px 0 0;
            border: none;
        }

        .price-range-inputs .form-control {
            border-radius: 8px;
            font-size: 0.85rem;
        }

        .active-filter-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px;
            border-radius: 20px;
            background: #e8f0fe;
            color: var(--primary-color);
            font-size: 0.8rem;
            font-weight: 600;
        }
        .active-filter-badge a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 700;
        }

        .category-badge {
            font-size: 0.7rem;
            padding: 3px 8px;
            border-radius: 10px;
         
        }
    </style>
</head>
<body>

<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="container my-5">
    <div class="row g-4">
        <!-- Sidebar: Brands, Categories, Filters -->
        <div class="col-lg-3">
            <!-- Brands Filter -->
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-bold"><i class="fa-solid fa-layer-group me-2 text-primary"></i>All Brands</h6>
                </div>
                <div class="list-group brand-list-group">
                    <?php
                    // Build URL preserving other filters but removing brand
                    $base_params = [];
                    if($search_term) $base_params['search'] = $search_term;
                    if($selected_category) $base_params['category'] = $selected_category;
                    if($min_price !== '') $base_params['min_price'] = $min_price;
                    if($max_price !== '') $base_params['max_price'] = $max_price;
                    if($sort_by) $base_params['sort'] = $sort_by;
                    ?>
                    <a href="shop-mobile.php?<?php echo http_build_query($base_params); ?>" class="list-group-item list-group-item-action fw-bold <?php echo empty($selected_brand) ? 'active-brand' : 'text-primary'; ?>">
                        All Brands
                    </a>
                    <?php
                    $brand_ret = mysqli_query($conn, "SELECT * FROM tblbrand WHERE Status='1'");
                    while ($brand_row = mysqli_fetch_array($brand_ret)) {
                        $brand_params = array_merge($base_params, ['bname' => $brand_row['BrandName']]);
                        $is_active = ($selected_brand == $brand_row['BrandName']);
                    ?>
                        <a href="shop-mobile.php?<?php echo http_build_query($brand_params); ?>" class="list-group-item list-group-item-action <?php echo $is_active ? 'active-brand' : 'text-muted'; ?>">
                            <?php echo htmlspecialchars($brand_row['BrandName']); ?>
                        </a>
                    <?php } ?>
                </div>
            </div>

            <!-- Category Filter -->
            <div class="card filter-card shadow-sm rounded-4 mb-3">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-bold"><i class="fa-solid fa-grid-2 me-2 text-info"></i>Categories</h6>
                </div>
                <div class="list-group brand-list-group">
                    <?php
                    $cat_base_params = [];
                    if($search_term) $cat_base_params['search'] = $search_term;
                    if($selected_brand) $cat_base_params['bname'] = $selected_brand;
                    if($min_price !== '') $cat_base_params['min_price'] = $min_price;
                    if($max_price !== '') $cat_base_params['max_price'] = $max_price;
                    if($sort_by) $cat_base_params['sort'] = $sort_by;
                    ?>
                    <a href="shop-mobile.php?<?php echo http_build_query($cat_base_params); ?>" class="list-group-item list-group-item-action fw-bold <?php echo empty($selected_category) ? 'active-brand' : 'text-info'; ?>">
                        All Categories
                    </a>
                    <?php
                    $cat_ret = mysqli_query($conn, "SELECT * FROM tblcategory WHERE Status='1'");
                    while ($cat_row = mysqli_fetch_array($cat_ret)) {
                        $cat_params = array_merge($cat_base_params, ['category' => $cat_row['CategoryName']]);
                        $is_cat_active = ($selected_category == $cat_row['CategoryName']);
                    ?>
                        <a href="shop-mobile.php?<?php echo http_build_query($cat_params); ?>" class="list-group-item list-group-item-action <?php echo $is_cat_active ? 'active-brand' : 'text-muted'; ?>">
                            <?php echo htmlspecialchars($cat_row['CategoryName']); ?>
                        </a>
                    <?php } ?>
                </div>
            </div>

            <!-- Price Range Filter -->
            <div class="card filter-card shadow-sm rounded-4 mb-3">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-bold"><i class="fa-solid fa-sliders me-2 text-success"></i>Price Range</h6>
                </div>
                <div class="card-body pt-0">
                    <form method="get" action="shop-mobile.php">
                        <!-- Preserve other filters -->
                        <?php if($search_term): ?><input type="hidden" name="search" value="<?php echo htmlspecialchars($search_term); ?>"><?php endif; ?>
                        <?php if($selected_brand): ?><input type="hidden" name="bname" value="<?php echo htmlspecialchars($selected_brand); ?>"><?php endif; ?>
                        <?php if($selected_category): ?><input type="hidden" name="category" value="<?php echo htmlspecialchars($selected_category); ?>"><?php endif; ?>
                        <?php if($sort_by): ?><input type="hidden" name="sort" value="<?php echo htmlspecialchars($sort_by); ?>"><?php endif; ?>
                        
                        <div class="price-range-inputs">
                            <div class="row g-2 mb-2">
                                <div class="col-6">
                                    <label class="form-label small text-muted mb-1">Min (LKR)</label>
                                    <input type="number" class="form-control" name="min_price" placeholder="0" min="0" value="<?php echo $min_price !== '' ? $min_price : ''; ?>">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small text-muted mb-1">Max (LKR)</label>
                                    <input type="number" class="form-control" name="max_price" placeholder="Any" min="0" value="<?php echo $max_price !== '' ? $max_price : ''; ?>">
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-6">
                                    <button type="submit" class="btn btn-success btn-sm w-100 rounded-pill">
                                        <i class="fa-solid fa-filter me-1"></i> Apply
                                    </button>
                                </div>
                                <div class="col-6">
                                    <?php 
                                    $price_clear_params = $all_params;
                                    unset($price_clear_params['min_price'], $price_clear_params['max_price']);
                                    ?>
                                    <a href="shop-mobile.php?<?php echo http_build_query($price_clear_params); ?>" class="btn btn-outline-secondary btn-sm w-100 rounded-pill text-decoration-none text-center d-block">
                                        Clear
                                    </a>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Products Grid -->
        <div class="col-lg-9">
            <!-- Header: Title + Sort + Active Filters -->
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                    <h4 class="section-title mb-0">
                        <?php 
                        if($search_term) {
                            echo 'Search: "' . htmlspecialchars($search_term) . '"';
                        } elseif($selected_brand && $selected_category) {
                            echo htmlspecialchars($selected_brand) . ' — ' . htmlspecialchars($selected_category);
                        } elseif($selected_brand) {
                            echo htmlspecialchars($selected_brand) . " Mobiles";
                        } elseif($selected_category) {
                            echo htmlspecialchars($selected_category);
                        } else {
                            echo "All Products";
                        }
                        ?>
                    </h4>
                    <small class="text-muted"><?php echo $total_results; ?> product<?php echo $total_results != 1 ? 's' : ''; ?> found</small>
                </div>
                
                <!-- Sort Dropdown -->
                <div class="d-flex align-items-center gap-2">
                    <label class="text-muted small fw-bold text-nowrap">Sort by:</label>
                    <div class="dropdown">
                        <button class="btn btn-light border btn-sm dropdown-toggle rounded-pill px-3 py-1.5 ms-1 d-flex align-items-center justify-content-between" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="min-width: 165px;">
                            <span>
                                <?php
                                switch($sort_by) {
                                    case 'price_low':  echo 'Price: Low → High'; break;
                                    case 'price_high': echo 'Price: High → Low'; break;
                                    case 'name_az':    echo 'Name: A → Z'; break;
                                    case 'name_za':    echo 'Name: Z → A'; break;
                                    case 'newest':
                                    default:           echo 'Newest First'; break;
                                }
                                ?>
                            </span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-1" aria-labelledby="sortDropdown">
                            <li><a class="dropdown-item <?php echo ($sort_by == 'newest' || $sort_by == '') ? 'active' : ''; ?>" href="#" onclick="applySortFilter('newest'); return false;">Newest First</a></li>
                            <li><a class="dropdown-item <?php echo ($sort_by == 'price_low') ? 'active' : ''; ?>" href="#" onclick="applySortFilter('price_low'); return false;">Price: Low → High</a></li>
                            <li><a class="dropdown-item <?php echo ($sort_by == 'price_high') ? 'active' : ''; ?>" href="#" onclick="applySortFilter('price_high'); return false;">Price: High → Low</a></li>
                            <li><a class="dropdown-item <?php echo ($sort_by == 'name_az') ? 'active' : ''; ?>" href="#" onclick="applySortFilter('name_az'); return false;">Name: A → Z</a></li>
                            <li><a class="dropdown-item <?php echo ($sort_by == 'name_za') ? 'active' : ''; ?>" href="#" onclick="applySortFilter('name_za'); return false;">Name: Z → A</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Active Filters Display -->
            <?php 
            $has_active_filters = $search_term || $selected_brand || $selected_category || $min_price !== '' || $max_price !== '';
            if($has_active_filters): 
            ?>
            <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <small class="text-muted fw-bold">Filters:</small>
                <?php 
                // Build remove-filter URLs
                $all_params = [];
                if($search_term) $all_params['search'] = $search_term;
                if($selected_brand) $all_params['bname'] = $selected_brand;
                if($selected_category) $all_params['category'] = $selected_category;
                if($min_price !== '') $all_params['min_price'] = $min_price;
                if($max_price !== '') $all_params['max_price'] = $max_price;
                if($sort_by) $all_params['sort'] = $sort_by;
                
                if($search_term) {
                    $remove = $all_params; unset($remove['search']);
                    echo '<span class="active-filter-badge">Search: "'.htmlspecialchars($search_term).'" <a href="shop-mobile.php?'.http_build_query($remove).'">×</a></span>';
                }
                if($selected_brand) {
                    $remove = $all_params; unset($remove['bname']);
                    echo '<span class="active-filter-badge">Brand: '.htmlspecialchars($selected_brand).' <a href="shop-mobile.php?'.http_build_query($remove).'">×</a></span>';
                }
                if($selected_category) {
                    $remove = $all_params; unset($remove['category']);
                    echo '<span class="active-filter-badge">Category: '.htmlspecialchars($selected_category).' <a href="shop-mobile.php?'.http_build_query($remove).'">×</a></span>';
                }
                if($min_price !== '' || $max_price !== '') {
                    $remove = $all_params; unset($remove['min_price']); unset($remove['max_price']);
                    $price_label = '';
                    if($min_price !== '' && $max_price !== '') $price_label = 'Rs.'.number_format($min_price).' - Rs.'.number_format($max_price);
                    elseif($min_price !== '') $price_label = 'From Rs.'.number_format($min_price);
                    else $price_label = 'Up to Rs.'.number_format($max_price);
                    echo '<span class="active-filter-badge">Price: '.$price_label.' <a href="shop-mobile.php?'.http_build_query($remove).'">×</a></span>';
                }
                ?>
                <a href="shop-mobile.php" class="btn btn-sm btn-outline-secondary rounded-pill ms-2">Clear All</a>
            </div>
            <?php endif; ?>

           <div class="row row-cols-1 row-cols-md-3 g-4">
            <?php
            if($total_results > 0) {
                while ($row = mysqli_fetch_array($ret_paginated)) {
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
                        <div class="d-flex justify-content-center gap-1 mb-1">
                            <span class="text-uppercase text-muted small"><?php echo htmlspecialchars($row['BrandName']);?></span>
                            <?php if(!empty($row['CategoryName'])): ?>
                                <span class="badge bg-info bg-opacity-10 text-info category-badge"><?php echo htmlspecialchars($row['CategoryName']);?></span>
                            <?php endif; ?>
                        </div>
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
            <?php 
                } 
            } else {
                echo "<div class='col-12'><div class='alert alert-info text-center py-4'><i class='fa-solid fa-search me-2'></i>No products found matching your criteria. <a href='shop-mobile.php'>Browse all products</a>.</div></div>";
            }
            ?>
        </div>

        <!-- Pagination Controls -->
        <?php if ($total_pages > 1): ?>
        <nav class="d-flex justify-content-center mt-5">
            <ul class="pagination pagination-custom gap-1">
                <!-- Previous Page -->
                <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                    <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $page - 1])); ?>" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
                
                <!-- Page Numbers -->
                <?php for($i = 1; $i <= $total_pages; $i++): ?>
                    <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                        <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $i])); ?>">
                            <?php echo $i; ?>
                        </a>
                    </li>
                <?php endfor; ?>
                
                <!-- Next Page -->
                <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                    <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $page + 1])); ?>" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            </ul>
        </nav>
        <?php endif; ?>

        </div>
    </div>
</div>

<?php include_once('../includes/storefront/front_footer.php');?>

<script>
    
    // Sort filter handler
    function applySortFilter(value) {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', value);
        window.location.href = url.toString();
    }
</script>
