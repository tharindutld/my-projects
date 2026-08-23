<?php
/**
 * Pricing & Discount Helper Functions
 */

/**
 * Check if a product currently has an active discount.
 * A discount is active when:
 *   1. DiscountPercent > 0
 *   2. Today is within DiscountStartDate and DiscountEndDate (if set)
 *      OR no date range is set (permanent discount)
 */
function isDiscountActive($product) {
    $discount = floatval($product['DiscountPercent'] ?? 0);
    if ($discount <= 0) return false;
    
    $today = date('Y-m-d');
    $start = $product['DiscountStartDate'] ?? null;
    $end   = $product['DiscountEndDate'] ?? null;
    
    // If no date range set, discount is always active
    if (empty($start) && empty($end)) return true;
    
    // Check date range
    if (!empty($start) && $today < $start) return false;
    if (!empty($end) && $today > $end) return false;
    
    return true;
}

/**
 * Calculate the final (discounted) price of a product.
 * Returns the original price if no active discount.
 */
function getDiscountedPrice($product) {
    $original = floatval($product['Price']);
    if (!isDiscountActive($product)) return $original;
    
    $discount = floatval($product['DiscountPercent']);
    return round($original * (1 - $discount / 100), 2);
}

/**
 * Calculate the savings amount for a product.
 */
function getDiscountSavings($product) {
    $original = floatval($product['Price']);
    return round($original - getDiscountedPrice($product), 2);
}

/**
 * Render a price display with discount styling.
 * Shows original price struck through + discounted price if discount is active.
 * Returns an HTML string.
 */
function renderPriceHTML($product, $size = 'normal') {
    $original = floatval($product['Price']);
    $has_discount = isDiscountActive($product);
    
    if ($has_discount) {
        $discounted = getDiscountedPrice($product);
        $percent = floatval($product['DiscountPercent']);
        
        if ($size === 'large') {
            // Used on single.php product detail page
            return '<div class="d-flex align-items-center gap-3 flex-wrap">
                        <span class="price-tag text-primary" style="font-size:2.5rem;font-weight:700;">Rs. ' . number_format($discounted, 2) . '</span>
                        <span class="text-decoration-line-through text-muted fs-4">Rs. ' . number_format($original, 2) . '</span>
                        <span class="badge bg-danger fs-6 px-3 py-2">' . number_format($percent, 0) . '% OFF</span>
                    </div>';
        } else {
            // Used on shop-mobile.php product cards
            return '<div class="mb-1">
                        <span class="text-decoration-line-through text-muted small">Rs. ' . number_format($original, 2) . '</span>
                        <span class="badge bg-danger ms-1">' . number_format($percent, 0) . '% OFF</span>
                    </div>
                    <h5 class="text-primary fw-bold mb-3">Rs. ' . number_format($discounted, 2) . '</h5>';
        }
    } else {
        if ($size === 'large') {
            return '<div class="price-tag my-4" style="font-size:2.5rem;font-weight:700;color:#0d6efd;">Rs. ' . number_format($original, 2) . '</div>';
        } else {
            return '<h5 class="text-primary fw-bold mb-3">Rs. ' . number_format($original, 2) . '</h5>';
        }
    }
}
?>
