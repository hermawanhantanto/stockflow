package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
)

type OrderItemRequest struct {
	SKU string `json:"sku"`
	Qty int    `json:"qty"`
}

type CreateOrderRequest struct {
	Customer string             `json:"customer"`
	Items    []OrderItemRequest `json:"items"`
}

type OrderItem struct {
	ID        int    `json:"id"`
	OrderID   int    `json:"order_id"`
	SKU       string `json:"sku"`
	Qty       int    `json:"qty"`
	UnitPrice int    `json:"unit_price"`
}

type Order struct {
	ID          int         `json:"id"`
	Customer    string      `json:"customer"`
	Status      string      `json:"status"`
	Total       int         `json:"total"`
	CreatedAt   time.Time   `json:"created_at"`
	CancelledAt *time.Time  `json:"cancelled_at"`
	Items       []OrderItem `json:"items"`
}

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	if strings.TrimSpace(req.Customer) == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Customer name is required"})
		return
	}

	if len(req.Items) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order must have at least one item"})
		return
	}

	seenSKUs := make(map[string]bool)
	for _, item := range req.Items {
		if strings.TrimSpace(item.SKU) == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "SKU cannot be empty"})
			return
		}

		if item.Qty <= 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Quantity must be greater than 0"})
			return
		}

		if seenSKUs[item.SKU] {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Duplicate SKU in order: " + item.SKU})
			return
		}

		seenSKUs[item.SKU] = true
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	skus := make([]string, len(req.Items))
	for i, item := range req.Items {
		skus[i] = item.SKU
	}

	rows, err := tx.Query(`
		SELECT id, sku, price, stock 
		FROM products 
		WHERE sku = ANY($1) 
		FOR UPDATE
	`, pq.Array(skus))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type dbProduct struct {
		id    int
		price int
		stock int
	}

	productsMap := make(map[string]dbProduct)
	for rows.Next() {
		var id, price, stock int
		var sku string
		if err := rows.Scan(&id, &sku, &price, &stock); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		productsMap[sku] = dbProduct{id: id, price: price, stock: stock}
	}

	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	serverComputedTotal := 0
	itemSKUs := make([]string, len(req.Items))
	itemQtys := make([]int, len(req.Items))
	itemPrices := make([]int, len(req.Items))
	productIDs := make([]int, len(req.Items))

	for index, item := range req.Items {
		prod, exists := productsMap[item.SKU]
		if !exists {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unknown SKU: " + item.SKU})
			return
		}

		if prod.stock < item.Qty {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]any{
				"error": map[string]any{
					"code":      "INSUFFICIENT_STOCK",
					"sku":       item.SKU,
					"available": prod.stock,
				},
			})
			return
		}

		serverComputedTotal += prod.price * item.Qty
		itemSKUs[index] = item.SKU
		itemQtys[index] = item.Qty
		itemPrices[index] = prod.price
		productIDs[index] = prod.id
	}

	var createdOrder Order
	err = tx.QueryRow(`
		INSERT INTO sales_orders (customer, status, total) 
		VALUES ($1, 'CREATED', $2) 
		RETURNING id, customer, status, total, created_at, cancelled_at
	`, req.Customer, serverComputedTotal).Scan(
		&createdOrder.ID,
		&createdOrder.Customer,
		&createdOrder.Status,
		&createdOrder.Total,
		&createdOrder.CreatedAt,
		&createdOrder.CancelledAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	itemRows, err := tx.Query(`
		INSERT INTO sales_order_items (order_id, sku, qty, unit_price) 
		SELECT $1, v.sku, v.qty, v.unit_price 
		FROM unnest($2::text[], $3::int[], $4::int[]) AS v(sku, qty, unit_price) 
		RETURNING id, order_id, sku, qty, unit_price
	`, createdOrder.ID, pq.Array(itemSKUs), pq.Array(itemQtys), pq.Array(itemPrices))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer itemRows.Close()

	orderItems := make([]OrderItem, 0, len(req.Items))
	for itemRows.Next() {
		var oi OrderItem
		if err := itemRows.Scan(&oi.ID, &oi.OrderID, &oi.SKU, &oi.Qty, &oi.UnitPrice); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orderItems = append(orderItems, oi)
	}

	if err = itemRows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`
		UPDATE products AS p 
		SET stock = p.stock - v.qty 
		FROM unnest($1::int[], $2::int[]) AS v(product_id, qty) 
		WHERE p.id = v.product_id
	`, pq.Array(productIDs), pq.Array(itemQtys))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	note := fmt.Sprintf("Sales Order #%d", createdOrder.ID)
	_, err = tx.Exec(`
		INSERT INTO stock_movements (product_id, type, qty, note)
		SELECT v.product_id, 'out', v.qty, $3
		FROM unnest($1::int[], $2::int[]) AS v(product_id, qty)
	`, pq.Array(productIDs), pq.Array(itemQtys), note)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	createdOrder.Items = orderItems
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdOrder)
}

