<?php
// Get the current file name
$current_page = basename($_SERVER['PHP_SELF']);

// Define which pages belong to which collapsible submenu
$staff_pages = ['adm_add_staff.php', 'adm_view_staff.php'];
$brand_pages = ['add-brand.php', 'manage-brand.php', 'editbrand.php'];
$category_pages = ['add-category.php', 'manage-category.php', 'editcategory.php'];
$product_pages = ['add-product.php', 'manage-product.php', 'editproducts.php', 'changeimage1.php', 'changeimage2.php', 'changeimage3.php', 'manage-pricing.php'];
$inventory_pages = ['inventory.php', 'stock-list.php', 'add-stock.php'];
$report_pages = ['reports.php', 'inventory-reports.php'];
$repairs_pages = ['add-repair.php', 'manage-repairs.php', 'edit-repair.php'];

// Check active states
$is_staff_active = in_array($current_page, $staff_pages);
$is_brand_active = in_array($current_page, $brand_pages);
$is_category_active = in_array($current_page, $category_pages);
$is_product_active = in_array($current_page, $product_pages);
$is_inventory_active = in_array($current_page, $inventory_pages);
$is_reports_active = in_array($current_page, $report_pages);
$is_repairs_active = in_array($current_page, $repairs_pages);

// Fetch logged-in user details from session
if(session_status() === PHP_SESSION_NONE) { session_start(); }
$admin_name = $_SESSION['admin_name'] ?? "Admin User";
$admin_role = $_SESSION['admin_role'] ?? "Admin";
// Generate dynamic initials avatar
$avatar_url = "https://ui-avatars.com/api/?name=" . urlencode($admin_name) . "&background=0d6efd&color=fff&rounded=true&bold=true";

// Setup prefix for subdirectories
$prefix = (basename(dirname($_SERVER['PHP_SELF'])) === 'reports') ? '../' : '';
?>

