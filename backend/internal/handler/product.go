package handler

import (
	"database/sql"
	"fmt"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Product struct {
	ID int `json:"id"`
	SKU string `json:"sku"`
	Name string `json:"name"`
	Price int `json:"price"`
	Stock int `json:"stock"`
	IsActive bool `json:"is_active"`
	CreatedAt	time.Time `json:"created_at"`
	LastMovementAt *time.Time `json:"last_movement_at"`
}

type HistoryProduct struct {
	ID int `json:"id"`
	ProductID int `json:"product_id"`
	Type string `json:"type"`
	Qty int `json:"qty"`
	Note string `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateProductRequest struct{
	SKU string `json:"sku"`
	Name string `json:"name"`
	Price int `json:"price"`
}

type UpdateProductRequest struct{
	Name string `json:"name"`
	Price int `json:"price"`
	IsActive bool `json:"is_active"`
}

type UpdateStockRequest struct {
	Type string `json:"type"`
	Qty int `json:"qty"`
	Note string `json:"text"`
}

func (h *Handler) GetProduct (w http.ResponseWriter, r *http.Request) {
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	status := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10

	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}

	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	offset := (page - 1) * limit

	var conditions []string
	var args []any
	argIndex := 1

	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(p.sku ILIKE $%d OR p.name ILIKE $%d)", argIndex, argIndex))
		args = append(args, "%"+search+"%")
		argIndex++
	}

	switch status {
	case "active":
		conditions = append(conditions, fmt.Sprintf("p.is_active = $%d", argIndex))
		args = append(args, true)
		argIndex++
	case "inactive", "non-active", "non_active":
		conditions = append(conditions, fmt.Sprintf("p.is_active = $%d", argIndex))
		args = append(args, false)
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	countArgs := make([]any, len(args))
	copy(countArgs, args)

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products p %s", whereClause)
	if err := h.DB.QueryRow(countQuery, countArgs...).Scan(&total); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dataQuery := fmt.Sprintf(`SELECT p.id, p.sku, p.name, p.price, p.stock, p.is_active, p.created_at, (SELECT sm.created_at FROM stock_movements sm WHERE sm.product_id = p.id ORDER BY sm.created_at DESC LIMIT 1) AS last_movement_at FROM products p %s ORDER BY p.id ASC LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	rows, err := h.DB.Query(dataQuery, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	products := make([]Product, 0)

	for rows.Next() {
		var product Product
		err := rows.Scan(
			&product.ID,
            &product.SKU,
            &product.Name,
            &product.Price,
            &product.Stock,
            &product.IsActive,
            &product.CreatedAt,
            &product.LastMovementAt,
		)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
            return
		}

		products = append(products, product)
	}

	if err = rows.Err(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"data": products,
		"page": page,
		"limit": limit,
		"total": total,
	})
}

func (h *Handler) CreateProduct (w http.ResponseWriter, r *http.Request) {
	var req CreateProductRequest 

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid JSON format"})
		return
	}

	if strings.TrimSpace(req.SKU) == "" {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "SKU is required"})
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "Name is required"})
		return
	}

	if req.Price < 0 {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "Price must be greater than or equal 0"})
		return
	}

	var exists bool 
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE sku = $1)", req.SKU).Scan(&exists)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "SKU already exists"})
		return
	}


	query := `INSERT INTO products (sku, name, price) VALUES ($1, $2, $3) RETURNING id, sku, name, price, stock, is_active, created_at`

	var createdProduct Product

	err = h.DB.QueryRow(query, req.SKU, req.Name, req.Price).Scan(
		&createdProduct.ID,
		&createdProduct.SKU,
		&createdProduct.Name,
		&createdProduct.Price,
		&createdProduct.Stock,
		&createdProduct.IsActive,
		&createdProduct.CreatedAt,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdProduct)
}