func (h *Handler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid order ID"})
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var currentStatus string
	err = tx.QueryRow("SELECT status FROM sales_orders WHERE id = $1 FOR UPDATE", id).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if currentStatus == "CANCELLED" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]any{
			"error": map[string]string{
				"code": "ORDER_ALREADY_CANCELLED",
			},
		})
		return
	}

	var order Order
	err = tx.QueryRow(`
		UPDATE sales_orders 
		SET status = 'CANCELLED', cancelled_at = now() 
		WHERE id = $1 
		RETURNING id, customer, status, total, created_at, cancelled_at
	`, id).Scan(
		&order.ID,
		&order.Customer,
		&order.Status,
		&order.Total,
		&order.CreatedAt,
		&order.CancelledAt,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, err := tx.Query(`
		SELECT id, order_id, sku, qty, unit_price 
		FROM sales_order_items 
		WHERE order_id = $1
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := make([]OrderItem, 0)
	var skus []string
	var qtys []int

	for rows.Next() {
		var item OrderItem
		if err := rows.Scan(&item.ID, &item.OrderID, &item.SKU, &item.Qty, &item.UnitPrice); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
		skus = append(skus, item.SKU)
		qtys = append(qtys, item.Qty)
	}
	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(items) > 0 {
		_, err = tx.Exec(`
			UPDATE products AS p
			SET stock = p.stock + v.qty
			FROM unnest($1::text[], $2::int[]) AS v(sku, qty)
			WHERE p.sku = v.sku
		`, pq.Array(skus), pq.Array(qtys))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		note := fmt.Sprintf("Cancelled Order #%d", id)
		_, err = tx.Exec(`
			INSERT INTO stock_movements (product_id, type, qty, note)
			SELECT p.id, 'in', v.qty, $3
			FROM unnest($1::text[], $2::int[]) AS v(sku, qty)
			JOIN products p ON p.sku = v.sku
		`, pq.Array(skus), pq.Array(qtys), note)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	order.Items = items
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}

func (h *Handler) GetOrderByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid order ID"})
		return
	}

	var order Order
	err = h.DB.QueryRow(`
		SELECT id, customer, status, total, created_at, cancelled_at 
		FROM sales_orders 
		WHERE id = $1
	`, id).Scan(
		&order.ID,
		&order.Customer,
		&order.Status,
		&order.Total,
		&order.CreatedAt,
		&order.CancelledAt,
	)
	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, order_id, sku, qty, unit_price 
		FROM sales_order_items 
		WHERE order_id = $1
	`, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := make([]OrderItem, 0)
	for rows.Next() {
		var item OrderItem
		if err := rows.Scan(&item.ID, &item.OrderID, &item.SKU, &item.Qty, &item.UnitPrice); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}
	if err = rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	order.Items = items
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}
