<!DOCTYPE html>
<html>
<head>
  <style>
    /* Navbar styling */
    .navbar {
      background: #1e1e1e;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #00bcd4;
    }
    .navbar .logo {
      color: #00bcd4;
      font-size: 1.8rem;
      font-weight: bold;
      text-decoration: none;
    }
    .navbar ul {
      list-style: none;
      display: flex;
      gap: 20px;
      margin: 0;
      padding: 0;
    }
    .navbar ul li a {
      color: #fff;
      text-decoration: none;
      font-size: 1.1rem;
      transition: 0.3s;
    }
    .navbar ul li a:hover {
      color: #00bcd4;
    }
  </style>
</head>
<body>
  <div class="navbar">
    <a href="index.php" class="logo">AutoHub</a>
    <ul>
      <li><a href="index.php">Home</a></li>
      <li><a href="daily_log.php">Daily Log</a></li>
      <li><a href="running_log.php">Running Log</a></li>
      
    </ul>
  </div>
</body>
</html>
