<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AutoHub</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #121212;
      color: #fff;
    }

    /* Navbar styling */
    .navbar {
      background: #111;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }

    .navbar .logo {
      color: #00bcd4;
      font-size: 1.8rem;
      font-weight: bold;
      display: flex;
      align-items: center;
    }

    .navbar .logo span {
      margin-left: 8px;
    }

    .navbar .date-time {
      font-size: 14px;
      color: #ccc;
    }
  </style>
</head>
<body>

  <div class="navbar">
    <div class="logo">🚗 <span>AutoHub</span></div>
    <div class="date-time" id="clock"></div>

<script>
function updateClock() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert to 12-hour format
    minutes = minutes < 10 ? '0'+minutes : minutes;
    const timeStr = hours + ':' + minutes + ' ' + ampm;
    document.getElementById('clock').innerText = dateStr + ' | ' + timeStr;
}

// Update immediately
updateClock();
// Update every second
setInterval(updateClock, 1000);
</script>

  </div>

</body>
</html>
