CREATE DATABASE IF NOT EXISTS study_cafe_sia;
USE study_cafe_sia;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO roles (name) VALUES ('admin'), ('staff'), ('customer');

CREATE TABLE study_zones (
    study_zone_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    max_hours INT NOT NULL,
    capacity INT NOT NULL
);
CREATE TABLE menu_items (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    reorder_level INT NOT NULL
);
CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    study_zone_id INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    CONSTRAINT uq_seats_zone_label
        UNIQUE (study_zone_id, label),
    CONSTRAINT fk_seats_zone
        FOREIGN KEY (study_zone_id)
        REFERENCES study_zones(study_zone_id)
);
INSERT INTO study_zones
(study_zone_id, name, type, hourly_rate, max_hours, capacity)
VALUES
(1, 'Mini Library', 'Library', 40.00, 8, 8),
(2, 'Open Floor', 'Open Floor', 40.00, 8, 20),
(3, 'Quiet Zone', 'Quiet Zone', 60.00, 8, 15),
(4, 'Private Room', 'Private Room', 150.00, 8, 5),
(5, 'Game Station', 'Game Station', 80.00, 2, 4),
(6, 'Solitude Wall', 'Solitude Wall', 100.00, 4, 10);

INSERT INTO seats (study_zone_id, label, status)
VALUES
(1, 'Library Desk 1', 'Available'),
(1, 'Library Desk 2', 'Available'),
(1, 'Library Reading Seat 1', 'Available'),
(1, 'Library Reading Seat 2', 'Available'),
(2, 'Desk 1', 'Available'),
(2, 'Desk 2', 'Available'),
(2, 'Desk 3', 'Available'),
(2, 'Desk 4', 'Available'),
(2, 'Group Study Table 1', 'Available'),
(2, 'Group Study Table 2', 'Available'),
(3, 'Quiet Seat 1', 'Available'),
(3, 'Quiet Seat 2', 'Available'),
(3, 'Quiet Seat 3', 'Available'),
(3, 'Quiet Seat 4', 'Available'),
(3, 'Quiet Seat 5', 'Available'),
(4, 'Private Room 1', 'Available'),
(4, 'Private Room 2', 'Available'),
(4, 'Private Room 3', 'Available'),
(5, 'Chess Board 1', 'Available'),
(5, 'Chess Board 2', 'Available'),
(6, 'Booth 1', 'Available'),
(6, 'Booth 2', 'Available'),
(6, 'Booth 3', 'Available'),
(6, 'Booth 4', 'Available'),
(6, 'Booth 5', 'Available');

INSERT INTO menu_items
(name, category, price, stock, reorder_level)
VALUES
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
('Yellow Highlighter', 'Study Supplies', 25.00, 30, 5),
('Sticky Notes', 'Study Supplies', 40.00, 20, 5),
('Mechanical Pencil', 'Study Supplies', 45.00, 20, 5),
('Pencil Leads 0.5mm', 'Study Supplies', 30.00, 20, 5),
('Correction Tape', 'Study Supplies', 35.00, 20, 5),
('Eraser', 'Study Supplies', 10.00, 30, 5),
('Ruler 12-inch', 'Study Supplies', 15.00, 20, 5),
('Black Permanent Marker', 'Study Supplies', 25.00, 20, 5),
('Index Cards', 'Study Supplies', 30.00, 25, 5),
('Binder Clips', 'Study Supplies', 20.00, 20, 5),
('Notebook', 'Study Supplies', 50.00, 20, 5),
('Folder', 'Study Supplies', 20.00, 25, 5),
('Glue Stick', 'Study Supplies', 30.00, 15, 5),
('Scissors', 'Study Supplies', 40.00, 10, 3),
('Scientific Calculator', 'Study Supplies', 350.00, 5, 1),
('Flash Cards', 'Study Supplies', 45.00, 20, 5),
('Book Tabs', 'Study Supplies', 25.00, 20, 5);


-- =========================================
-- RESERVATIONS TABLE
-- Member C: Malingin
-- =========================================

CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    seat_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_reservations_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id),

    CONSTRAINT chk_reservation_time
        CHECK (end_time > start_time),

    INDEX idx_reservations_seat (seat_id),
    INDEX idx_reservations_user (user_id),
    INDEX idx_reservations_status (status)
);

-- Orders table
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(reservation_id),

    CONSTRAINT chk_order_total
        CHECK (total_amount >= 0)
);

-- Order items table
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT fk_order_items_menu
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(menu_item_id),

    CONSTRAINT chk_order_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_item_price
        CHECK (unit_price >= 0 AND subtotal >= 0)
);
