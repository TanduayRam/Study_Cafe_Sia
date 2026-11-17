# STUDY CAFE
## Study Cafe Reservation, Billing and Monitoring System

SIA (Systems Integration and Architecture) Final Project

## Group Members

| No. | Name |
|---|---|
| 1 | Maldan |
| 2 | Pastrana |
| 3 | Malingin |
| 4 | Pontunilla |
| 5 | Macias |
| 6 | Javier |

## Section

C

## Project Description

**Study Cafe Reservation, Billing and Monitoring System: book a seat, pay fairly, and keep the cafe running smoothly.**

The Study Cafe Reservation, Billing and Monitoring System is a web-based platform for a study cafe. It helps administrators, staff, and members manage study zones, seats, and the food and drink menu; make and check in reservations; place orders during a visit; use prepaid hour passes; and pay at check-out. The system provides login with role-based access (Admin, Staff, Member), seat and zone management, reservations with check-in and check-out, order entry with stock control, pass packages and member passes, payments and billing, automatic alerts, an audit log, member reviews, and a dashboard with join reports.

## Unique Major Feature

**Smart Session Billing and Monitoring Engine:** automatic no-show release, pass hours used before cash, overtime and peak pricing, split payment when a pass runs short, overstay and capacity alerts, and a full audit trail.

- A reservation that is not checked in 15 minutes after its start becomes a No-Show and its seat is released.
- At check-out, pass hours are used first (earliest expiry first). If the pass runs short, the remaining hours are paid in cash in the same payment (pass part plus cash part).
- Overtime is billed in cash per started 30 minutes. Peak hours (4 PM to 8 PM) add 10 percent.
- Alerts are created automatically for overstay, zone capacity, and low stock, without duplicate open alerts.
- Every automatic action is written to the audit log as **System**.

## Ownership Matrix

| Member | GitHub Username | Tables | Endpoints / Screens | Join Report(s) and Join Type | Feature Role |
|---|---|---|---|---|---|
| Maldan | `TanduayRam` | `roles`, `users`, `token_blacklist` | `/auth/*`, `/users`, `/roles` / Login Page, Users | Users with their role (INNER JOIN) | Core: Login, JWT, Role Checks, Shared Layout, DB Connection |
| Pastrana | `nicoledcaeley` | `study_zones`, `seats`, `menu_items` | `/study-zones`, `/seats`, `/menu-items` / Zones, Seats, Menu | Seats with no active reservation (LEFT JOIN) | Master Data |
| Malingin | `chrisbrowny05` | `reservations`, `orders`, `order_items` | `/reservations` (check-in, check-out), `/orders`, `/order-items` / Reservations, Order Entry | Reservations with seat, zone, member, and order totals (INNER JOIN) | Transactions |
| Pontunilla | `jiyownn` | `pass_packages`, `member_passes`, `payments` | `/pass-packages`, `/member-passes`, `/payments`, `/billing` / Pass Packages, Member Passes, Payments and Billing | Pass balance per member (INNER JOIN) | Unique Feature (Rules): Pricing, Pass Use, No-Show Release |
| Macias | `lowiij` | `session_logs`, `alerts`, `audit_logs` | `/session-logs`, `/alerts`, `/audit-logs`, `/engine/check` / Alerts and Engine, Audit and Sessions | Members with passes vs members with reservations (FULL OUTER via UNION) | Unique Feature (Workflow): Alerts, Audit |
| Javier | `Egoistmoe` | `feedback_reviews`, `report_snapshots` | `/reviews`, `/report-snapshots`, `/dashboard/summary` / Dashboard, Reviews, Join Reports | Order count per menu item (RIGHT JOIN) | Reports, Dashboard, ER Diagram, API List |

## API Overview

Base path: `/api/v1`. Send `Authorization: Bearer <token>` on every request except register and login.

- Success format: `{ "success": true, "data": ..., "message": "..." }`
- Error format: `{ "success": false, "error": { "code": "...", "message": "..." } }`
- Status codes: `200` OK, `201` Created, `400` Validation or rule refused, `401` Not logged in, `403` Role not allowed, `404` Not found, `500` Server error