<div class="col-md-2 p-0 sidebar d-none d-md-block bg-dark min-vh-100 no-print">
    <div class="p-3 d-flex align-items-center gap-3 border-bottom border-secondary mb-3">
        <img src="<?php echo $avatar_url; ?>" alt="Admin Profile" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #0d6efd; box-shadow: 0 0 10px rgba(0,0,0,0.5); object-fit: cover;">
        <div class="d-flex flex-column justify-content-center">
            <h6 class="mb-1 text-white lh-1"><?php echo htmlspecialchars($admin_name); ?></h6>
            <small class="text-white-50 fw-semibold" style="font-size: 0.8rem;"><?php echo htmlspecialchars($admin_role); ?></small>
        </div>
    </div>

    <div class="nav flex-column px-2">
        <div class="nav-item my-1 <?php echo $current_page == 'dashboard.php' ? 'bg-primary rounded' : ''; ?>">
            <a href="<?php echo $prefix; ?>dashboard.php" class="nav-link text-white">
                <i class="bi bi-speedometer2 me-2"></i> Dashboard
            </a>
        </div>
        
      <?php if ($admin_role === 'Admin'): ?> 
            

        <div class="nav-item my-1 <?php echo $is_brand_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#brandSubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_brand_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-tags me-2"></i> Brands</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo $is_brand_active ? 'show' : ''; ?>" id="brandSubmenu">
                <ul class="nav flex-column pb-2">
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>add-brand.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'add-brand.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-plus-circle me-2"></i> Add Brand
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>manage-brand.php" class="nav-link text-white px-4 py-1 <?php echo in_array($current_page, ['manage-brand.php', 'editbrand.php']) ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> Manage Brands
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="nav-item my-1 <?php echo $is_category_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#categorySubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_category_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-grid me-2"></i> Categories</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo $is_category_active ? 'show' : ''; ?>" id="categorySubmenu">
                <ul class="nav flex-column pb-2">
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>add-category.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'add-category.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-plus-circle me-2"></i> Add Category
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>manage-category.php" class="nav-link text-white px-4 py-1 <?php echo in_array($current_page, ['manage-category.php', 'editcategory.php']) ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> Manage Categories
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="nav-item my-1 <?php echo $is_product_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#productSubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_product_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-box me-2"></i> Products</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo $is_product_active ? 'show' : ''; ?>" id="productSubmenu">
                <ul class="nav flex-column pb-2">
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>add-product.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'add-product.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-plus-circle me-2"></i> Add Product
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>manage-product.php" class="nav-link text-white px-4 py-1 <?php echo in_array($current_page, ['manage-product.php', 'editproducts.php', 'changeimage1.php', 'changeimage2.php', 'changeimage3.php']) ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> Manage Products
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>manage-pricing.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'manage-pricing.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-percent me-2"></i> Pricing & Discounts
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php endif; ?>

        <?php if ($admin_role === 'Admin'): ?>
        <div class="nav-item my-1 <?php echo $is_inventory_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#inventorySubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_inventory_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-archive me-2"></i> Inventory</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo $is_inventory_active ? 'show' : ''; ?>" id="inventorySubmenu">
                <ul class="nav flex-column pb-2">
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>stock-list.php" class="nav-link text-white px-4 py-1 <?php echo in_array($current_page, ['stock-list.php', 'add-stock.php']) ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> Batch Stock List
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>inventory.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'inventory.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-arrow-down-up me-2"></i> Manual Correction
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php endif; ?>

        <?php if (in_array($admin_role, ['Admin', 'Sales person'])): ?>
        <div class="nav-item my-1 <?php echo in_array($current_page, ['orders.php', 'add-order.php']) ? 'bg-primary rounded' : ''; ?>">
            <a href="#ordersSubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo in_array($current_page, ['orders.php', 'add-order.php']) ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-cart3 me-2"></i> Orders</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo in_array($current_page, ['orders.php', 'add-order.php']) ? 'show' : ''; ?>" id="ordersSubmenu">
                <ul class="nav flex-column pb-2">
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>add-order.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'add-order.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-plus-circle me-2"></i> Create Order
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>orders.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'orders.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> Manage Orders
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php endif; ?>

        <div class="nav-item my-1 <?php echo $is_repairs_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#repairsSubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_repairs_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-wrench me-2"></i> Repairs</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo $is_repairs_active ? 'show' : ''; ?>" id="repairsSubmenu">
                <ul class="nav flex-column pb-2">
                    <?php if (in_array($admin_role, ['Admin', 'Sales person'])): ?>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>add-repair.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'add-repair.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-plus-circle me-2"></i> Log Repair
                        </a>
                    </li>
                    <?php endif; ?>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>manage-repairs.php" class="nav-link text-white px-4 py-1 <?php echo in_array($current_page, ['manage-repairs.php', 'edit-repair.php']) ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> Manage Repairs
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <?php if (in_array($admin_role, ['Admin', 'Sales person'])): ?>
        <div class="nav-item my-1 <?php echo in_array($current_page, ['reg-users.php', 'user-orders.php']) ? 'bg-primary rounded' : ''; ?>">
            <a href="<?php echo $prefix; ?>reg-users.php" class="nav-link text-white">
                <i class="bi bi-people-fill me-2"></i> Customers
            </a>
        </div>
        <?php endif; ?>

        <?php if (in_array($admin_role, ['Admin', 'Sales person'])): ?>
        <div class="nav-item my-1 <?php echo $is_reports_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#reportsSubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_reports_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-bar-chart-line me-2"></i> Reports</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            <div class="collapse <?php echo $is_reports_active ? 'show' : ''; ?>" id="reportsSubmenu">
                <ul class="nav flex-column pb-2">
                    <?php if (in_array($admin_role, ['Admin', 'Sales person'])): ?>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>reports.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'reports.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-cash-stack me-2"></i> Sales Reports
                        </a>
                    </li>
                    <?php endif; ?>
                    <?php if (in_array($admin_role, ['Admin', 'Technician'])): ?>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>inventory-reports.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'inventory-reports.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-box-seam me-2"></i> Stock Reports
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
        <?php endif; ?>

        <?php if ($admin_role === 'Admin'): ?>
        <div class="nav-item my-1 border-top border-secondary pt-2 mt-2 <?php echo $is_staff_active ? 'bg-primary rounded' : ''; ?>">
            <a href="#staffSubmenu" data-bs-toggle="collapse" 
               aria-expanded="<?php echo $is_staff_active ? 'true' : 'false'; ?>" 
               class="nav-link text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-people me-2"></i> Staff Accounts</span>
                <i class="bi bi-chevron-down"></i>
            </a>
            
            <div class="collapse <?php echo $is_staff_active ? 'show' : ''; ?>" id="staffSubmenu">
                <ul class="nav flex-column pb-2">
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>adm_add_staff.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'adm_add_staff.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-person-plus me-2"></i> Add Staff
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?php echo $prefix; ?>adm_view_staff.php" class="nav-link text-white px-4 py-1 <?php echo $current_page == 'adm_view_staff.php' ? 'fw-bold' : ''; ?>">
                            <i class="bi bi-card-list me-2"></i> View Staff
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <?php endif; ?>
        
        <div class="mt-4 border-top border-secondary pt-3 px-2">
            <a href="<?php echo $prefix; ?>logout.php" class="logout-link confirm-link" data-confirm-message="Are you sure you want to log out of the admin panel?">
                <i class="bi bi-box-arrow-right me-2"></i> Logout
            </a>
        </div>
    </div>
</div>
<?php include_once(__DIR__ . '/../components/confirmation.php'); ?>