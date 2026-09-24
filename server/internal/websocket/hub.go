package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/miidaystudio/lan-courier/server/internal/db"
	"github.com/miidaystudio/lan-courier/server/internal/subnet"
)

type PeerDTO struct {
	ID         string `json:"id"`
	DeviceName string `json:"deviceName"`
	DeviceType string `json:"deviceType"`
	IPAddress  string `json:"ipAddress"`
	IP         string `json:"ip"`
}

type Hub struct {
	// In-memory thread-safe rooms registry: roomCode -> peerId -> *Client
	rooms   map[string]map[string]*Client
	clients map[string]*Client // Fast peerId -> *Client index
	mu      sync.RWMutex

	Register   chan *Client
	Unregister chan *Client
	Route      chan *Envelope

	db *db.Database
}

func NewHub(database *db.Database) *Hub {
	return &Hub{
		rooms:      make(map[string]map[string]*Client),
		clients:    make(map[string]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Route:      make(chan *Envelope),
		db:         database,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if _, ok := h.rooms[client.RoomCode]; !ok {
				h.rooms[client.RoomCode] = make(map[string]*Client)
			}
			h.rooms[client.RoomCode][client.ID] = client
			h.clients[client.ID] = client
			currentRoom := client.RoomCode
			h.mu.Unlock()

			log.Printf("[Hub] Client Joined: %s (%s) | Room: %s", client.DeviceName, client.ID, currentRoom)

			// Persist room to Neon PostgreSQL
			if h.db != nil {
				go func(code string) {
					ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
					defer cancel()
					_ = h.db.UpsertRoom(ctx, code)
				}(currentRoom)
			}

			// Broadcast updated peer list to entire room
			h.broadcastPeerList(currentRoom)

		case client := <-h.Unregister:
			h.mu.Lock()
			roomCode := client.RoomCode
			if room, ok := h.rooms[roomCode]; ok {
				if _, exists := room[client.ID]; exists {
					delete(room, client.ID)
					close(client.Send)
					if len(room) == 0 {
						delete(h.rooms, roomCode)
					}
				}
			}
			delete(h.clients, client.ID)
			h.mu.Unlock()

			log.Printf("[Hub] Client Left: %s (%s) | Room: %s", client.DeviceName, client.ID, roomCode)

			// Broadcast updated peer list to remaining room members
			h.broadcastPeerList(roomCode)

		case env := <-h.Route:
			// If target peer ID is specified ("to"), deliver directly
			if env.To != "" {
				h.mu.RLock()
				targetClient, exists := h.clients[env.To]
				h.mu.RUnlock()

				if exists {
					b, err := json.Marshal(env)
					if err == nil {
						select {
						case targetClient.Send <- b:
						default:
							log.Printf("[Hub] Buffer full for target peer: %s", env.To)
						}
					}
				}
			} else if env.RoomCode != "" {
				// Broadcast to specified room
				h.broadcastEnvelopeToRoom(env.RoomCode, env.From, *env)
			}
		}
	}
}

// SwitchRoom moves a client to a new 6-digit PIN room or subnet room
func (h *Hub) SwitchRoom(client *Client, newRoomCode string) {
	h.mu.Lock()
	oldRoomCode := client.RoomCode

	// Remove from old room
	if oldRoom, ok := h.rooms[oldRoomCode]; ok {
		delete(oldRoom, client.ID)
		if len(oldRoom) == 0 {
			delete(h.rooms, oldRoomCode)
		}
	}

	// Add to new room
	client.RoomCode = newRoomCode
	if _, ok := h.rooms[newRoomCode]; !ok {
		h.rooms[newRoomCode] = make(map[string]*Client)
	}
	h.rooms[newRoomCode][client.ID] = client
	h.mu.Unlock()

	log.Printf("[Hub] Peer %s switched from room [%s] -> [%s]", client.DeviceName, oldRoomCode, newRoomCode)

	// Persist new room code to Neon Postgres
	if h.db != nil {
		go func(code string) {
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			_ = h.db.UpsertRoom(ctx, code)
		}(newRoomCode)
	}

	// Broadcast peer-list to both old and new rooms
	h.broadcastPeerList(oldRoomCode)
	h.broadcastPeerList(newRoomCode)
}

// broadcastPeerList sends the current peer list in a room to all connected peers in that room
func (h *Hub) broadcastPeerList(roomCode string) {
	h.mu.RLock()
	room, ok := h.rooms[roomCode]
	if !ok {
		h.mu.RUnlock()
		return
	}

	// Create list of all peers currently in this room
	peerList := make([]PeerDTO, 0, len(room))
	recipients := make([]*Client, 0, len(room))
	for _, c := range room {
		peerList = append(peerList, PeerDTO{
			ID:         c.ID,
			DeviceName: c.DeviceName,
			DeviceType: c.DeviceType,
			IPAddress:  c.IP,
			IP:         c.IP,
		})
		recipients = append(recipients, c)
	}
	h.mu.RUnlock()

	payloadBytes, err := json.Marshal(map[string]interface{}{
		"roomCode": roomCode,
		"peers":    peerList,
	})
	if err != nil {
		return
	}

	envelope := Envelope{
		Type:     "peer-list",
		From:     "server",
		RoomCode: roomCode,
		Payload:  json.RawMessage(payloadBytes),
	}

	envelopeBytes, err := json.Marshal(envelope)
	if err != nil {
		return
	}

	for _, client := range recipients {
		select {
		case client.Send <- envelopeBytes:
		default:
		}
	}
}

// broadcastEnvelopeToRoom forwards an envelope to all peers in a room except the sender
func (h *Hub) broadcastEnvelopeToRoom(roomCode, senderID string, env Envelope) {
	h.mu.RLock()
	room, ok := h.rooms[roomCode]
	if !ok {
		h.mu.RUnlock()
		return
	}

	recipients := make([]*Client, 0, len(room))
	for id, c := range room {
		if id != senderID {
			recipients = append(recipients, c)
		}
	}
	h.mu.RUnlock()

	b, err := json.Marshal(env)
	if err != nil {
		return
	}

	for _, client := range recipients {
		select {
		case client.Send <- b:
		default:
		}
	}
}

// ServeWS upgrades the HTTP connection and handles peer registration
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[Hub] Upgrade error: %v", err)
		return
	}

	clientIP := subnet.ExtractClientIP(r)
	subnetCIDR, subnetHash := subnet.DeriveSubnetCIDR(clientIP)

	query := r.URL.Query()
	deviceName := query.Get("deviceName")
	if deviceName == "" {
		deviceName = "Anonymous Device"
	}
	deviceType := query.Get("deviceType")
	if deviceType == "" {
		deviceType = "desktop"
	}

	peerID := query.Get("peerId")
	if peerID == "" {
		peerID = uuid.New().String()
	}

	// Room assignment: use custom roomCode if passed in query, else default to subnet hash
	roomCode := query.Get("roomCode")
	if roomCode == "" {
		roomCode = subnetHash[:8] // Clean 8-char subnet room ID (e.g. 7f8a12bc)
	}

	client := &Client{
		Hub:        h,
		Conn:       conn,
		Send:       make(chan []byte, 256),
		ID:         peerID,
		DeviceName: deviceName,
		DeviceType: deviceType,
		RoomCode:   roomCode,
		SubnetCIDR: subnetCIDR,
		IP:         clientIP,
	}

	h.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
