// employee.js – Handles employee dashboard and order confirmation

document.addEventListener("DOMContentLoaded", () => {

  // ✅ Get user if logged in
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // ✅ Show employee name on dashboard (optional)
  if (loggedInUser && loggedInUser.role === "employee") {
    const nameBox = document.getElementById("employeeName");
    if (nameBox) {
      nameBox.innerText = `Welcome, ${loggedInUser.name}`;
    }
  }

  // ✅ Confirm Order button
  const confirmBtn = document.getElementById("confirmBtn");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {

      // ✅ Show success message
      alert("✅ Your order has been confirmed!");

      // ✅ Save order history
      let orders = JSON.parse(localStorage.getItem("orders")) || [];

      orders.push({
        email: loggedInUser ? loggedInUser.email : "Unknown User",
        name: loggedInUser ? loggedInUser.name : "Guest",
        time: new Date().toLocaleString()
      });

      localStorage.setItem("orders", JSON.stringify(orders));
    });
  }

  // ✅ Logout button (optional, only works if exists in HTML)
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      alert("Logged out successfully!");
      window.location.href = "index.html";
    });
  }
});