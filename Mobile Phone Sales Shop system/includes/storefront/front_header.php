<?php
$cust_fullname = "";
if (isset($_SESSION['msmsuid']) && isset($conn)) {
    $uid = $_SESSION['msmsuid'];
    $h_stmt = $conn->prepare("SELECT FirstName, LastName FROM tbluser WHERE ID = ?");
    $h_stmt->bind_param("i", $uid);
    $h_stmt->execute();
    $h_res = $h_stmt->get_result();
    if ($h_res->num_rows > 0) {
        $h_row = $h_res->fetch_assoc();
        $cust_fullname = trim($h_row['FirstName'] . ' ' . $h_row['LastName']);
    }
}
?>
<link rel="stylesheet" href="../assets/css/style.css">
<nav class="navbar navbar-expand-lg navbar-white bg-white sticky-top navbar-custom">
    <div class="container">
        <a class="navbar-brand fw-bold text-primary" href="index.php">
            <i class="fa-solid fa-bag-heart me-2"></i>Mobile Mart
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link" href="index.php">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="shop-mobile.php">Shop</a>
                </li>
            </ul>
            
            <form class="d-flex mx-lg-3 my-2 my-lg-0" style="max-width: 300px; flex-grow: 1;" method="get" action="shop-mobile.php">
                <div class="search-input-group w-100">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" class="form-control rounded-pill" name="search" placeholder="Search mobiles..." value="<?php echo isset($_GET['search']) ? htmlspecialchars($_GET['search']) : ''; ?>">
                </div>
            </form>
            
            <div class="d-flex align-items-center gap-3 flex-wrap">
                <a href="cart.php" class="nav-icon-link px-2 py-1" title="Cart">
                    <i class="fa-solid fa-cart-shopping fs-5"></i>
                </a>
                
                <a href="wishlist.php" class="nav-icon-link px-2 py-1" title="Wishlist">
                    <i class="fa-regular fa-heart fs-5"></i>
                </a>

                <?php if(isset($_SESSION['msmsuid']) && !empty($_SESSION['msmsuid'])): ?>
                    <div class="dropdown">
                        <a class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle px-3 py-1.5 rounded-pill user-dropdown-btn" href="#" role="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa-solid fa-user me-2 text-primary"></i>
                            <span><?php echo htmlspecialchars($cust_fullname); ?></span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" aria-labelledby="userDropdown" style="font-size: 13.5px; min-width: 180px;">
                            <li>
                                <a class="dropdown-item py-2" href="profile.php">
                                    <i class="fa-regular fa-id-card me-2 text-primary"></i> My Profile
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item py-2" href="my-orders.php">
                                    <i class="fa-solid fa-box-open me-2 text-muted"></i> My Orders
                                </a>
                            </li>
                            <li><hr class="dropdown-divider my-1"></li>
                            <li>
                                <a class="dropdown-item py-2 text-danger confirm-link" href="logout.php" data-confirm-message="Are you sure you want to sign out of your account?">
                                    <i class="fa-solid fa-arrow-right-from-bracket me-2"></i> Log Out
                                </a>
                            </li>
                        </ul>
                    </div>
                <?php else: ?>
                    <a href="login.php" class="btn btn-outline-primary rounded-pill px-4 btn-sm">
                        <i class="fa-solid fa-arrow-right-to-bracket me-2"></i>Sign In
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>
