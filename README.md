# Karmic Solutions Meals – README

## Project Overview

**Karmic Solutions Meals** is a web-based meal management system designed for employees and administrators of Karmic Solutions. The system allows employees to select and confirm their meals for the next day, while administrators can manage daily menus and generate booking reports. The application is built using HTML, CSS, and JavaScript and uses **localStorage** for data storage.

## Key Features

### Employee Features

* **User Registration & Login** using official company email.
* **Meal Selection for Next Day** (Breakfast, Lunch, Snacks).
* **Opt-Out Option** if the employee does not want a meal.
* **Editable Selection Until 9:00 PM** (deadline for confirmation).
* **Meal History View** for previously confirmed meals.
* **Reminder Notifications** to confirm meals before the deadline.

### Admin Features

* **Admin Login Portal**
* **Add or Manage Daily Menu Items**
* **View Employee Meal Bookings**
* **Generate Daily Meal Reports**
* **Download Booking Reports in CSV format**

## Technologies Used

HTML5 – Website structure
CSS3 – UI design and layout
JavaScript (Vanilla JS) – Application logic and interactivity
LocalStorage – Client-side data storage
Service Worker – Notification support for reminders

## Project Structure

```
/project-folder
│
├── index.html           → Login page
├── signup.html          → Employee registration
├── employee.html        → Employee dashboard
├── admin.html           → Admin dashboard
│
├── styles/
│   └── style.css        → Application styling
│
├── js/
│   ├── utils.js         → LocalStorage helper functions
│   ├── auth.js          → User registration and login logic
│   ├── login.js         → Login toggle and authentication
│   ├── employee.js      → Employee dashboard logic
│   ├── employee-module.js → Meal confirmation system
│   └── admin.js         → Admin menu and report management
│
└── sw.js                → Service worker for notifications
```

## How the System Works

### Employee Workflow

1. Employee registers using their **@karmic.co.in** email.
2. After login, the employee accesses the **meal confirmation dashboard**.
3. Employees select meal items for the **next day**.
4. Selections can be modified until **9:00 PM**.
5. The system saves selections in **localStorage**.
6. Employees receive **reminders** to confirm meals before the deadline.

### Admin Workflow

1. Admin logs in using admin credentials.
2. Admin adds or edits the **daily menu**.
3. Employees select meals from this menu.
4. Admin can view the **total quantity of each item booked**.
5. Reports can be **generated and exported as CSV**.

## Data Storage

The application stores information using **localStorage**:

```
users           → Registered employee accounts
menus           → Daily menu items
bookings        → Employee meal selections
confirmations   → Confirmed meal choices
reports         → Generated admin reports
```

## Installation / Running the Project

1. Download or clone the project files.
2. Ensure the folder structure remains unchanged.
3. Open the project folder in **VS Code or any code editor**.
4. Run the application by opening **index.html** in a browser.

No server or database setup is required since the project uses **browser localStorage**.

## Future Improvements

* Integrate **backend database (Firebase / MongoDB)** for persistent data.
* Add **role-based authentication system**.
* Implement **email or push notifications** for reminders.
* Improve **UI/UX design and accessibility**.
* Add **multi-location meal management** for different offices.

## Disclaimer

This project is an **educational prototype** created for demonstration purposes. It currently stores all data in the browser using localStorage and does not use a production database or authentication server.

## Conclusion

The **Karmic Solutions Meals System** simplifies meal planning for employees and administrators. By allowing employees to confirm meals in advance and enabling admins to track meal demand, the system helps improve efficiency and reduce food wastage.
