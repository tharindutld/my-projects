<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $date = $_POST['date'];
    $odometer = $_POST['odometer'];
    $filter_type = $_POST['filter_type'];
    $filter_brand = $_POST['filter_brand'];
    $filter_part = $_POST['filter_part'];
    $details = $_POST['details'];

    $sql = "INSERT INTO filter_changes (log_date, odometer, filter_type, filter_brand, filter_part, details)
            VALUES ('$date', '$odometer', '$filter_type', '$filter_brand', '$filter_part', '$details')";

       if ($conn->query($sql)) {
            echo "<p id='successMsg' style='color:lime; text-align:center;'>Oil Change logged successfully!</p>";
            echo "<script>setTimeout(function(){ var msg = document.getElementById('successMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
        } else {
            echo "Error: " . $conn->error;
        }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Filter Change</title>
  <style>
    body { 
      background: #0d0d0d; 
      color: #fff; 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      margin: 0;
      margin-bottom: 50px;
    }

    h2 { 
      color: #ff9800; 
      text-align: center; 
      margin-bottom: 30px;
    }

    form {
      background: #1e1e1e;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      margin: auto;
      box-shadow: 0px 4px 15px rgba(0,0,0,0.6);
    }

    label { 
      display:block; 
      margin: 12px 0 6px; 
      font-weight: bold; 
      color: #ffb84d;
    }

    input, select, textarea {
      width: 100%; 
      padding: 12px; 
      margin-bottom: 18px;
      border: none; 
      border-radius: 8px;
      background: #262626; 
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
    }

    textarea { resize: none; }

    button { 
      width: 100%;
      padding: 12px; 
      background: #ff9800; 
      color: #121212; 
      font-weight: bold; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 16px;
      transition: 0.3s ease;
      margin-top: 10px;
    }

    button:hover { background: #e68900; }

    .nav-links {
      text-align:center; 
      margin-top:20px;
    }

    .nav-links a {
      color:#ff9800; 
      text-decoration:none; 
      margin:0 10px; 
      font-weight:bold;
      text-decoration: underline;
    }

    .nav-links a:hover { color:#e68900; }

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
  <h2>Filter Change</h2>
  <form id="filterForm" method="POST">
    <label for="date">Date:</label>
    <input type="date" name="date" id="date">

    <label for="odometer">Odometer Reading (km):</label>
    <input type="number" name="odometer" id="odometer" placeholder="e.g., 45000">

    <label for="filter_type">Filter Type:</label>
    <select name="filter_type" id="filter_type">
      <option value="">-- Select Filter Type --</option>
      <option value="Air Filter">Air Filter</option>
      <option value="Oil Filter">Oil Filter</option>
      <option value="Fuel Filter">Fuel Filter</option>
      <option value="Cabin Filter">Cabin Filter</option>
    </select>

    <label for="filter_brand">Filter Brand:</label>
    <input type="text" name="filter_brand" id="filter_brand" placeholder="e.g., Bosch, Mann">

    <label for="filter_part">Filter Part Number:</label>
    <input type="text" name="filter_part" id="filter_part" placeholder="e.g., 12345-XYZ">

    <label for="details">Details:</label>
    <textarea name="details" id="details" rows="4" placeholder="Any notes..."></textarea>

    <button type="submit">Save</button>
  </form>

  <div class="nav-links">
    <a href="oil_change.php">Gear Oil Change</a> | 
    <a href="transmission_oil_change.php">Transmission Oil Change</a> | 
    <a href="coolant_change.php">Coolant Change</a> | 
    <a href="airfilter_change.php">Air Filter Change</a>
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

    document.getElementById("filterForm").addEventListener("submit", function(event) {
      const date = document.getElementById("date").value;
      const odo = document.getElementById("odometer").value;
      const type = document.getElementById("filter_type").value;
      const brand = document.getElementById("filter_brand").value.trim();
      const part = document.getElementById("filter_part").value.trim();
      const today = new Date().toISOString().split("T")[0];

      if (!date) { showAlert("Validation Error", "Please select a date."); event.preventDefault(); return false; }
      if (date > today) { showAlert("Validation Error", "Date cannot be in the future."); event.preventDefault(); return false; }
      if (!odo || odo <= 0) { showAlert("Validation Error", "Odometer must be greater than 0."); event.preventDefault(); return false; }
      if (!type) { showAlert("Validation Error", "Please select a filter type."); event.preventDefault(); return false; }
      if (!brand) { showAlert("Validation Error", "Brand name cannot be empty."); event.preventDefault(); return false; }
      if (!part) { showAlert("Validation Error", "Part number cannot be empty."); event.preventDefault(); return false; }

      return true;
    });

    window.addEventListener("DOMContentLoaded", () => {
      const success = document.getElementById("successMessage");
      if (success) setTimeout(() => success.style.display = "none", 3000);
      const error = document.getElementById("errorMessage");
      if (error) setTimeout(() => error.style.display = "none", 5000);
    });
  </script>
</body>
</html>
