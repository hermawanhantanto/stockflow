INSERT INTO products (sku, name, price, stock, is_active) VALUES
('SKU-LAP-001', 'ThinkPad T14 Gen 4 Laptop', 18500000, 25, TRUE),
('SKU-MON-002', 'Dell UltraSharp 27" 4K Monitor', 7200000, 15, TRUE),
('SKU-KEY-003', 'Keychron K2 Mechanical Keyboard', 1350000, 40, TRUE),
('SKU-MOU-004', 'Logitech MX Master 3S Mouse', 1650000, 8, TRUE),     
('SKU-CAB-005', 'UGREEN USB-C to USB-C Cable 100W', 150000, 120, TRUE),
('SKU-DOC-006', 'CalDigit TS4 Thunderbolt 4 Dock', 6500000, 5, TRUE),   
('SKU-HEA-007', 'Sony WH-1000XM5 Wireless Headphones', 4990000, 12, TRUE),
('SKU-WEB-008', 'Logitech C920 HD Pro Webcam', 1100000, 3, TRUE),       
('SKU-SSD-009', 'Samsung 990 PRO 1TB NVMe SSD', 2100000, 30, TRUE),
('SKU-RAM-010', 'Corsair Vengeance 32GB DDR5 RAM', 1950000, 18, TRUE),
('SKU-CHA-011', 'Ergonomic Mesh Office Chair', 3400000, 0, TRUE),      
('SKU-OLD-012', 'Legacy VGA Monitor Adapter', 85000, 50, FALSE);        


INSERT INTO stock_movements (product_id, type, qty, note, created_at) VALUES
(1, 'in', 25, 'Initial warehouse stock', now() - INTERVAL '5 days'),
(2, 'in', 15, 'Initial warehouse stock', now() - INTERVAL '4 days'),
(3, 'in', 42, 'Initial warehouse stock', now() - INTERVAL '3 days'),
(4, 'in', 10, 'Initial warehouse stock', now() - INTERVAL '2 days'),
(3, 'out', 2, 'Sales Order #1', now() - INTERVAL '1 day'),
(4, 'out', 2, 'Sales Order #1', now() - INTERVAL '1 day');


INSERT INTO sales_orders (customer, status, total, created_at, cancelled_at) VALUES
('PT Maju Mundur Teknologi', 'CREATED', 6000000, now() - INTERVAL '1 day', NULL),
('CV Berkah Abadi', 'CANCELLED', 7200000, now() - INTERVAL '12 hours', now() - INTERVAL '6 hours');


INSERT INTO sales_order_items (order_id, sku, qty, unit_price) VALUES
(1, 'SKU-KEY-003', 2, 1350000),
(1, 'SKU-MOU-004', 2, 1650000),
(2, 'SKU-MON-002', 1, 7200000);