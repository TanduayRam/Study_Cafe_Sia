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
| A - Maldan | `TanduayRam` | `roles, users,token_blacklist` | `/auth/login`, `/auth/logout`, `/users (CRUD)`, `/roles.` `Screens:login`, `users` | `Users with their role (INNER)` | `Core: login`, `JWT`, `role checks`, `shared layout`, `DB connection` |
| B - Pastrana | `nicoledcaeley` | `study_zones`, `seats`, `menu_items` | `/study-zones`, `/seats`, `/menu-items`; Zones, Seats, and Menu screens | Seats with no active reservation (LEFT) | Master data |
| C - Malingin |  |  |  |  |  |
| D - Pontunila | `jiyownn` | `pass_packages`, `member_passes`, `payments` | Pass Packages, Member Passes, Payments, and Checkout screens | To be verified | Pass and Payment Management |
| E - Macias |  |  |  |  |  |
| F - Javier |  |  |  |  |  |
