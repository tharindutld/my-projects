<?php
// Save as scratch/seed_orders_repairs.php
ini_set('memory_limit', '512M');
set_time_limit(600); // 10 minutes max execution time

include('config/db.php');

// Disable foreign key checks for speed and clean seed
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0");

echo "Starting database seeding process...\n";

// 1. Fetch available product variants
$variants = [];
$v_res = mysqli_query($conn, "SELECT v.ID, v.Price, p.ProductName, p.BrandName, p.ModelNumber FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID");
while ($row = mysqli_fetch_assoc($v_res)) {
    $variants[] = $row;
}
$total_variants = count($variants);
if ($total_variants === 0) {
    die("Error: No product variants found in database. Seed aborting.\n");
}
echo "Found $total_variants product variants in the database.\n";

// 2. Fetch available technicians
$technicians = [];
$t_res = mysqli_query($conn, "SELECT id FROM staff_users WHERE role = 'Technician'");
while ($row = mysqli_fetch_assoc($t_res)) {
    $technicians[] = (int)$row['id'];
}
if (count($technicians) === 0) {
    $technicians = [4, 7]; // fallback values
}

// 3. Fetch sales/admin staff
$sales_staff = [];
$s_res = mysqli_query($conn, "SELECT id FROM staff_users WHERE role IN ('Sales person', 'Admin')");
while ($row = mysqli_fetch_assoc($s_res)) {
    $sales_staff[] = (int)$row['id'];
}
if (count($sales_staff) === 0) {
    $sales_staff = [1, 2, 3, 5, 6]; // fallback values
}

// Helper to generate random date between Jan 2024 and July 2026
function getRandomDate($start = '2024-01-01', $end = '2026-07-31') {
    $min = strtotime($start);
    $max = strtotime($end);
    $val = rand($min, $max);
    return date('Y-m-d H:i:s', $val);
}

// Lists of random data to generate realistic records
$first_names = ['Saman', 'Nimal', 'Kamal', 'Sunil', 'Kanthi', 'Ruwan', 'Priyantha', 'Sanduni', 'Tharindu', 'Dilini', 'Chathura', 'Roshan', 'Gayan', 'Nilmini', 'Anura', 'Upul', 'Manju', 'Duminda', 'Eranga', 'Amila', 'Suraj', 'Ishara', 'Pasan', 'Mahesh', 'Kasun', 'Asanka', 'Pradeep', 'Buddhika', 'Dinesh', 'Sachin', 'Lahiru', 'Nuwan', 'Sanjeewa', 'Bandara', 'Rathnayake', 'Perera', 'Silva', 'Fernando', 'Jayawardena', 'Wickramasinghe', 'Herath', 'Senanayake', 'Alwis', 'Dias', 'Mendis', 'Peiris', 'Cooray', 'Gunawardena', 'Ranasinghe', 'Dissanayake'];
$last_names = ['Perera', 'Silva', 'Fernando', 'Jayasinghe', 'Gunaratne', 'Rathnayake', 'Dissanayake', 'Liyanage', 'Kumara', 'Herath', 'Bandara', 'Senavirathna', 'Weerasinghe', 'Prasanna', 'Siriwardena', 'Karunaratne', 'Premachandra', 'Dharmadasa', 'Wickramasinghe', 'Jayawardena', 'Samarasinghe', 'Gamage', 'Amarasinghe', 'Edirisinghe', 'Kariyawasam', 'Abeywickrama', 'Ranasinghe', 'Tennakoon', 'Munasinghe', 'Hettiarachchi', 'Hewage', 'Rodrigo', 'Fonseka', 'Mendis', 'Peiris', 'Alwis', 'Cooray', 'Maddumage', 'Pathirana', 'Nanayakkara', 'Rajapakse', 'Wijesinghe', 'De Silva', 'Goonetilleke', 'Kuruppu', 'Ekanayake', 'Balasuriya', 'Somaratne', 'Subasinghe', 'Basnayake'];

$genders = ['Male', 'Female'];
$cities = [
    ['Colombo 03', '00300', 'Western Province'],
    ['Peradeniya', '20400', 'Central Province'],
    ['Kurunegala', '60000', 'North Western Province'],
    ['Kandy', '20000', 'Central Province'],
    ['Galle', '80000', 'Southern Province'],
    ['Negombo', '11500', 'Western Province'],
    ['Jaffna', '40000', 'Northern Province'],
    ['Matara', '81000', 'Southern Province'],
    ['Anuradhapura', '50000', 'North Central Province'],
    ['Gampaha', '11000', 'Western Province'],
    ['Trincomalee', '31000', 'Eastern Province'],
    ['Batticaloa', '30000', 'Eastern Province']
];

