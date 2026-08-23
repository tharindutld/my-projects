1. Revert/Change the top check back to only Admin

Make sure the main block check is split up, or simply check roles individually:
For Brands (Allow Admin & Sales person):


<?php if (in_array($admin_role, ['Admin', 'Sales person'])): ?>
<div class="nav-item my-1 <?php echo $is_brand_active ? 'bg-primary rounded' : ''; ?>">
    <!-- Brand Menu HTML... -->
</div>
<?php endif; ?>

Inside the Brand Submenu (Only show "Add Brand" to Sales person, but hide "Manage Brands"): You can put a check inside the list items (<li>):

<ul class="nav flex-column pb-2">
    <!-- "Add Brand" is visible to both Admin and Sales person -->
    <li class="nav-item">
        <a href="add-brand.php" class="...">Add Brand</a>
    </li>
    
    <!-- "Manage Brands" is restricted to Admin only -->
    <?php if ($admin_role === 'Admin'): ?>
    <li class="nav-item">
        <a href="manage-brand.php" class="...">Manage Brands</a>
    </li>
    <?php endif; ?>
</ul>

2. Guard Categories and Products for Admin Only
Since these were originally inside the Admin block, you should wrap them in their own <?php if ($admin_role === 'Admin'): ?> checks:
//For Categories:

<?php if ($admin_role === 'Admin'): ?>
<div class="nav-item my-1 <?php echo $is_category_active ? 'bg-primary rounded' : ''; ?>">
    <!-- Category Submenu HTML... -->
</div>
<?php endif; ?>



//For Products:

<?php if ($admin_role === 'Admin'): ?>
<div class="nav-item my-1 <?php echo $is_product_active ? 'bg-primary rounded' : ''; ?>">
    <!-- Product Submenu HTML... -->
</div>
<?php endif; ?>