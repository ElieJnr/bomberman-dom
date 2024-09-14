package server

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Player struct {
	Name       string
	Connection *websocket.Conn
	Lives      int
	mu         sync.Mutex
	Position   Positions
}

type Positions struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Room struct {
	Players             map[string]*Player
	PlayerCount         int
	MaxPlayers          int
	WaitingTime         time.Duration
	CountdownTime       time.Duration
	CountdownStarted    bool
	GameStarted         bool
	GameOver            bool
	WaitingTimerStarted bool
	mu                  sync.RWMutex
	TempsRestant        int
	isGood              bool
}

type Message struct {
	Type        string   `json:"type"`
	Name        string   `json:"name"`
	Content     string   `json:"content"`
	Action      string   `json:"action"`
	Seconds     int      `json:"seconds,omitempty"`
	PlayerCount int      `json:"playerCount,omitempty"`
	PlayerOrder []Player `json:"playerOrder,omitempty"`
	Lives       int      `json:"lives,omitempty"`
	Row         int      `json:"row,omitempty"`
	Col         int      `json:"col,omitempty"`
}

var (
	room      *Room
	broadcast = make(chan Message, 100)
)

func init() {
	room = &Room{
		Players:       make(map[string]*Player),
		MaxPlayers:    4,
		WaitingTime:   20 * time.Second,
		CountdownTime: 10 * time.Second,
		isGood:        true,
		TempsRestant:  20,
	}
}

func HandlePlayerMessages(player *Player) {
	defer func() {
		HandleClientDisconnection(player)
		player.Connection.Close()
	}()

	for {
		var msg Message
		err := player.Connection.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		HandleMessage(player, msg, room)
	}
}

// Positions

func HandleUpdatePosition(msg Message, player *Player) {
	playerName := msg.Name


	row := msg.Row // JSON numbers are unmarshalled as float64

	col := msg.Col

	fmt.Println("col", col)
	fmt.Println("row", row)

	// Convert float64 to int
	// rowInt := int(row)
	// colInt := int(col)

	if playerName == player.Name{
		player.Position.X = row
		player.Position.Y = col
	}
	message := Message{
		Type: "updatePosition",
		Name: playerName,
		Row:  row,
		Col:  col,
	}

	broadcast <- message

}

func SubtractLives(player *Player) bool {
	// Subtract a life and check if the player is defeated
	player.Lives--
	return player.Lives == 0
}

func HandleMessage(player *Player, msg Message, room *Room) {
	switch msg.Type {
	case "join":
		HandleJoin(player, msg.Name)
		gestionFirstTimer()
	case "action":
		// fmt.Println("players", player)
		// fmt.Println("msg", msg)
		// fmt.Println("room", room)
		if msg.Name == player.Name {
			msg.Lives = player.Lives
			msg.Row = player.Position.X
			msg.Col = player.Position.Y
		}
		broadcast <- msg
	case "subtractLife":
		if msg.Name == player.Name {
			if SubtractLives(player) {
				HandlePlayerRemoval(player, room)
			}
		}
	case "message":
		broadcastMessage := Message{
			Type:        "message",
			Name:        msg.Name,
			PlayerCount: room.PlayerCount,
			Content:     msg.Content,
		}
		BroadcastToRoom(room, broadcastMessage)
	case "updatePosition":
		fmt.Println("yes?",msg)
		HandleUpdatePosition(msg, player)
	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

// func HandleMessage(player *Player, msg Message) {
// 	switch msg.Type {
// 	case "join":
// 		HandleJoin(player, msg.Name)
// 		gestionFirstTimer()
// 	case "action":
// 		broadcast <- msg
// 	case "playerDefeated":
// 		HandlePlayerRemoval(player, room)
// 	case "message":
// 		broadcastMessage := Message{
// 			Type:        "message",
// 			Name:        msg.Name,
// 			PlayerCount: room.PlayerCount,
// 			Content:     msg.Content,
// 		}
// 		BroadcastToRoom(room, broadcastMessage)
// 	default:
// 		log.Printf("Unknown message type: %s", msg.Type)
// 	}
// }

func ResetRoom() {
	room.Players = make(map[string]*Player)
	room.PlayerCount = 0
	room.CountdownStarted = false
	room.GameStarted = false
	room.GameOver = false
	room.WaitingTimerStarted = false
	room.TempsRestant = int(room.WaitingTime.Seconds())
	room.isGood = true
}

func GetPlayerOrder() []Player {
	players := make([]Player, 0, len(room.Players))
	for _, player := range room.Players {
		players = append(players, Player{
			Name:  player.Name,
			Lives: player.Lives,
		})
	}
	return players
}

func HandleBroadcast() {
	for msg := range broadcast {
		room.mu.RLock()
		for _, player := range room.Players {
			go func(p *Player) {
				SendToPlayer(p, msg)
			}(player)
		}
		room.mu.RUnlock()
	}
}

func SendToPlayer(player *Player, msg Message) {
	player.mu.Lock()
	defer player.mu.Unlock()

	err := player.Connection.WriteJSON(msg)
	if err != nil {
		log.Printf("Error sending message to player %s: %v", player.Name, err)
	}
}
