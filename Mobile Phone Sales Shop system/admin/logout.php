<?php
session_start();
// Unset only the staff session ID to prevent logging out a regular customer if they share a browser
if(isset($_SESSION['imsaid'])){
    unset($_SESSION['imsaid']);
}
// If you want to completely destroy all sessions instead, you could use session_destroy();
header('Location: login.php');
exit();
?>
