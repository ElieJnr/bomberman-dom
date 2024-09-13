package server

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

func HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	go SendPingMessages(conn, room)

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway) {
				handleClientDisconnection(conn, room)
				break
			}
			fmt.Println("Error reading message:", err)
			handleClientDisconnection(conn, room)
			continue
		}

		if msg.Type == "" {
			conn.WriteJSON(Message{Type: "error", Content: "Invalid message format"})
			continue
		}

		handleMessageFromClients(msg, conn)
	}
}

func SendPingMessages(conn *websocket.Conn, room *Room) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				fmt.Printf("Error sending ping message: %v\n", err)
				handleClientDisconnection(conn, room)
				return
			}
		}
	}
}

func handleMessageFromClients(msg Message, conn *websocket.Conn) {
	switch msg.Type {
	case "join":
		playerOrder := make([]Player, 0, len(room.Players))
		for _, player := range room.Players {
			playerOrder = append(playerOrder, Player{
				Name: player.Name,
			})
		}

		if contains(playerOrder, msg.Name) {
			conn.WriteJSON(Message{Type: "pseudoUsed"})
			break
		}

		HandleJoin(conn, msg.Name)

		gestionFirstTimer()


		if room.PlayerCount == 4 {			
			room.CountdownStarted = true
			broadcast <- Message{
				Type:        "startPreparation",
				Content:     "Starting countdown in 10 seconds.",
				PlayerCount: room.PlayerCount,
				PlayerOrder: playerOrder,
			}

		}


	case "playerDefeated":
		player, exists := room.Players[msg.Name]
		if exists {
			handlePlayerDefeated(player, room)
		} else {
			fmt.Printf("Player %s does not exist in the room\n", msg.Name)
		}
	case "action":
		SendMessageToClients(msg, room)
	default:
		SendMessageToClients(msg, room)
	}
}

func gestionFirstTimer() {
	if room.isGood && room.PlayerCount > 1 {
		go func() {
			room.isGood = false
			for i := 0; i <= 20; i++ {
				room.TempsRestant = int(room.WaitingTime.Seconds()) - i - 1
				time.Sleep(1 * time.Second)
			}
			room.isGood = true
		}()
	}
}

func HandleJoin(conn *websocket.Conn, name string) {
	room.mu.Lock()
	defer room.mu.Unlock()

	if room.GameStarted {
		conn.WriteJSON(Message{Type: "gameStarted", Content: "Game has already started. You cannot join now."})
		CloseConn(conn)
		return
	}

	if _, exists := room.Players[name]; !exists {
		player := &Player{
			Name:       name,
			Connection: conn,
			Lives:      3,
		}
		room.Players[name] = player
		room.PlayerCount++

		BroadcastPlayerJoined(name)

		if room.PlayerCount > 4 && !room.CountdownStarted {
			room.CountdownStarted = true
			go StartCountdown()
		} else if room.PlayerCount >= 2 && !room.CountdownStarted && !room.WaitingTimerStarted {
			room.WaitingTimerStarted = true
			go StartWaitingTimer()
		}
	}
}

func StartWaitingTimer() {
	time.AfterFunc(room.WaitingTime, func() {
		room.mu.Lock()
		defer room.mu.Unlock()

		playerOrder := make([]Player, 0, len(room.Players))
		for _, player := range room.Players {
			playerOrder = append(playerOrder, Player{
				Name:  player.Name,
				Lives: player.Lives,
			})
		}

		if room.PlayerCount >= 4 {
			go StartCountdown()
		} else if room.PlayerCount >= 2 {
			room.CountdownStarted = true
			broadcast <- Message{
				Type:        "startPreparation",
				Content:     "Starting countdown in 10 seconds.",
				PlayerCount: room.PlayerCount,
				PlayerOrder: playerOrder,
			}
			time.AfterFunc(room.CountdownTime, func() {
				room.mu.Lock()
				defer room.mu.Unlock()

				if room.PlayerCount >= 2 {
					StartCountdown()
				} else {
					RemoveRoom()
				}
			})
		} else {
			// RemoveRoom()
		}
	})
}

