(function () {
  // Helper to get and save users from localStorage
  function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
  }
  function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  // SIGNUP
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const empId = document.getElementById("employeeId").value.trim();
      const mobile = document.getElementById("mobile").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const location = document.getElementById("location").value;

      if (!name || !empId || !mobile || !email || !password || !location) {
        alert("⚠️ Please fill out all fields.");
        return;
      }
      if (!email.endsWith("@karmic.co.in")) {
        alert("⚠️ Please use your official @karmic.co.in email.");
        return;
      }

      let users = getUsers();
      const exists = users.some((u) => u.email === email);
      if (exists) {
        alert("⚠️ Email already registered. Please login instead.");
        return;
      }

      users.push({ name, empId, mobile, email, password, location });
      saveUsers(users);

      alert("✅ Registration successful! Redirecting to login...");
      setTimeout(() => (window.location.href = "index.html"), 800);
    });
  }

  // LOGIN
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const msg = document.getElementById("loginMsg");

      if (!email || !password) {
        msg.textContent = "Please enter both email and password.";
        return;
      }

      // Admin login
      if (email === "admin@karmic.co.in" && password === "admin123") {
        localStorage.setItem("loggedIn", JSON.stringify({ email, role: "admin" }));
        window.location.href = "admin.html";
        return;
      }

      // Employee login
      const users = getUsers();
      const user = users.find((u) => u.email === email && u.password === password);

      if (user) {
        localStorage.setItem("loggedIn", JSON.stringify({ email, role: "employee" }));

        // Disable notifications if WFH/Other
        if (user.location === "Work From Home" || user.location === "Other") {
          user.notify = false;
          saveUsers(users);
        }

        window.location.href = "employee.html";
      } else {
        msg.textContent = "Invalid credentials or unregistered email.";
      }
    });
  }

  // LOGOUT
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedIn");
      window.location.href = "index.html";
    });
  }
})();