$issues = [
    'Broken Screen Replacement',
    'Battery Drain / Battery Replacement',
    'Charging Port Malfunction',
    'Water Damage Diagnostic & Repair',
    'Bootloop / OS Software Flash',
    'Camera Module Replacement',
    'Speaker / Microphone Static Sound',
    'Power Button / Volume Keys Unresponsive',
    'Motherboard Short Circuit Repair',
    'Wi-Fi & Bluetooth Antenna Issue'
];

$devices = [
    ['Apple', 'iPhone 13 Pro', '13 Pro'],
    ['Apple', 'iPhone 15', '15'],
    ['Apple', 'iPhone 16 Pro Max', '16 Pro Max'],
    ['Samsung', 'Galaxy S25 Ultra', 'S25 Ultra'],
    ['Samsung', 'Galaxy M17 5G', 'M17 5G'],
    ['Xiaomi', 'Redmi Note 13', 'Note 13'],
    ['OnePlus', 'OnePlus 12', '12'],
    ['Google', 'Pixel 9 Pro', 'Pixel 9 Pro']
];

$pass_hash = password_hash('password123', PASSWORD_DEFAULT);

// 4. Create 510 Customers
echo "Generating 510 customer accounts...\n";
$customer_ids = [];
$customer_count = 510;

for ($i = 1; $i <= $customer_count; $i++) {
    $fname = $first_names[array_rand($first_names)];
    $lname = $last_names[array_rand($last_names)];
    $gender = $genders[array_rand($genders)];
    
    // Ensure unique email and phone
    $email = strtolower($fname) . "." . strtolower($lname) . "." . $i . "@gmail.com";
    $phone = "07" . rand(1, 8) . str_pad($i, 7, '0', STR_PAD_LEFT);
    
    $dob_year = rand(1980, 2005);
    $dob_month = str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
    $dob_day = str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT);
    $birthdate = "$dob_year-$dob_month-$dob_day";
    
    $regdate = getRandomDate('2024-01-01', '2025-12-31'); // Register in 2024 or 2025
    $loyalty = rand(10, 500);
    $status = 'Active';
    
    $insert_user = mysqli_query($conn, "INSERT INTO tbluser (FirstName, LastName, MobileNumber, Gender, BirthDate, Email, Password, LoyaltyPoints, RegDate, Status) 
        VALUES ('$fname', '$lname', '$phone', '$gender', '$birthdate', '$email', '$pass_hash', '$loyalty', '$regdate', '$status')");
        
    if ($insert_user) {
        $customer_ids[] = mysqli_insert_id($conn);
    }
}
$actual_customers_created = count($customer_ids);
echo "Successfully created $actual_customers_created customer profiles.\n";

// 5. Generate 2,050 Orders
echo "Generating 2,050 orders...\n";
$order_count = 2050;
$orders_created = 0;

// To ensure each customer gets at least one order
foreach ($customer_ids as $c_id) {
    $orders_created += createSimulatedOrder($conn, $c_id, $variants, $sales_staff, $cities);
}

// Generate the remaining orders randomly
$remaining_orders = $order_count - $orders_created;
echo "Created initial orders for all customers. Generating remaining $remaining_orders orders...\n";

for ($i = 0; $i < $remaining_orders; $i++) {
    $c_id = $customer_ids[array_rand($customer_ids)];
    $orders_created += createSimulatedOrder($conn, $c_id, $variants, $sales_staff, $cities);
}
echo "Total Orders Generated: $orders_created.\n";

