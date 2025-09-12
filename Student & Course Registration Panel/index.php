<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Panel - Dashboard</title>
  <link rel="stylesheet" href="style.css"> <!-- External CSS linked -->
</head>
<body>
  <?php include 'includes/navbar.php'; ?>
  <?php include 'includes/sidebar.php'; ?>

  <main class="content">
    <h2>Dashboard </h2>
    <div class="cards">
      <div class="card">
        <?php
          include 'db.php';
          $res = $conn->query("SELECT COUNT(*) AS total FROM students");
          $row = $res->fetch_assoc();
          echo "<h3>{$row['total']}</h3><p>Total Students</p>";
        ?>
      </div>
      <div class="card">
        <?php
          $res = $conn->query("SELECT COUNT(*) AS total FROM courses");
          $row = $res->fetch_assoc();
          echo "<h3>{$row['total']}</h3><p>Total Courses</p>";
        ?>
      </div>
      <div class="card">
        <?php
          $res = $conn->query("SELECT COUNT(*) AS total FROM enrollments");
          $row = $res->fetch_assoc();
          echo "<h3>{$row['total']}</h3><p>Total Enrollments</p>";
        ?>
      </div>
    </div>
  </main>

  <?php include 'includes/footer.php'; ?>
</body>
</html>
