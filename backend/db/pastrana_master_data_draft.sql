CREATE TABLE study_zones (
    study_zone_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL,
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
    zone_id INT NOT NULL,
    label VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    CONSTRAINT uq_seats_zone_label UNIQUE (zone_id, label),
    CONSTRAINT fk_seats_zone
        FOREIGN KEY (zone_id)
        REFERENCES study_zones(study_zone_id)
);
