package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"stockflow/internal/handler"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var db *sql.DB

func main () {
	_ = godotenv.Load()

	connectionString := os.Getenv("DATABASE_URL")

	if connectionString == "" {
    	connectionString = "postgres://postgres:password123@localhost:5433/stockflow?sslmode=disable"
    }

	var err error

	db, err = sql.Open("postgres", connectionString)

	if err != nil {
		log.Fatalf("Database initialization error: %v\n", err)

		defer db.Close()
	}

	if err = db.Ping(); err != nil {
		log.Fatalf("Cannot connect to PostgreSQL: %v\n", err)
	}

	fmt.Println("Database connection: OK")

	h := handler.NewHandler(db)

	mux := http.NewServeMux()

	// products
	mux.HandleFunc("GET /api/products", h.GetProduct)
	mux.HandleFunc("POST /api/products", h.CreateProduct)
	mux.HandleFunc("PUT /api/products/{id}", h.UpdateProduct)
	mux.HandleFunc("DELETE /api/products/{id}", h.DeleteProduct)
	mux.HandleFunc("POST /api/products/{id}/stock", h.UpdateStock)
	mux.HandleFunc("GET /api/products/{id}/movements", h.GetProductHistory)

	// orders
	mux.HandleFunc("POST /api/orders", h.CreateOrder)
	mux.HandleFunc("POST /api/orders/{id}/cancel", h.CancelOrder)
	mux.HandleFunc("GET /api/orders/{id}", h.GetOrderByID)

	corsHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		mux.ServeHTTP(w, r)
	})

	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", corsHandler))
}
