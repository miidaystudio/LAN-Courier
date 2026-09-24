package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	pool *pgxpool.Pool
}

type TransferLogPayload struct {
	RoomCode       string `json:"roomCode"`
	FileName       string `json:"fileName"`
	FileSizeBytes  int64  `json:"fileSizeBytes"`
	MimeType       string `json:"mimeType"`
	SenderDevice   string `json:"senderDevice"`
	ReceiverDevice string `json:"receiverDevice"`
	DurationMs     int    `json:"durationMs"`
	Status         string `json:"status"` // 'COMPLETED' | 'FAILED' | 'CANCELLED'
}

func NewDatabase(databaseURL string) (*Database, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse DATABASE_URL: %w", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 1 * time.Hour

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to Neon PostgreSQL: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping Neon PostgreSQL: %w", err)
	}

	log.Println("[Postgres] Connected successfully to Neon Serverless PostgreSQL")
	return &Database{pool: pool}, nil
}

func (db *Database) Close() {
	if db.pool != nil {
		db.pool.Close()
	}
}

// UpsertRoom records or updates last_active for a room code
func (db *Database) UpsertRoom(ctx context.Context, roomCode string) error {
	query := `
		INSERT INTO rooms (room_code, created_at, last_active)
		VALUES ($1, NOW(), NOW())
		ON CONFLICT (room_code) DO UPDATE 
		SET last_active = NOW();
	`
	_, err := db.pool.Exec(ctx, query, roomCode)
	return err
}

// RecordTransfer persists non-sensitive transfer audit metrics to Neon PostgreSQL
func (db *Database) RecordTransfer(ctx context.Context, log TransferLogPayload) error {
	if log.Status == "" {
		log.Status = "COMPLETED"
	}
	if log.MimeType == "" {
		log.MimeType = "application/octet-stream"
	}

	// Make sure room exists in rooms table
	_ = db.UpsertRoom(ctx, log.RoomCode)

	query := `
		INSERT INTO transfer_logs (
			room_code, file_name, file_size_bytes, mime_type, 
			sender_device, receiver_device, duration_ms, status, created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`
	_, err := db.pool.Exec(
		ctx,
		query,
		log.RoomCode,
		log.FileName,
		log.FileSizeBytes,
		log.MimeType,
		log.SenderDevice,
		log.ReceiverDevice,
		log.DurationMs,
		log.Status,
	)
	return err
}
