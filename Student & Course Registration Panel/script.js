function validateStudentForm() {
  let name = document.getElementById("studentName").value;
  let email = document.getElementById("studentEmail").value;
  let phone = document.getElementById("studentPhone").value;

  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let phoneRegex = /^[0-9]{10}$/;

  if (name.trim() === "") {
    alert("Name is required");
    return false;
  }
  if (!emailRegex.test(email)) {
    alert("Enter a valid email");
    return false;
  }
  if (!phoneRegex.test(phone)) {
    alert("Enter a valid 10-digit phone number");
    return false;
  }
  return true;
}

function validateCourseForm() {
  let name = document.getElementById("courseName").value;
  let desc = document.getElementById("courseDesc").value;

  if (name.trim() === "") {
    alert("Course name is required");
    return false;
  }
  if (desc.trim() === "") {
    alert("Description is required");
    return false;
  }
  return true;
}
