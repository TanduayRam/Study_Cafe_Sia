CREATE DATABASE IF NOT EXISTS study_cafe_sia
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE study_cafe_sia;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS report_snapshots, feedback_reviews, audit_logs, alerts,
    session_logs, payments, order_items, orders, reservations, member_passes,
    pass_packages, menu_items, seats, study_zones, token_blacklist, users, roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. roles (Maldan) ----------------------------------------------------
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

-- 2. users (Maldan) ----------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 3. token_blacklist (Maldan) -------------------------------------------
CREATE TABLE token_blacklist (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. study_zones (Pastrana) ---------------------------------------------
CREATE TABLE study_zones (
    zone_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    max_hours INT NOT NULL,
    capacity INT NOT NULL,
    CONSTRAINT chk_zone_type CHECK (type IN
        ('Open Floor','Quiet Zone','Private Room','Game Station','Solitude Wall')),
    CONSTRAINT chk_zone_rate CHECK (hourly_rate > 0),
    CONSTRAINT chk_zone_hours CHECK (max_hours BETWEEN 1 AND 8),
    CONSTRAINT chk_zone_capacity CHECK (capacity > 0)
);

-- 5. seats (Pastrana) ---------------------------------------------------
CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    zone_id INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    CONSTRAINT uq_seats_zone_label UNIQUE (zone_id, label),
    CONSTRAINT fk_seats_zone FOREIGN KEY (zone_id) REFERENCES study_zones(zone_id),
    CONSTRAINT chk_seat_status CHECK (status IN ('Available','Occupied','Maintenance'))
);

-- 6. menu_items (Pastrana) ----------------------------------------------
CREATE TABLE menu_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 5,
    CONSTRAINT chk_item_price CHECK (price > 0),
    CONSTRAINT chk_item_stock CHECK (stock >= 0),
    CONSTRAINT chk_item_reorder CHECK (reorder_level >= 0)
);

-- 7. pass_packages (Pontunilla) -----------------------------------------
CREATE TABLE pass_packages (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hours DECIMAL(6,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    validity_days INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_package_hours CHECK (hours > 0),
    CONSTRAINT chk_package_price CHECK (price > 0),
    CONSTRAINT chk_package_validity CHECK (validity_days > 0)
);

-- 8. member_passes (Pontunilla) -----------------------------------------
CREATE TABLE member_passes (
    member_pass_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    remaining_hours DECIMAL(6,2) NOT NULL,
    expires_on DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mpass_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_mpass_package FOREIGN KEY (package_id) REFERENCES pass_packages(package_id),
    CONSTRAINT chk_mpass_hours CHECK (remaining_hours >= 0)
);

-- 9. reservations (Malingin) --------------------------------------------
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    seat_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
    checked_in_at DATETIME NULL,
    checked_out_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_res_seat FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
    CONSTRAINT chk_res_time CHECK (end_time > start_time),
    CONSTRAINT chk_res_status CHECK (status IN
        ('Confirmed','CheckedIn','Completed','Cancelled','NoShow')),
    INDEX idx_res_seat_time (seat_id, start_time, end_time),
    INDEX idx_res_user (user_id),
    INDEX idx_res_status (status)
);

-- 10. orders (Malingin) -------------------------------------------------
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_res FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id),
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT chk_order_status CHECK (status IN ('Pending','Served','Cancelled'))
);

-- 11. order_items (Malingin) --------------------------------------------
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT fk_oi_item FOREIGN KEY (item_id) REFERENCES menu_items(item_id),
    CONSTRAINT chk_oi_qty CHECK (quantity > 0),
    CONSTRAINT chk_oi_amounts CHECK (unit_price >= 0 AND subtotal >= 0)
);

-- 12. payments (Pontunilla) - one payment per reservation ---------------
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    pass_hours_used DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    pass_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cash_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Paid',
    void_reason TEXT NULL,
    paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_res FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id),
    CONSTRAINT uq_pay_res UNIQUE (reservation_id),
    CONSTRAINT chk_pay_amounts CHECK (pass_amount >= 0 AND cash_amount >= 0 AND total_amount >= 0),
    CONSTRAINT chk_pay_status CHECK (status IN ('Paid','Voided'))
);

-- 13. session_logs (Macias) ---------------------------------------------
CREATE TABLE session_logs (
    session_log_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NULL,
    user_id INT NOT NULL,
    zone_id INT NOT NULL,
    seat_id INT NULL,
    start_time DATETIME NOT NULL,
    expected_end_time DATETIME NULL,
    end_time DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sl_res FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id),
    CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_sl_zone FOREIGN KEY (zone_id) REFERENCES study_zones(zone_id),
    CONSTRAINT fk_sl_seat FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
    CONSTRAINT chk_sl_status CHECK (status IN ('Active','Completed','NoShow')),
    INDEX idx_sl_status (status)
);

-- 14. alerts (Macias) ---------------------------------------------------
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(20) NOT NULL,
    zone_id INT NULL,
    seat_id INT NULL,
    item_id INT NULL,
    message VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_zone FOREIGN KEY (zone_id) REFERENCES study_zones(zone_id),
    CONSTRAINT fk_alert_seat FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
    CONSTRAINT fk_alert_item FOREIGN KEY (item_id) REFERENCES menu_items(item_id),
    CONSTRAINT fk_alert_user FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT chk_alert_type CHECK (alert_type IN ('Overstay','Capacity','LowStock')),
    CONSTRAINT chk_alert_status CHECK (status IN ('Open','Acknowledged','Resolved')),
    INDEX idx_alert_status (status)
);

-- 15. audit_logs (Macias) - user_id NULL means "System" ------------------
CREATE TABLE audit_logs (
    audit_log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    details VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_audit_created (created_at)
);

-- 16. feedback_reviews (Javier) -----------------------------------------
CREATE TABLE feedback_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fr_res FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id),
    CONSTRAINT fk_fr_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT uq_fr_res UNIQUE (reservation_id),
    CONSTRAINT chk_fr_rating CHECK (rating BETWEEN 1 AND 5)
);

-- 17. report_snapshots (Javier) -----------------------------------------
CREATE TABLE report_snapshots (
    snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    report_data JSON NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_snap_user FOREIGN KEY (created_by) REFERENCES users(user_id)
);
