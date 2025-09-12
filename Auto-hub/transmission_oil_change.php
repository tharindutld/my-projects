<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $date = $_POST['date'];
    $brand = $_POST['brand'];
    $oil_brand = $_POST['oil_brand'];
    $trans_type = $_POST['trans_type'];
    $details = $_POST['details'];

    $sql = "INSERT INTO transmission_oil_changes (log_date, brand, oil_brand, trans_type, details) 
            VALUES ('$date', '$brand', '$oil_brand', '$trans_type', '$details')";

    if ($conn->query($sql)) {
        echo '<div id="successMessage" style="
                background-color: #4caf50;
                color: #fff;
                padding: 8px 12px;
                border-radius: 5px;
                text-align: center;
                font-size: 14px;
                margin-bottom: 10px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">
            Transmission Oil Change logged successfully!
        </div>';
    } else {
        echo '<div id="errorMessage" style="
                background-color: #f44336;
                color: #fff;
                padding: 8px 12px;
                border-radius: 5px;
                text-align: center;
                font-size: 14px;
                margin-bottom: 10px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">
            Error: ' . $conn->error . '
        </div>';
    }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Transmission Oil Change</title>
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
      background: #1a1a1a;
      padding: 30px 35px 30px 25px;
      border-radius: 12px;
      max-width: 500px;
      margin: auto;
      box-shadow: 0px 4px 15px rgba(0,0,0,0.7);
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
  <h2>Transmission Oil Change</h2>
  <form id="transForm" method="POST">
    <label for="date">Date:</label>
    <input type="date" name="date" id="date">

    <label for="brand">Vehicle Brand:</label>
    <input type="text" name="brand" id="brand" placeholder="e.g., Toyota, Honda">

    <label for="oil_brand">Oil Brand:</label>
    <input type="text" name="oil_brand" id="oil_brand" placeholder="e.g., Mobil, Castrol">

    <label for="trans_type">Transmission Type:</label>
    <select name="trans_type" id="trans_type">
      <option value="">-- Select --</option>
      <option value="Automatic">Automatic</option>
      <option value="Manual">Manual</option>
    </select>

    <label for="details">Details:</label>
    <textarea name="details" id="details" rows="4" placeholder="Any notes..."></textarea>

    <button type="submit">Save</button>
  </form>

  <div class="nav-links">
    <a href="oil_change.php">Go to Gear Oil Change</a> | 
    <a href="filter_change.php">Go to Filter Change</a> | 
    <a href="coolant_change.php">Go to Coolant Change</a> | 
    <a href="airfilter_change.php">Go to Air Filter Change</a>
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

    document.getElementById("transForm").addEventListener("submit", function(event) {
      const date = document.getElementById("date").value;
      const brand = document.getElementById("brand").value.trim();
      const oilBrand = document.getElementById("oil_brand").value.trim();
      const type = document.getElementById("trans_type").value.trim();
      const today = new Date().toISOString().split("T")[0];

      if (!date) { showAlert("Validation Error", "Please select a date."); event.preventDefault(); return false; }
      if (date > today) { showAlert("Validation Error", "Date cannot be in the future."); event.preventDefault(); return false; }
      if (!brand) { showAlert("Validation Error", "Vehicle brand cannot be empty."); event.preventDefault(); return false; }
      if (!oilBrand) { showAlert("Validation Error", "Oil brand cannot be empty."); event.preventDefault(); return false; }
      if (!type) { showAlert("Validation Error", "Please select a transmission type."); event.preventDefault(); return false; }

      return true;
    });

    // Auto-hide success/error messages
    window.addEventListener("DOMContentLoaded", () => {
      const success = document.getElementById("successMessage");
      if (success) setTimeout(() => success.style.display = "none", 3000);
      const error = document.getElementById("errorMessage");
      if (error) setTimeout(() => error.style.display = "none", 5000);
    });
  </script>
</body>
</html>
