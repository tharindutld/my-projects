<?php
include 'db.php';
$success = $error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);

    if($name && $email && $phone){
        // Prepared statement to prevent SQL injection
        $stmt = $conn->prepare("INSERT INTO students (name, email, phone) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $name, $email, $phone);

        if($stmt->execute()){
            $success = "✅ Student registered successfully!";
        } else {
            $error = "❌ Error: " . $stmt->error;
        }
        $stmt->close();
    } else {
        $error = "❌ Please fill all fields!";
    }
}
?>

<?php include 'includes/header.php'; ?>
<?php include 'includes/navbar.php'; ?>
<?php include 'includes/sidebar.php'; ?>

<main class="content">
  <div class="student-form-container">
    <h2>Register Student</h2>

    <?php if($success) echo "<p class='success'>$success</p>"; ?>
    <?php if($error) echo "<p class='error'>$error</p>"; ?>

    <form method="POST" onsubmit="return validateStudentForm()">
      <label for="studentName">Name</label>
      <input type="text" name="name" id="studentName" required>

      <label for="studentEmail">Email</label>
      <input type="email" name="email" id="studentEmail" required>

      <label for="studentPhone">Phone</label>
      <input type="text" name="phone" id="studentPhone" required>

      <button type="submit">Register</button>
    </form>
  </div>
</main>

<?php include 'includes/footer.php'; ?>
