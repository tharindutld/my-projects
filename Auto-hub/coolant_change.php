<?php include 'db.php'; ?>
<?php include 'navbar.php'; ?>
<?php include 'footer.php'; ?>

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $date = $_POST['date'];
    $brand = $_POST['coolant_brand'];
    $type = $_POST['coolant_type'];
    $details = $_POST['details'];

    // Server-side date validation: cannot be future
    $today = date("Y-m-d");
    if ($date > $today) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Date cannot be in the future!</p>";
        echo "<script>
                setTimeout(function(){
                    var msg = document.getElementById('errorMsg');
                    if(msg){ msg.style.display = 'none'; }
                }, 3000);
              </script>";
    } elseif (empty($brand) || !preg_match("/^[A-Za-z0-9\s]+$/", $brand)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Coolant brand should only contain letters, numbers, and spaces.</p>";
        echo "<script>
                setTimeout(function(){
                    var msg = document.getElementById('errorMsg');
                    if(msg){ msg.style.display = 'none'; }
                }, 3000);
              </script>";
    } elseif (empty($type)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Please select a coolant type.</p>";
        echo "<script>
                setTimeout(function(){
                    var msg = document.getElementById('errorMsg');
                    if(msg){ msg.style.display = 'none'; }
                }, 3000);
              </script>";
    } elseif (empty($details)) {
        echo "<p id='errorMsg' style='color:#ff5252; text-align:center;'>Please enter details.</p>";
        echo "<script>
                setTimeout(function(){
                    var msg = document.getElementById('errorMsg');
                    if(msg){ msg.style.display = 'none'; }
                }, 3000);
              </script>";
    } else {
        // Insert into coolant_changes table
        $sql = "INSERT INTO coolant_changes (log_date, coolant_brand, coolant_type, details) 
                VALUES ('$date', '$brand', '$type', '$details')";
        if ($conn->query($sql)) {
            echo "<p id='successMsg' style='color:lime; text-align:center;'>Coolant Change logged successfully!</p>";
            echo "<script>
                    setTimeout(function(){
                        var msg = document.getElementById('successMsg');
                        if(msg){ msg.style.display = 'none'; }
                    }, 3000);
                  </script>";
        } else {
            echo "Error: " . $conn->error;
        }
    }
}
?>

<!DOCTYPE html>
<html>
<head>
  <title>Coolant Change</title>
  <style>
body { 
  background: #0d0d0d;   
  color: #e0ffe0;        
  font-family: Arial, sans-serif; 
  padding: 50px; 
  margin: 0;
  margin-bottom: 50px;
}

h2 { 
  color: #4caf50;        
  text-align: center; 
  margin-bottom: 30px;
}

form {
  background: #1a1a1a;   
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
  color: #a5d6a7;       
}

input, select, textarea {
  width: 100%; 
  padding: 12px; 
  margin-bottom: 18px;
  border: none; 
  border-radius: 8px;
  background: #2a2a2a; 
  color: #e0ffe0;       
  font-size: 14px;
  box-sizing: border-box;
}

textarea { resize: none; }

button { 
  width: 100%;
  padding: 12px; 
  background: #4caf50;   
  color: #0d0d0d;        
  font-weight: bold; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 16px;
  transition: 0.3s ease;
  margin-top: 10px;
}

button:hover { 
  background: #388e3c;   
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

  /* Alert Box */
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

<h2>Coolant Change</h2>
<form method="POST" onsubmit="return validateForm()">
  <label for="date">Date:</label>
  <input type="date" name="date" id="date">

  <label for="coolant_brand">Coolant Brand:</label>
  <input type="text" name="coolant_brand" id="coolant_brand" placeholder="e.g., Prestone, Zerex">

  <label for="coolant_type">Coolant Type:</label>
  <select name="coolant_type" id="coolant_type">
    <option value="">-- Select --</option>
    <option value="Inorganic">Inorganic</option>
    <option value="Organic">Organic</option>
    <option value="Hybrid">Hybrid</option>
  </select>

  <label for="details">Details:</label>
  <textarea name="details" id="details" rows="4" placeholder="Any notes..."></textarea>

  <button type="submit">Save</button>
</form>

<div style="text-align:center; margin-top:20px;">
  <a href="oil_change.php" style="color:#4caf50; font-weight:bold; margin:0 10px;" 
     onmouseover="this.style.color='#388e3c'" onmouseout="this.style.color='#4caf50'">Go to Gear Oil Change</a> | 
  <a href="transmission_oil_change.php" style="color:#4caf50; font-weight:bold; margin:0 10px;" 
     onmouseover="this.style.color='#388e3c'" onmouseout="this.style.color='#4caf50'">Go to Transmission Oil Change</a> | 
  <a href="filter_change.php" style="color:#4caf50; font-weight:bold; margin:0 10px;" 
     onmouseover="this.style.color='#388e3c'" onmouseout="this.style.color='#4caf50'">Go to Filter Change</a> | 
  <a href="airfilter_change.php" style="color:#4caf50; font-weight:bold; margin:0 10px;" 
     onmouseover="this.style.color='#388e3c'" onmouseout="this.style.color='#4caf50'">Go to Air Filter Change</a>
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
    const brand = document.getElementById("coolant_brand").value.trim();
    const type = document.getElementById("coolant_type").value.trim();
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
    if (!brand) {
        showAlert("Validation Error", "Please enter coolant brand.");
        return false;
    }
    const brandRegex = /^[A-Za-z0-9\s]+$/;
    if (!brandRegex.test(brand)) {
        showAlert("Validation Error", "Coolant brand should only contain letters, numbers, and spaces.");
        return false;
    }
    if (!type) {
        showAlert("Validation Error", "Please select a coolant type.");
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
