<?php
include('config/db.php');

$query = "UPDATE tbluser SET Email = REPLACE(Email, '@viva.com', '@gmail.com') WHERE Email LIKE '%@viva.com'";
$res = mysqli_query($conn, $query);

if ($res) {
    $affected = mysqli_affected_rows($conn);
    echo "Successfully updated $affected customer emails from @viva.com to @gmail.com.\n";
} else {
    echo "Error updating emails: " . mysqli_error($conn) . "\n";
}
?>
