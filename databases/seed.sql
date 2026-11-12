USE study_cafe_sia;

INSERT INTO roles (role_id, name) VALUES (1, 'Admin'), (2, 'Staff'), (3, 'Member');

INSERT INTO users (user_id, name, email, password, role_id) VALUES
(1, 'Cafe Admin',  'admin@studycafe.com', '$2a$10$WvCi9AfuBTQ5eDKSGrP33uFUmKpnTqZJo1MiIRTY2UempWny4BCSe', 1),
(2, 'Cafe Staff',  'staff@studycafe.com', '$2a$10$f7NfcZfZpHfP3l360LzZSuP86.tJHiqT3xWeOe1FeiOclVIKQtfzK', 2),
(3, 'Nicole Ed Caeley Pastrana','nicolay@studycafe.com', '$2a$10$12avytslgxYhkY2a7X3JO.C.RHn8CpYLOvbQjCB2JRAt6Stf1A5OS', 3),
(4, 'Carlito Javier','carlito@studycafe.com','$2a$10$12avytslgxYhkY2a7X3JO.C.RHn8CpYLOvbQjCB2JRAt6Stf1A5OS', 3),
(5, 'Rex Malingin',   'cbrowny@studycafe.com',   '$2a$10$12avytslgxYhkY2a7X3JO.C.RHn8CpYLOvbQjCB2JRAt6Stf1A5OS', 3);

-- Zones: capacity equals the number of seeded seats so occupancy % is meaningful
INSERT INTO study_zones (zone_id, name, type, hourly_rate, max_hours, capacity) VALUES
(1, 'Open Floor',    'Open Floor',    40.00,  8, 6),
(2, 'Quiet Zone',    'Quiet Zone',    60.00,  8, 5),
(3, 'Private Room',  'Private Room',  150.00, 8, 3),
(4, 'Game Station',  'Game Station',  80.00,  2, 4),
(5, 'Solitude Wall', 'Solitude Wall', 100.00, 4, 5);

INSERT INTO seats (zone_id, label, status) VALUES
(1, 'Desk 1', 'Available'), (1, 'Desk 2', 'Available'), (1, 'Desk 3', 'Available'),
(1, 'Desk 4', 'Available'), (1, 'Desk 5', 'Available'), (1, 'Desk 6', 'Available'),
(2, 'Quiet Seat 1', 'Available'), (2, 'Quiet Seat 2', 'Available'), (2, 'Quiet Seat 3', 'Available'),
(2, 'Quiet Seat 4', 'Available'), (2, 'Quiet Seat 5', 'Available'),
(3, 'Private Room 1', 'Available'), (3, 'Private Room 2', 'Available'), (3, 'Private Room 3', 'Available'),
(4, 'Billiards Table 1', 'Available'), (4, 'Billiards Table 2', 'Available'),
(4, 'Chess Board 1', 'Available'), (4, 'Chess Board 2', 'Available'),
(5, 'Booth 1', 'Available'), (5, 'Booth 2', 'Available'), (5, 'Booth 3', 'Available'),
(5, 'Booth 4', 'Available'), (5, 'Booth 5', 'Available');

INSERT INTO menu_items (name, category, price, stock, reorder_level) VALUES
('Iced Coffee', 'Drinks', 80.00, 30, 5),
('Hot Coffee', 'Drinks', 60.00, 30, 5),
('Hot Chocolate', 'Drinks', 65.00, 20, 5),
('Bottled Water', 'Drinks', 25.00, 50, 10),
('Club Sandwich', 'Snacks', 75.00, 20, 5),
('Cookies', 'Snacks', 35.00, 30, 5),
('French Fries', 'Snacks', 55.00, 20, 5),
('Instant Noodles', 'Meals', 45.00, 20, 5),
('Blue Ballpen', 'Study Supplies', 15.00, 50, 10),
('Yellow Pad Paper', 'Study Supplies', 35.00, 30, 5),
('Highlighter', 'Study Supplies', 25.00, 30, 5),
('Sticky Notes', 'Study Supplies', 40.00, 20, 5),
('Scientific Calculator', 'Study Supplies', 350.00, 5, 1);

INSERT INTO pass_packages (name, hours, price, description, validity_days) VALUES
('Starter 10 Hours', 10.00, 350.00, 'Ten study hours valid for 30 days.', 30),
('Student 20 Hours', 20.00, 650.00, 'Twenty study hours valid for 60 days.', 60),
('Scholar 50 Hours', 50.00, 1500.00, 'Fifty study hours valid for 90 days.', 90);

-- Maria: pass nearly used up (2 hours left) -> great for the split-payment demo
-- Juan : a full pass but no reservations -> shows as "Pass only" in the FULL OUTER report
INSERT INTO member_passes (user_id, package_id, remaining_hours, expires_on) VALUES
(3, 1, 2.00,  DATE_ADD(UTC_DATE(), INTERVAL 30 DAY)),
(4, 2, 20.00, DATE_ADD(UTC_DATE(), INTERVAL 60 DAY));
