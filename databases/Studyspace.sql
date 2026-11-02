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


CREATE TABLE pass_packages (
    pass_package_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    validity_days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    pass_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cash_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Paid',
    void_reason TEXT,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(reservation_id),

    CONSTRAINT uq_payment_reservation
        UNIQUE (reservation_id),

    CONSTRAINT chk_payment_amounts
        CHECK (
            pass_amount >= 0
            AND cash_amount >= 0
            AND total_amount >= 0
        )
);