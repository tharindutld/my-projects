<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $date = $_POST['date'];
    $brand = $_POST['oil_brand'];
    $grade = $_POST['oil_grade'];
    $type = $_POST['oil_type'];
    $details = $_POST['details'];

    // Server-side validations
    $today = date("Y-m-d");
    if ($date > $today) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Date cannot be in the future!</p>";
        echo "<script>setTimeout(function(){ var msg = document.getElementById('errorMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
    } elseif (empty($brand) || !preg_match("/^[A-Za-z\s]+$/", $brand)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Oil brand must contain only letters and spaces.</p>";
        echo "<script>setTimeout(function(){ var msg = document.getElementById('errorMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
    } elseif (empty($grade) || !preg_match("/^\d{1,2}W-\d{2}$/", $grade)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Oil grade must be like 5W-30 or 10W-40.</p>";
        echo "<script>setTimeout(function(){ var msg = document.getElementById('errorMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
    } elseif (empty($type)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Please select an oil type.</p>";
        echo "<script>setTimeout(function(){ var msg = document.getElementById('errorMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
    } elseif (empty($details)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Please enter details.</p>";
        echo "<script>setTimeout(function(){ var msg = document.getElementById('errorMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
    } else {
        // Insert into oil_changes table
        $sql = "INSERT INTO oil_changes (log_date, oil_brand, oil_grade, oil_type, details) 
                VALUES ('$date', '$brand', '$grade', '$type', '$details')";
        if ($conn->query($sql)) {
            echo "<p id='successMsg' style='color:lime; text-align:center;'>Oil Change logged successfully!</p>";
            echo "<script>setTimeout(function(){ var msg = document.getElementById('successMsg'); if(msg){ msg.style.display='none'; } },3000);</script>";
        } else {
            echo "Error: " . $conn->error;
        }
    }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Oil Change</title>
  <style>
    body { 
      background: #121212; 
      color: #fff; 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      margin: 0px;
      margin-bottom: 50px;
    }

    h2 { 
      color: #00bcd4; 
      text-align: center; 
      margin-bottom: 30px;
    }

    form {
      background: #1e1e1e;
      padding: 30px 35px 30px 25px;
      border-radius: 12px;
      max-width: 500px;
      margin: auto;
      box-shadow: 0px 4px 15px rgba(0,0,0,0.6);
    }

    label { 
      display:block; 
      margin: 12px 0 6px; 
      font-weight: bold; 
    }

    input, select, textarea {
      width: 100%; 
      padding: 12px; 
      margin-bottom: 18px;
      border: none; 
      border-radius: 8px;
      background: #2a2a2a; 
      color: #fff;
      font-size: 14px;
      box-sizing: border-box;
    }

    textarea { resize: none; }

    button { 
      width: 100%;
      padding: 12px; 
      background: #00bcd4; 
      color: #121212; 
      font-weight: bold; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 16px;
      transition: 0.3s ease;
    }

    button:hover { 
      background: #0097a7; 
    }

    .custom-alert-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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

    .custom-alert button:hover {
      background: #c62828;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

  </style>
</head>
<body>
  <h2>Gear Oil Change</h2>
  <form method="POST" onsubmit="return validateForm()">
    <label for="date">Date:</label>
    <input type="date" name="date" id="date">

    <label for="oil_brand">Oil Brand:</label>
    <input type="text" name="oil_brand" id="oil_brand" placeholder="e.g., Mobil, Castrol">

    <label for="oil_grade">Oil Grade:</label>
    <input type="text" name="oil_grade" id="oil_grade" placeholder="e.g., 5W-30, 10W-40">

    <label for="oil_type">Type:</label>
    <select name="oil_type" id="oil_type">
      <option value="">-- Select --</option>
      <option value="Mineral">Mineral</option>
      <option value="Synthetic">Synthetic</option>
    </select>

    <label for="details">Details:</label>
    <textarea name="details" id="details" rows="4" placeholder="Any notes..."></textarea>

    <button type="submit">Save</button>
  </form>

  <div style="text-align:center; margin-top:20px;">
    <a href="transmission_oil_change.php" style="color:#00bcd4; font-weight:bold; margin:0 10px;" 
       onmouseover="this.style.color='#008fa1'" onmouseout="this.style.color='#00bcd4'">Go to Transmission Oil Change</a> | 
    <a href="coolant_change.php" style="color:#00bcd4; font-weight:bold; margin:0 10px;" 
       onmouseover="this.style.color='#008fa1'" onmouseout="this.style.color='#00bcd4'">Go to Coolant Change</a> | 
    <a href="filter_change.php" style="color:#00bcd4; font-weight:bold; margin:0 10px;" 
       onmouseover="this.style.color='#008fa1'" onmouseout="this.style.color='#00bcd4'">Go to Filter Change</a> |
    <a href="airfilter_change.php" style="color:#00bcd4; font-weight:bold; margin:0 10px;" 
       onmouseover="this.style.color='#008fa1'" onmouseout="this.style.color='#00bcd4'">Go to Air Filter Change</a>
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
      const date = document.getElementById("date").value.trim();
      const brand = document.getElementById("oil_brand").value.trim();
      const grade = document.getElementById("oil_grade").value.trim();
      const type = document.getElementById("oil_type").value;
      const details = document.getElementById("details").value.trim();

      const today = new Date().toISOString().split("T")[0];

      if (!date) {
        showAlert("Validation Error", "Please select a date.");
        return false;
      }
      if (date > today) {
        showAlert("Validation Error", "Date cannot be in the future.");
        return false;
      }

      if (!brand || !/^[A-Za-z\s]+$/.test(brand)) {
        showAlert("Validation Error", "Oil brand must contain only letters and spaces.");
        return false;
      }

      if (!grade || !/^\d{1,2}W-\d{2}$/.test(grade)) {
        showAlert("Validation Error", "Oil grade must be like 5W-30 or 10W-40.");
        return false;
      }

      if (!type) {
        showAlert("Validation Error", "Please select an oil type.");
        return false;
      }

      if (!details) {
        showAlert("Validation Error", "Please enter details.");
        return false;
      }

      return true;
    }
  </script>

</body>
</html>
