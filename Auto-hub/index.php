<?php include 'navbar_home.php'; ?>
<?php include 'footer.php'; ?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Landing Page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Added -->
  <style>
    body {
      background: #121212;
      color: #fff;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 100px;
    }
    h1 { font-size: 2.5rem; margin-bottom: 50px; }
    .btn {
      display: inline-block;
      margin: 20px;
      padding: 20px 40px;
      background: #1e1e1e;
      border: 2px solid #00bcd4;
      border-radius: 12px;
      text-decoration: none;
      color: #00bcd4;
      font-size: 1.5rem;
      transition: 0.3s;
    }
    .btn:hover {
      background: #00bcd4;
      color: #121212;
    }

    /* Responsive styles */
    @media (max-width: 768px) {
      body {
        padding: 50px 20px;
      }
      h1 {
        font-size: 2rem;
        margin-bottom: 30px;
      }
      .btn {
        display: block;
        width: 100%;
        max-width: 300px;
        margin: 15px auto;
        padding: 15px 20px;
        font-size: 1.2rem;
      }
    }

    @media (max-width: 480px) {
      body {
        padding: 30px 15px;
      }
      h1 {
        font-size: 1.5rem;
      }
      .btn {
        font-size: 1rem;
        padding: 12px 18px;
      }
    }
  </style>
</head>
<body>
  <h1>Welcome ! Please Login to choose your log &#128512; <!-- 😀 -->   </h1>
  <!-- <a href="daily_log.php" class="btn">Daily Log</a>
  <a href="running_log.php" class="btn">Running Log</a> -->
  <a href="login.php" class="btn">Log in</a>
  
</body>
</html>
