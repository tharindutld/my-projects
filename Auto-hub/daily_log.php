<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $mileage = trim($_POST['mileage']);
    $date = $_POST['date'];

    // Insert into database (no server-side validation)
    $sql = "INSERT INTO daily_logs (log_date, mileage) VALUES ('$date', '$mileage')";
    if ($conn->query($sql)) {
        echo "<script>
            showAlert('Success', '✅ Daily Log saved successfully!');
        </script>";
    } else {
        echo "<script>
            showAlert('Error', '❌ Failed to save: " . addslashes($conn->error) . "');
        </script>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Daily Log</title>
  <style>
    body { 
      background: #121212; 
      color: #fff; 
      font-family: Arial, sans-serif; 
      padding: 50px; 
      margin: 0;
    }

    h2 { 
      color: #00bcd4; 
      text-align: center;
      margin-bottom: 20px;
    }

    form {
      background: #1e1e1e;
      padding: 25px 30px;
      border-radius: 12px;
      max-width: 420px;
      margin: auto;
      box-shadow: 0px 4px 15px rgba(0,0,0,0.6);
    }

    label {
      display: block;
      margin-top: 12px;
      margin-bottom: 6px;
      text-align: left;
      font-weight: bold;
    }

    input, button {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      margin: 12px 0;
      border: none;
      border-radius: 8px;
      font-size: 14px;
    }

    input { 
      background: #2a2a2a; 
      color: #fff; 
    }

    button { 
      background: #00bcd4; 
      color: #121212; 
      font-weight: bold; 
      cursor: pointer;
      transition: 0.3s;
      font-size: 16px;
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
  <h2>Daily Log</h2>
  <form method="POST" onsubmit="return validateForm()">
    <label>Date:</label>
    <input type="date" name="date" id="date" >
    <label>Daily Start Mileage:</label>
    <input type="number" name="mileage" id="mileage" min="0">
    <button type="submit">Save</button>
  </form>

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
      const mileage = document.getElementById("mileage").value.trim();
      const today = new Date().toISOString().split("T")[0];

      if (!date) {
        showAlert("Validation Error", "Please select a date.");
        return false;
      }
      if (date > today) {
        showAlert("Validation Error", "Date cannot be in the future.");
        return false;
      }

      if (!mileage) {
        showAlert("Validation Error", "Mileage is required.");
        return false;
      }
      if (isNaN(mileage) || mileage < 0) {
        showAlert("Validation Error", "Mileage must be a positive number.");
        return false;
      }

      return true; // Allow form submission
    }
  </script>
</body>
</html>
