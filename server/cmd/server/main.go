package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/miidaystudio/lan-courier/server/internal/db"
	"github.com/miidaystudio/lan-courier/server/internal/websocket"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	dbURL := os.Getenv("DATABASE_URL")

	var database *db.Database
	var err error
	if dbURL != "" {
		database, err = db.NewDatabase(dbURL)
		if err != nil {
			log.Printf("[Warn] Neon PostgreSQL not reachable (%v). Transfers will run without persistence.", err)
		}
	} else {
		log.Println("[Info] No DATABASE_URL provided. Operating in zero-cloud ledger-free mode.")
	}

	// Pure Go in-memory room hub (Zero Redis)
	hub := websocket.NewHub(database)
	go hub.Run()

	mux := http.NewServeMux()

	// WebSocket Signaling Route with zero-CORS restriction
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWS(w, r)
	})

	// Transfer Metadata Audit Endpoint (Neon Postgres Ledger)
	mux.HandleFunc("/api/transfers", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload db.TransferLogPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
			return
		}

		log.Printf("[Audit Ledger] File '%s' (%d bytes) %s -> %s (Duration: %dms, Status: %s, Room: %s)",
			payload.FileName, payload.FileSizeBytes, payload.SenderDevice, payload.ReceiverDevice, payload.DurationMs, payload.Status, payload.RoomCode)

		if database != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
			defer cancel()
			if err := database.RecordTransfer(ctx, payload); err != nil {
				log.Printf("[DB Error] Failed to persist transfer record: %v", err)
				http.Error(w, "Database persistence error: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status":  "recorded",
			"message": "Transfer metrics successfully logged to ledger",
		})
	})

	// Health Check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"service":   "LAN Courier Pure-Go Signaling Broker",
			"timestamp": time.Now().UTC(),
		})
	})

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 LAN Courier Go Signaling Server listening on http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down LAN Courier server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if database != nil {
		database.Close()
	}

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server gracefully stopped")
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}
