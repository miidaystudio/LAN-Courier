package main

import (
	"context"
	"encoding/json"
	"fmt"
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
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")

	var database *db.Database
	var err error
	if dbURL != "" {
		database, err = db.NewDatabase(dbURL)
		if err != nil {
			log.Printf("[Warn] Neon PostgreSQL not reachable (%v). Operating without persistence.", err)
		}
	} else {
		log.Println("[Info] No DATABASE_URL provided. Operating in zero-cloud ledger-free mode.")
	}

	// Thread-safe in-memory room hub (Zero Redis)
	hub := websocket.NewHub(database)
	go hub.Run()

	mux := http.NewServeMux()

	// 1. Mobile Reachability Ping Health Check Endpoint
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprint(w, "pong")
	})

	// 2. WebSocket Signaling Route with Permissive CORS Handshake
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		hub.ServeWS(w, r)
	})

	// 3. API Health Status
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"engine":    "CourierStudio P2P Signaling Mesh",
			"room":      "#STUDIO-LAN",
			"timestamp": time.Now().UTC(),
		})
	})

	// 4. Optional Transfer Audit Endpoint
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
			_ = database.RecordTransfer(ctx, payload)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status":  "recorded",
			"message": "Transfer metrics successfully logged",
		})
	})

	server := &http.Server{
		Addr:         "0.0.0.0:" + port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 CourierStudio Go WebSocket Hub listening on http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[Server Notice] Listen on :%s encountered: %v. (If already running, service remains available)", port, err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down CourierStudio server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if database != nil {
		database.Close()
	}

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown notice: %v", err)
	}

	log.Println("Server gracefully stopped")
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
}