func (h *Handler) UpdateProduct (w http.ResponseWriter, r *http.Request) {
	var req UpdateProductRequest

	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid Product Id"})
		return	
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid JSON format"})
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "Name is required"})
		return
	}

	if req.Price < 0 {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "Price must be greater than or equal 0"})
		return
	}

	query := `UPDATE products SET name = $1, price = $2, is_active = $3 WHERE id = $4 RETURNING id, sku, name, price, stock, is_active, created_at`

	var updatedProduct Product

	err = h.DB.QueryRow(query, req.Name, req.Price, req.IsActive, id).Scan(
		&updatedProduct.ID,
		&updatedProduct.SKU,
		&updatedProduct.Name,
		&updatedProduct.Price,
		&updatedProduct.Stock,
		&updatedProduct.IsActive,
		&updatedProduct.CreatedAt,
	)

	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusNotFound) 
        json.NewEncoder(w).Encode(map[string]string{
            "error": "Product not found",
        })
        return
	}

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(updatedProduct)
}

func (h *Handler) DeleteProduct (w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid Product Id"})
		return	
	}

	var hasHistory bool
	err = h.DB.QueryRow("SELECT EXISTS (SELECT 1 FROM stock_movements WHERE product_id = $1)", id).Scan(&hasHistory)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if hasHistory {
    	w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusConflict) 
        json.NewEncoder(w).Encode(map[string]any{ "error": map[string]string{  "code": "PRODUCT_HAS_HISTORY",}})
        return
    }

	res, err := h.DB.Exec("DELETE FROM products WHERE id = $1", id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
        return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusNotFound) 
        json.NewEncoder(w).Encode(map[string]string{"error": "Product not found"})
        return
    }

	w.WriteHeader(http.StatusNoContent);
}

func (h *Handler) UpdateStock (w http.ResponseWriter, r *http.Request) {
	var req UpdateStockRequest
	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid Product Id"})
		return	
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid JSON format"})
		return
	}

	if req.Type != "in" && req.Type != "out" {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "Type should be in or out"})
		return
	}

	if req.Qty <= 0 {
		w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]any{"error":   "Qty must be greater than or equal 0"})
		return
	}

	tx, err := h.DB.Begin()

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer tx.Rollback()

    var currentStock int
    err = tx.QueryRow("SELECT stock FROM products WHERE id = $1 FOR UPDATE", id).Scan(&currentStock)
    if err == sql.ErrNoRows {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "Product not found"})
        return
    }

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

	var newStock int

	if req.Type == "in" {
		newStock = currentStock + req.Qty
	} else {
		if currentStock < req.Qty {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusConflict) 
            json.NewEncoder(w).Encode(map[string]any{
                "error": map[string]any{
					"code": "INSUFFICIENT_STOCK",
                	"available": currentStock,
            	},
            })

            return 
        }

		newStock = currentStock - req.Qty
	}

	_, err = tx.Exec("UPDATE products SET stock = $1 WHERE id = $2", newStock, id)
	
	if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    _, err = tx.Exec("INSERT INTO stock_movements (product_id, type, qty, note) VALUES ($1, $2, $3, $4)", id, req.Type, req.Qty, req.Note)

    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    if err = tx.Commit(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]any{
        "message":   "Stock updated successfully",
        "new_stock": newStock,
    })
}

func (h *Handler) GetProductHistory (w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{"error": "Invalid Product Id"})
		return	
	}

	query := `SELECT id, product_id, type, qty, COALESCE(note, '') AS note, created_at FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC`

	rows, err := h.DB.Query(query, id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
        return
	}

	defer rows.Close()

	historyProducts := make([]HistoryProduct, 0)

	for rows.Next() {
		var historyProduct HistoryProduct
		err := rows.Scan(
			&historyProduct.ID,
			&historyProduct.ProductID,
            &historyProduct.Type,
            &historyProduct.Qty,
            &historyProduct.Note,
            &historyProduct.CreatedAt,
		)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
            return
		}

		historyProducts = append(historyProducts, historyProduct)
	}

	if err = rows.Err(); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"data": historyProducts,
	})
}