// Helper function to insert a complete order
function createSimulatedOrder($conn, $userId, $variants, $sales_staff, $cities) {
    // Get user registration date
    $user_q = mysqli_query($conn, "SELECT RegDate FROM tbluser WHERE ID = '$userId'");
    $user_row = mysqli_fetch_assoc($user_q);
    $regDate = $user_row['RegDate'] ?? '2024-01-01 00:00:00';
    
    // Order date is between registration and July 2026
    $orderDate = getRandomDate($regDate, '2026-07-31 23:59:59');
    
    // Randomize address
    $city_meta = $cities[array_rand($cities)];
    $cityName = $city_meta[0];
    $zipCode = $city_meta[1];
    $province = $city_meta[2];
    
    $address = rand(10, 250) . "/A, Galle Road, " . $cityName;
    
    // Build order master details
    $orderNum = 'ORD-' . date('Ymd', strtotime($orderDate)) . '-' . rand(100000, 999999);
    $processedBy = $sales_staff[array_rand($sales_staff)];
    
    $pm = rand(1, 10) > 3 ? 'Card' : 'COD';
    
    // Status probability: 90% Completed, 5% Cancelled, 5% Returned
    $rand_status = rand(1, 100);
    if ($rand_status <= 90) {
        $status = 'Completed';
        $deliv_status = 'Delivered';
    } elseif ($rand_status <= 95) {
        $status = 'Cancelled';
        $deliv_status = 'Cancelled';
    } else {
        $status = 'Returned';
        $deliv_status = 'Returned';
    }
    
    // Points Awarded status
    $pointsAwarded = ($status === 'Completed') ? 1 : 0;
    
    // Insert order master first
    $ins_master = mysqli_query($conn, "INSERT INTO tbl_order_master (OrderNumber, UserId, ShippingName, ShippingPhone, ShippingCountry, ShippingAddress, ShippingPostalCode, BillingName, BillingPhone, BillingCountry, BillingAddress, BillingPostalCode, TotalAmount, PaymentMethod, OrderStatus, PointsAwarded, DeliveryStatus, OrderDate, ProcessedById) 
        VALUES ('$orderNum', '$userId', 'Valued Customer', '0777123456', 'Sri Lanka', '$address', '$zipCode', 'Valued Customer', '0777123456', 'Sri Lanka', '$address', '$zipCode', 0, '$pm', '$status', '$pointsAwarded', '$deliv_status', '$orderDate', '$processedBy')");
        
    if (!$ins_master) {
        return 0;
    }
    
    $masterId = mysqli_insert_id($conn);
    
    // Generate order items (1 to 3 items)
    $item_count = rand(1, 3);
    $totalAmount = 0;
    $selected_variants = array_rand($variants, $item_count);
    if (!is_array($selected_variants)) {
        $selected_variants = [$selected_variants];
    }
    
    foreach ($selected_variants as $v_idx) {
        $var = $variants[$v_idx];
        $qty = rand(1, 2);
        $price = $var['Price'];
        $varId = $var['ID'];
        
        mysqli_query($conn, "INSERT INTO tbl_order_items (OrderMasterId, VariantId, ProductQty, ProductPrice) 
            VALUES ('$masterId', '$varId', '$qty', '$price')");
            
        $totalAmount += $qty * $price;
    }
    
    // Update total amount on master
    mysqli_query($conn, "UPDATE tbl_order_master SET TotalAmount = '$totalAmount' WHERE ID = '$masterId'");
    
    return 1;
}

// 6. Generate 510 Repairs
echo "Generating 510 repairs...\n";
$repairs_count = 510;
$repairs_created = 0;

for ($i = 1; $i <= $repairs_count; $i++) {
    // Pick random client name
    $fname = $first_names[array_rand($first_names)];
    $lname = $last_names[array_rand($last_names)];
    $custName = "$fname $lname";
    
    // Pick random device info
    $dev = $devices[array_rand($devices)];
    $brand = $dev[0];
    $prod = $dev[1];
    $devName = $brand . " " . $dev[2];
    
    $issue = $issues[array_rand($issues)];
    $imei = "35" . rand(100000, 999999) . rand(1000000, 9999999);
    
    // Simulated prices
    $cost = rand(15, 120) * 100; // 1,500 to 12,000 LKR
    $income = $cost + (rand(15, 100) * 100); // profit margin added
    
    $tech = $technicians[array_rand($technicians)];
    
    // Status probability: 80% Completed, 10% In-progress, 5% Pending, 5% Cancelled
    $rand_status = rand(1, 100);
    if ($rand_status <= 80) {
        $status = 'Completed';
    } elseif ($rand_status <= 90) {
        $status = 'In-progress';
    } elseif ($rand_status <= 95) {
        $status = 'Pending';
    } else {
        $status = 'Cancelled';
    }
    
    $repairDate = date('Y-m-d', strtotime(getRandomDate('2024-01-01', '2026-07-31')));
    $notes = "Repair completed successfully. Warranty applied.";
    $parts = "Screen assembly / Battery module / USB charging flex IC";
    $labor = rand(1, 3) . " Hours";
    
    $ins_repair = mysqli_query($conn, "INSERT INTO tbl_repairs (CustomerName, BrandName, ProductName, IMEINumber, DeviceName, Issue, Cost, Income, TechnicianId, Status, RepairDate, RepairNotes, PartsUsed, LaborTime) 
        VALUES ('$custName', '$brand', '$prod', '$imei', '$devName', '$issue', '$cost', '$income', '$tech', '$status', '$repairDate', '$notes', '$parts', '$labor')");
        
    if ($ins_repair) {
        $repairs_created++;
    }
}
echo "Successfully created $repairs_created repair logs.\n";

// Enable foreign key checks back
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 1");

echo "Database seeding process completed successfully!\n";
?>
