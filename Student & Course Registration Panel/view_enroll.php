<?php include 'db.php'; ?>
<?php include 'includes/navbar.php'; ?>
<?php include 'includes/sidebar.php'; ?>
<?php include 'includes/header.php'; ?>

<main class="content">
  <h2>View Enrollments</h2>

  <?php
    $sql = "SELECT e.id, s.name AS student, s.email, c.course_name, e.enrolled_at
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c ON e.course_id = c.id";
    $res = $conn->query($sql);

    if ($res->num_rows > 0) {
        echo "<table class='styled-table'>
                <thead>
                  <tr>
                    <th>Enrollment ID</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Enrolled At</th>
                  </tr>
                </thead><tbody>";
        while ($row = $res->fetch_assoc()) {
            echo "<tr>
                    <td>{$row['id']}</td>
                    <td>{$row['student']}</td>
                    <td>{$row['email']}</td>
                    <td>{$row['course_name']}</td>
                    <td>{$row['enrolled_at']}</td>
                  </tr>";
        }
        echo "</tbody></table>";
    } else {
        echo "<p class='error'>❌ No enrollments found.</p>";
    }
  ?>
</main>

<?php include 'includes/footer.php'; ?>
