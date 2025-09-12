<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $date = $_POST['date'];
    $odometer = $_POST['odometer'];
    $filter_type = $_POST['filter_type'];
    $filter_brand = $_POST['filter_brand'];
    $part_number = $_POST['part_number'];
    $details = $_POST['details'];

    // Server-side validation
    $today = date("Y-m-d");
    if (!$date || $date > $today) {
        $error = "Date cannot be in the future.";
    } elseif (!$odometer || $odometer <= 0) {
        $error = "Odometer must be greater than 0.";
    } elseif (!$filter_type) {
        $error = "Filter type is required.";
    } elseif (!$filter_brand) {
        $error = "Filter brand is required.";
    } elseif (!$part_number || !preg_match("/^[A-Za-z]{2,5}-\d{3,6}$/", $part_number)) {
        $error = "Part number format should be like AF-12345.";
    }

    if (!isset($error)) {
        $sql = "INSERT INTO air_filters (log_date, odometer, filter_type, filter_brand, part_number, details) 
                VALUES ('$date', '$odometer', '$filter_type', '$filter_brand', '$part_number', '$details')";
        if ($conn->query($sql)) {
            echo "<p id='successMsg' style='color:lime; text-align:center;'>Air Filter Change logged successfully!</p>";
            echo "<script>setTimeout(()=>{ var msg = document.getElementById('successMsg'); if(msg) msg.style.display='none'; },3000);</script>";
        } else {
            $error = "Database Error: " . $conn->error;
        }
    }

    if (isset($error)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>$error</p>";
        echo "<script>setTimeout(()=>{ var msg = document.getElementById('errorMsg'); if(msg) msg.style.display='none'; },5000);</script>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Air Filter Change</title>
  <style>
    body { 
      background: #000; 
      color: #9c27b0; 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      margin: 0px;
      margin-bottom: 50px;
    }

    h2 { 
      color: #ce93d8; 
      text-align: center; 
      margin-bottom: 30px;
    }

    form {
      background: #1c1c1c;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      margin: auto;
    }

    label { 
      display:block; 
      margin: 12px 0 6px; 
      font-weight: bold; 
      color: #ba68c8;
    }

    input, textarea {
      width: 100%; 
      padding: 12px; 
      margin-bottom: 18px;
      border: none; 
      border-radius: 8px;
      background: #2a2a2a; 
      color: #e1bee7;
      font-size: 14px;
      box-sizing: border-box;
    }

    textarea { resize: none; }

    button { 
      width: 100%;
      padding: 12px; 
      background: #9c27b0; 
      color: #fff; 
      font-weight: bold; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 16px;
      transition: 0.3s ease;
    }

    button:hover { 
      background: #7b1fa2; 
    }

    .links {
      text-align:center; 
      margin-top:20px;
    }

    .links a {
      color:#ba68c8; 
      text-decoration:none; 
      margin:0 10px; 
      font-weight:bold;
      text-decoration: underline;
    }

    .links a:hover { color:#e1bee7; }

    /* Custom alert overlay */
    .custom-alert-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .custom-alert {
      background: #fff;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 350px;
      font-family: Arial, sans-serif;
      animation: fadeIn 0.3s ease;
    }

    .custom-alert h3 {
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: bold;
      color: #e53935;
    }

    .custom-alert p {
      font-size: 15px;
      color: #333;
      margin-bottom: 15px;
    }

    .custom-alert button {
      background: #e53935;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: 0.3s;
    }

    .custom-alert button:hover { background: #c62828; }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <h2>Air Filter Change</h2>
  <form method="POST" onsubmit="return validateForm()">
    <label for="date">Date:</label>
    <input type="date" id="date" name="date">

    <label for="odometer">Odometer Reading (km):</label>
    <input type="number" id="odometer" name="odometer" placeholder="e.g., 45200">

    <label for="filter_type">Filter Type:</label>
    <input type="text" id="filter_type" name="filter_type" placeholder="e.g., Paper, Foam, Cotton">

    <label for="filter_brand">Filter Brand:</label>
    <input type="text" id="filter_brand" name="filter_brand" placeholder="e.g., Bosch, Mann, K&N">

    <label for="part_number">Filter Part Number:</label>
    <input type="text" id="part_number" name="part_number" placeholder="e.g., AF-12345">

    <label for="details">Details:</label>
    <textarea id="details" name="details" rows="4" placeholder="Any notes..."></textarea>

    <button type="submit">Save</button>
  </form>

  <div class="links">
    <a href="oil_change.php">Go to Gear Oil Change</a> | 
    <a href="transmission_oil_change.php">Go to Transmission Oil Change</a> | 
    <a href="coolant_change.php">Go to Coolant Change</a> | 
    <a href="filter_change.php">Go to Filter Change</a>
  </div>

  <script>
    function showAlert(title, message) {
      const overlay = document.createElement("div");
      overlay.className = "custom-alert-overlay";
      overlay.innerHTML = `
        <div class="custom-alert">
          <h3>${title}</h3>
          <p>${message}</p>
          <button onclick="this.closest('.custom-alert-overlay').remove()">OK</button>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    function validateForm() {
      const date = document.getElementById("date").value;
      const odo = document.getElementById("odometer").value;
      const type = document.getElementById("filter_type").value.trim();
      const brand = document.getElementById("filter_brand").value.trim();
      const part = document.getElementById("part_number").value.trim();
      const details = document.getElementById("details").value.trim();
      const today = new Date().toISOString().split("T")[0];

      if (!date) { showAlert("Validation Error", "Please select a date."); return false; }
      if (date > today) { showAlert("Validation Error", "Date cannot be in the future."); return false; }
      if (!odo || odo <= 0) { showAlert("Validation Error", "Odometer must be greater than 0."); return false; }
      if (!type) { showAlert("Validation Error", "Filter type is required."); return false; }
      if (!brand) { showAlert("Validation Error", "Filter brand is required."); return false; }
      if (!part || !/^[A-Za-z]{2,5}-\d{3,6}$/.test(part)) { showAlert("Validation Error", "Part number format should be like AF-12345."); return false; }

      return true;
    }

    // Auto-hide success/error messages
    window.addEventListener("DOMContentLoaded", () => {
      const success = document.getElementById("successMsg");
      if (success) setTimeout(() => success.style.display = 'none', 3000);
      const error = document.getElementById("errorMsg");
      if (error) setTimeout(() => error.style.display = 'none', 5000);
    });
  </script>
</body>
</html>
