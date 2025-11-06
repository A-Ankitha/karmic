document.addEventListener("DOMContentLoaded", () => {
  const empBtn = document.getElementById("employeeBtn");
  const adminBtn = document.getElementById("adminBtn");
  const empLogin = document.getElementById("employeeLogin");
  const adminLogin = document.getElementById("adminLogin");

  empBtn.addEventListener("click", () => {
    empBtn.classList.add("active");
    adminBtn.classList.remove("active");
    empLogin.classList.remove("hidden");
    adminLogin.classList.add("hidden");
  });

  adminBtn.addEventListener("click", () => {
    adminBtn.classList.add("active");
    empBtn.classList.remove("active");
    adminLogin.classList.remove("hidden");
    empLogin.classList.add("hidden");
  });
});

function loginUser(type) {
  const msg = document.getElementById("loginMsg");

  if (type === "employee") {
    const email = document.getElementById("empEmail").value.trim();
    const pass = document.getElementById("empPassword").value.trim();

    // Example: check localStorage (you can modify later for Firebase)
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const found = users.find(u => u.email === email && u.password === pass);

    if (found) {
      msg.textContent = "Employee login successful ✅";
      msg.style.color = "green";
      setTimeout(() => {
        window.location.href = "employee.html";
      }, 1000);
    } else {
      msg.textContent = "Invalid employee credentials.";
      msg.style.color = "red";
    }

  } else if (type === "admin") {
    const email = document.getElementById("adminEmail").value.trim();
    const pass = document.getElementById("adminPassword").value.trim();

    if (email === "admin@karmic.co.in" && pass === "admin123") {
      msg.textContent = "Admin login successful ✅";
      msg.style.color = "green";
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 1000);
    } else {
      msg.textContent = "Access Denied! Only authorized admins can login.";
      msg.style.color = "red";
    }
  }
}
