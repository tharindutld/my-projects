<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $vehicle_model = $_POST['vehicle_model'];
    $year = $_POST['year'];
    $model = $_POST['model'];
    $engine = $_POST['engine_capacity'];
    $transmission = $_POST['transmission'];

    $sql = "INSERT INTO running_logs (vehicle_model, manufacturing_year, model, engine_capacity, transmission) 
            VALUES ('$vehicle_model', '$year', '$model', '$engine', '$transmission')";
    
    if ($conn->query($sql)) {
        echo "<div id='successMessage' style='
                background-color: #4caf50;
                color: #fff;
                padding: 10px;
                border-radius: 6px;
                text-align: center;
                margin-bottom: 15px;'>
                ✅ Running Log saved successfully!
              </div>";

        // JavaScript to hide message after 3 seconds
        echo "<script>
                setTimeout(function() {
                    var msg = document.getElementById('successMessage');
                    if (msg) {
                        msg.style.display = 'none';
                    }
                }, 3000);
              </script>";
    } else {
        echo "<div style='
                background-color: #f44336;
                color: #fff;
                padding: 10px;
                border-radius: 6px;
                text-align: center;
                margin-bottom: 15px;'>
                ❌ Error: " . $conn->error . "
              </div>";
    }
}
?>


<!DOCTYPE html>
<html>
<head>
  <title>Running Log</title>
  <style>
   body { 
  background: #121212; 
  color: #fff; 
  font-family: Arial; 
  padding: 50px; 
  margin: 0;
  margin-bottom: 50px;
}

h2 { 
  color: #00bcd4; 
  text-align: center;
  margin-bottom: 20px;
}

form {
  background: #1e1e1e;
  padding: 20px 30px 20px 20px; /* extra right padding */
  border-radius: 12px;
  max-width: 500px;
  margin: auto;
  box-sizing: border-box; /* includes padding in width calculation */
}

input, button {
  width: 100%;           /* full width of form */
  box-sizing: border-box; /* ensures padding is included */
  padding: 10px; 
  margin: 10px 0;
  border: none; 
  border-radius: 8px;
  font-size: 14px;
}

input { 
  background: #333; 
  color: #fff; 
}

button { 
  background: #00bcd4; 
  color: #121212; 
  font-weight: bold; 
  cursor: pointer;
  transition: 0.3s;
}

button:hover { 
  background: #0097a7; 
}

.maintenance {
  display: flex; 
  justify-content: center; 
  gap: 10px; 
  margin-top: 20px;
}

.maintenance a {
  background: #333; 
  padding: 12px 20px; 
  border-radius: 8px;
  color: #00bcd4; 
  text-decoration: none; 
  font-weight: bold;
  transition: 0.3s;
}

.maintenance a:hover { 
  background: #00bcd4; 
  color: #121212; 
}

  </style>
</head>
<body>
  <h2>Running Log</h2>
  <form method="POST">
    <input type="text" name="vehicle_model" placeholder="Vehicle Model" required>
    <input type="number" name="year" placeholder="Manufacturing Year" required>
    <input type="text" name="model" placeholder="Model" required>
    <input type="text" name="engine_capacity" placeholder="Engine Capacity" required>
    <input type="text" name="transmission" placeholder="Transmission Type" required>
    <button type="submit">Save</button>
  </form>

  <div class="maintenance">
    <a href="oil_change.php"> Gear Oil Change</a>
     <a href="transmission_oil_change.php">Transmission Oil Change</a>
    <a href="coolant_change.php">Coolant Change</a>
    <a href="filter_change.php">Filter Change</a>
    <a href="airfilter_change.php">Air Filter Change</a>
   
  </div>
</body>
</html>
