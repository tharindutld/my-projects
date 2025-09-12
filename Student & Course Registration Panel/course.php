<?php include 'db.php'; ?>
<?php include 'includes/navbar.php'; ?>
<?php include 'includes/sidebar.php'; ?>
<?php include 'includes/header.php'; ?>

<main class="content">
  <h2>Register Course</h2>
   <div class="course-form-container">
  <form method="POST" onsubmit="return validateCourseForm()">
    <label>Course Name</label>
    <input type="text" name="course_name" id="courseName" required>

    <label>Description</label>
    <textarea name="description" id="courseDesc" required></textarea>

    <button type="submit">Register</button>
  </form>
</div>
  <?php
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $course_name = $_POST['course_name'];
        $description = $_POST['description'];

        $sql = "INSERT INTO courses (course_name, description) VALUES ('$course_name', '$description')";
        if ($conn->query($sql) === TRUE) {
            echo "<p class='success'>✅ Course registered successfully!</p>";
        } else {
            echo "<p class='error'>❌ Error: " . $conn->error . "</p>";
        }
    }
  ?>
</main>

<?php include 'includes/footer.php'; ?>