| Area | Main routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users | `/users`, `/users/members`, `/roles` |
| Master data | `/study-zones`, `/seats`, `/menu-items` |
| Reservations | `/reservations`, `/reservations/:id/check-in`, `/reservations/:id/check-out` |
| Orders | `/orders`, `/orders/:id/status`, `/order-items` |
| Passes and payments | `/pass-packages`, `/member-passes`, `/payments`, `/payments/:id/void` |
| Billing | `GET /billing/compute/:reservationId`, `POST /billing/release-no-shows` |
| Monitoring | `/session-logs`, `/alerts`, `/audit-logs`, `POST /engine/check` |
| Reviews and reports | `/reviews`, `/report-snapshots`, `/dashboard/summary` |
| Join reports | `/reports/users-roles`, `/reports/idle-seats`, `/reports/reservation-orders`, `/reports/member-passes`, `/reports/member-activity`, `/reports/menu-item-orders` |

## How to Run Study Cafe Reservation, Billing and Monitoring System

Follow these steps to set up and run the project on your computer.

### Prerequisites

Make sure the following are installed on your computer:

- Node.js
- Git
- MySQL
- MySQL Workbench
- Visual Studio Code

### Step 1. Create a Project Folder
### Step 2. Clone the Repository

Run the following command:

```bash
git clone https://github.com/TanduayRam/Study_Cafe_Sia.git .
```

### Step 3. Install Dependencies

Inside the project directory, run:

```bash
npm install
```
### Step 4. Initialize the Database

Open MySQL Workbench and connect to your local MySQL server.

1. Open and execute the `schema.sql` file located in the `databases` folder. This creates the `study_cafe_sia` database and all 17 tables.
2. Open and execute the `seed.sql` file located in the `databases` folder. This adds the roles, demo accounts, zones, seats, menu items, and pass packages.

### Step 5. Open the Project in VS Code

Run:

```bash
code .
```

### Step 6. Configure the Environment Variables

Locate the `.env.example` file in the project root directory.
Create a copy of the file and rename the copied file to `.env`.
Open `.env` and enter your local MySQL credentials.

**Important:** Do not rename or modify `.env.example`. Only edit your personal `.env` file.

### Step 7. Start MySQL

### Step 8. Start the Backend Server

In VS Code, open the integrated terminal and run:

```bash
npm start
```

Wait for the message `Study Cafe server running at http://localhost:3123`.
Keep the terminal running while using the application.

### Step 9. Open the Application

Open your preferred web browser (Google Chrome, Microsoft Edge, or Firefox).
Enter the following address in the browser:

```text
http://localhost:3123/
```

Press Enter to access the system login page. Make sure the backend server is still running while accessing the application.

## Demo Accounts

The following demo accounts are provided for testing the Study Cafe Reservation, Billing and Monitoring System.

| Role | Name | Email | Demo Note |
|---|---|---|---|
| Admin | Cafe Admin | admin@studycafe.com | Full access to every screen |
| Staff | Cafe Staff | staff@studycafe.com | Check-in, check-out, orders, alerts |
| Member | Nicole Ed Caeley Pastrana | nicolay@studycafe.com | Has a pass with only 2 hours left (shows the split pass and cash payment) |
| Member | Carlito Javier | carlito@studycafe.com | Has a full pass and no reservations yet |
| Member | Rex Malingin | cbrowny@studycafe.com | Has no pass (pays fully in cash) |

**Note:** These accounts are for development and testing purposes only. Login passwords are shared separately with authorized team members. Do not publish passwords or other sensitive credentials in this repository.

## Optional: Automatic Engine

By default the no-show release and alert checks are run from the screens (Payments and Billing, Alerts and Engine), so a demo can use a simulated time. To run them automatically every minute, set `ENGINE_AUTO=true` in your `.env` file and restart the server.

## Important Notes

- Each computer must have its own Node.js dependencies and local MySQL server.
- Each user must configure their own `.env` file using their local MySQL credentials.
- The `.env` file is not included in the repository because it contains database credentials and the JWT secret.
- Make sure MySQL is running before starting the backend server.
- Keep the backend terminal running while accessing the application.
- All dates are stored in UTC. The 4 PM to 8 PM peak window follows the cafe time set by `CAFE_UTC_OFFSET_HOURS` (8 for the Philippines).
