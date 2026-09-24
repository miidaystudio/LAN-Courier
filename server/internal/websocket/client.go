package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 30 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Accept all origins to eliminate CORS handshake drops
		return true
	},
}

// Envelope represents WebRTC signaling and messaging packet
type Envelope struct {
	Type     string          `json:"type"`               // 'peer-list', 'join-custom-room', 'offer', 'answer', 'candidate', 'direct-message', 'encrypted-secret', 'consent-request', 'consent-response', 'ping', 'pong'
	From     string          `json:"from,omitempty"`
	To       string          `json:"to,omitempty"`       // Target peer ID
	RoomCode string          `json:"roomCode,omitempty"`
	Payload  json.RawMessage `json:"payload,omitempty"`
}

type Client struct {
	Hub        *Hub
	Conn       *websocket.Conn
	Send       chan []byte
	ID         string
	DeviceName string
	DeviceType string
	RoomCode   string
	SubnetCIDR string
	IP         string
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[Client %s] Connection closed: %v", c.ID, err)
			}
			break
		}

		var env Envelope
		if err := json.Unmarshal(messageBytes, &env); err != nil {
			log.Printf("[Client %s] Invalid JSON envelope: %v", c.ID, err)
			continue
		}

		env.From = c.ID

		// Handle client-side heartbeat
		if env.Type == "ping" {
			pongEnv := Envelope{Type: "pong", From: "server", To: c.ID}
			if b, err := json.Marshal(pongEnv); err == nil {
				c.Send <- b
			}
			continue
		}

		// Handle explicit custom 6-digit room join
		if env.Type == "join-custom-room" {
			type JoinPayload struct {
				RoomCode string `json:"roomCode"`
			}
			var p JoinPayload
			if err := json.Unmarshal(env.Payload, &p); err == nil && len(p.RoomCode) > 0 {
				c.Hub.SwitchRoom(c, p.RoomCode)
			}
			continue
		}

		c.Hub.Route <- &env
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Drain any queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