func StartCountdown() {
	room.mu.Lock()
	defer room.mu.Unlock()

	playerOrder := make([]Player, 0, len(room.Players))
	for _, player := range room.Players {
		playerOrder = append(playerOrder, Player{
			Name:  player.Name,
			Lives: player.Lives,
		})
	}

	room.CountdownStarted = true
	for _, player := range room.Players {
		player.Connection.WriteJSON(Message{
			Type:        "startPreparation",
			Name:        player.Name,
			Content:     "Game is starting in 10 seconds!",
			Seconds:     int(room.CountdownTime.Seconds()),
			PlayerCount: room.PlayerCount,
			PlayerOrder: playerOrder,
		})
	}

	time.AfterFunc(room.CountdownTime, func() {
		room.mu.Lock()
		defer room.mu.Unlock()

		if room.PlayerCount >= 2 {
			room.GameStarted = true
			for _, player := range room.Players {
				player.Connection.WriteJSON(Message{
					Type:        "gameStarted",
					Name:        player.Name,
					Content:     "The game is now starting!",
					Seconds:     0,
					PlayerCount: room.PlayerCount,
					PlayerOrder: playerOrder,
				})
			}
		} else {
			RemoveRoom()
		}
	})
}

func handleClientDisconnection(conn *websocket.Conn, room *Room) {
	room.mu.Lock()
	defer room.mu.Unlock()

	for _, player := range room.Players {
		if player.Connection == conn {
			RemovePlayer(player, room)
			return
		}
	}
}

func RemovePlayer(player *Player, room *Room) {
	fmt.Printf("Player %s disconnected\n", player.Name)

	delete(room.Players, player.Name)
	room.PlayerCount--

	if room.PlayerCount == 1 {
		for _, remainingPlayer := range room.Players {
			err := remainingPlayer.Connection.WriteJSON(Message{
				Type:    "gameEnded",
				Content: "You are the last player remaining. You win!",
			})
			if err != nil {
				fmt.Println("Error sending win message:", err)
			}
		}
		EndGame(room)
	} else if room.PlayerCount > 1 {
		broadcastMessage := Message{
			Type:        "playerDisconnected",
			Name:        player.Name,
			PlayerCount: room.PlayerCount,
			Content:     fmt.Sprintf("Player %s has been defeated. %d players remaining.", player.Name, room.PlayerCount),
		}
		BroadcastToRoom(room, broadcastMessage)
	} else {
		room.CountdownStarted = false
	}
}

func BroadcastToRoom(room *Room, message Message) {
	for _, player := range room.Players {
		err := player.Connection.WriteJSON(message)
		if err != nil {
			fmt.Printf("Error sending message to player %s: %v\n", player.Name, err)
		}
	}
}

func handlePlayerDefeated(player *Player, room *Room) {
	RemovePlayer(player, room)
}

func BroadcastPlayerJoined(name string) {
	playerOrder := make([]Player, 0, len(room.Players))
	for _, player := range room.Players {
		playerOrder = append(playerOrder, Player{
			Name:  player.Name,
			Lives: player.Lives,
		})
	}

	broadcast <- Message{
		Type:        "playerJoined",
		Name:        name,
		Seconds: room.TempsRestant,
		PlayerCount: room.PlayerCount,
		PlayerOrder: playerOrder,
	}
}

func CloseConn(conn *websocket.Conn) {
	conn.Close()
}

func RemoveRoom() {
	room = &Room{
		Players:       make(map[string]*Player),
		MaxPlayers:    4,
		WaitingTime:   20 * time.Second,
		CountdownTime: 10 * time.Second,
	}
}

func contains(arr []Player, target string) bool {
	for _, element := range arr {
		if element.Name == target {
			return true
		}
	}
	return false
}
