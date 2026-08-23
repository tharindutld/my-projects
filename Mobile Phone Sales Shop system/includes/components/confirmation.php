<?php
// Common confirmation include using SweetAlert2
?>
<!-- Include SweetAlert2 Library -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<!-- Include Bootstrap Icons for SweetAlert buttons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

<style>
    /* Custom compact SweetAlert2 styling to make dialogs smaller and professional */
    .swal2-popup {
        width: 320px !important;
        padding: 1.25rem !important;
        border-radius: 12px !important;
        font-size: 0.9rem !important;
        font-family: 'Inter', 'Outfit', sans-serif !important;
    }
    .swal2-title {
        font-size: 1.15rem !important;
        font-weight: 600 !important;
        margin-top: 0.4rem !important;
        color: #212529 !important;
    }
    .swal2-html-container {
        font-size: 0.85rem !important;
        color: #555 !important;
        margin: 0.4rem 0 1rem 0 !important;
        line-height: 1.4 !important;
    }
    .swal2-icon {
        transform: scale(0.7) !important;
        margin: 0.1rem auto -0.4rem auto !important;
    }
    .swal2-actions {
        margin-top: 0.5rem !important;
        gap: 8px !important;
    }
    .swal2-styled {
        padding: 8px 16px !important;
        font-size: 0.8rem !important;
        font-weight: 600 !important;
        border-radius: 6px !important;
        margin: 0 !important;
    }
    .swal2-styled.swal2-confirm {
        box-shadow: none !important;
    }
    .swal2-styled.swal2-cancel {
        box-shadow: none !important;
    }
</style>

<script>
function initConfirmation() {
    // 1. Success Message Handler
    <?php 
    $s_msg = !empty($_SESSION['success_msg']) ? $_SESSION['success_msg'] : (!empty($success_msg) ? $success_msg : (!empty($_SESSION['success']) ? $_SESSION['success'] : ''));
    if (!empty($s_msg)): 
    ?>
        Swal.fire({
            icon: "success",
            title: "Success!",
            text: "<?php echo addslashes(strip_tags($s_msg)); ?>",
            confirmButtonColor: "#3085d6"
        });
        
        // Reset forms to clear out any browser-cached inputs (like in add forms)
        document.querySelectorAll('form').forEach(function(f) { f.reset(); });
        
        <?php 
        if (isset($_SESSION['success_msg'])) unset($_SESSION['success_msg']); 
        if (isset($_SESSION['success'])) unset($_SESSION['success']);
        ?>
    <?php endif; ?>

    // 2. Error Message Handler
    <?php 
    $e_msg = '';
    if (!empty($_SESSION['error_msg'])) {
        $e_msg = $_SESSION['error_msg'];
    } elseif (!empty($error_msg)) {
        $e_msg = $error_msg;
    } elseif (!empty($_SESSION['error'])) {
        $e_msg = $_SESSION['error'];
    } elseif (!empty($_SESSION['access_error'])) {
        $e_msg = $_SESSION['access_error'];
    } elseif (!empty($errors) && is_array($errors)) {
        $e_msg = implode(" ", $errors);
    }
    if (!empty($e_msg)): 
    ?>
        Swal.fire({
            icon: "error",
            title: "Error!",
            text: "<?php echo addslashes(strip_tags($e_msg)); ?>",
            confirmButtonColor: "#d33"
        });
        <?php 
        if (isset($_SESSION['error_msg'])) unset($_SESSION['error_msg']); 
        if (isset($_SESSION['error'])) unset($_SESSION['error']);
        if (isset($_SESSION['access_error'])) unset($_SESSION['access_error']);
        ?>
    <?php endif; ?>

    // 3. Pre-Submit Confirmation & Validation Handler
    // Usage: Add class="confirm-submit" and optionally data-confirm-message="..." to your <form>
    document.querySelectorAll('.confirm-submit').forEach(function(form) {
        if (form.dataset.confirmInitialized) return;
        form.dataset.confirmInitialized = "true";
        
        // Add novalidate to prevent default HTML5 browser tooltips
        form.setAttribute('novalidate', 'novalidate');
        
        // Listen for reset to remove validation styling
        form.addEventListener('reset', function() {
            form.classList.remove('was-validated');
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Custom Validation Check
            let isValid = true;
            let errorMessage = '';
            let elements = form.querySelectorAll('input, select, textarea');
            
            for (let i = 0; i < elements.length; i++) {
                let el = elements[i];
                if (!el.checkValidity()) {
                    isValid = false;
                    if (el.validity.valueMissing) {
                        errorMessage = 'Please fill out all required fields.';
                    } else {
                        // Use the custom title attribute if available, else fallback
                        errorMessage = el.getAttribute('title') || el.validationMessage || 'Please enter a valid value.';
                    }
                    el.focus();
                    break;
                }
            }
            
            if (!isValid) {
                form.classList.add('was-validated');
                Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Input',
                    text: errorMessage,
                    confirmButtonColor: '#f39c12'
                });
                return; // Stop form submission and confirmation
            }

            // If form is valid, proceed to confirmation
            let confirmMessage = form.getAttribute('data-confirm-message') || 'Are you sure you want to proceed with this action?';
            
            Swal.fire({
                title: 'Confirm Action',
                html: '<span style="font-size: 0.9em; color: #555;">' + confirmMessage + '</span>',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#0d6efd',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="bi bi-check-circle"></i> Yes, proceed',
                cancelButtonText: 'Cancel',
                customClass: {
                    title: 'fs-5' // Make title slightly smaller using Bootstrap class
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Append hidden submit field to ensure isset($_POST['submit']) works in PHP
                    let hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'submit';
                    hiddenInput.value = '1';
                    form.appendChild(hiddenInput);
                    
                    // Use HTMLFormElement prototype to bypass any elements named "submit"
                    HTMLFormElement.prototype.submit.call(form);
                }
            });
        });
    });

    // 4. Link Click Confirmation Handler
    // Usage: Add class="confirm-link" (and optionally "confirm-delete" for red styling) and data-confirm-message="..." to your <a>
    document.querySelectorAll('.confirm-link').forEach(function(link) {
        if (link.dataset.confirmInitialized) return;
        link.dataset.confirmInitialized = "true";
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            let confirmMessage = link.getAttribute('data-confirm-message') || 'Are you sure you want to proceed?';
            let isDelete = link.classList.contains('confirm-delete');
            let targetUrl = link.getAttribute('href');
            
            Swal.fire({
                title: 'Confirm Action',
                html: '<span style="font-size: 0.9em; color: #555;">' + confirmMessage + '</span>',
                icon: isDelete ? 'warning' : 'question',
                showCancelButton: true,
                confirmButtonColor: isDelete ? '#d33' : '#0d6efd',
                cancelButtonColor: '#6c757d',
                confirmButtonText: isDelete ? '<i class="bi bi-trash"></i> Yes, delete it!' : '<i class="bi bi-check-circle"></i> Yes, proceed',
                cancelButtonText: 'Cancel',
                customClass: {
                    title: 'fs-5'
                }
            }).then((result) => {
                if (result.isConfirmed && targetUrl && targetUrl !== '#') {
                    window.location.href = targetUrl;
                }
            });
        });
    });
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfirmation);
} else {
    initConfirmation();
}
</script>
