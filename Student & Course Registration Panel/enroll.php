<?php include 'db.php'; ?>
<?php include 'includes/navbar.php'; ?>
<?php include 'includes/sidebar.php'; ?>
<?php include 'includes/header.php'; ?>

<main class="content">
  <h2>Enroll Student</h2>

  <form method="POST">
    <label>Search Student</label>
    <input type="text" name="search_student" placeholder="Enter student name or email">
    <button type="submit" name="find_student">Search</button>
  </form>

  <?php
    if (isset($_POST['find_student'])) {
        $search = $_POST['search_student'];
        $res = $conn->query("SELECT * FROM students WHERE name LIKE '%$search%' OR email LIKE '%$search%'");

        if ($res->num_rows > 0) {
            echo "<table class='styled-table'>
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th></tr></thead><tbody>";
            while ($row = $res->fetch_assoc()) {
                echo "<tr><td>{$row['id']}</td><td>{$row['name']}</td><td>{$row['email']}</td><td>{$row['phone']}</td></tr>";
                $student_id = $row['id'];
            }
            echo "</tbody></table>";
        } else {
            echo "<p class='error'>❌ No student found.</p>";
        }
    }
  ?>

  <form method="POST">
    <label>Student ID</label>
    <input type="number" name="student_id" required>

    <label>Select Course</label>
    <select name="course_id" required>
      <?php
        $courses = $conn->query("SELECT * FROM courses");
        while ($c = $courses->fetch_assoc()) {
            echo "<option value='{$c['id']}'>{$c['course_name']}</option>";
        }
      ?>
    </select>

    <button type="submit" name="enroll">Enroll</button>
  </form>

  <?php
    if (isset($_POST['enroll'])) {
        $student_id = $_POST['student_id'];
        $course_id = $_POST['course_id'];

        $sql = "INSERT INTO enrollments (student_id, course_id) VALUES ('$student_id', '$course_id')";
        if ($conn->query($sql) === TRUE) {
            echo "<p class='success'>✅ Student enrolled successfully!</p>";
        } else {
            echo "<p class='error'>❌ Error: " . $conn->error . "</p>";
        }
    }
  ?>
</main>

<?php include 'includes/footer.php'; ?>
