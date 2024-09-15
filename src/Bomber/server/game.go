package server

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

func HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}

	player := &Player{
		Connection: conn,
		Lives:      3,
	}

	log.Println("New client connected")

	go HandlePlayerMessages(player)
}

func SendPingMessages(conn *websocket.Conn, room *Room) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				fmt.Printf("Error sending ping message: %v\n", err)

				var playerToDisconnect *Player
				for _, player := range room.Players {
					if player.Connection == conn {
						playerToDisconnect = player
						break
					}
				}

				if playerToDisconnect != nil {
					HandleClientDisconnection(playerToDisconnect)
				}
				return
			}
		}
	}
}

func gestionFirstTimer() {
	if room.isGood && room.PlayerCount > 1 {
		go func() {
			room.isGood = false
			ticker := time.NewTicker(1 * time.Second)
			defer ticker.Stop()

			for i := 0; i <= 20; i++ {
				select {
				case <-ticker.C:
					room.TempsRestant--
				}
			}
			room.isGood = true
		}()
	}
}

func HandleJoin(player *Player, name string) {
	room.mu.Lock()
	defer room.mu.Unlock()

	if room.GameStarted {
		SendToPlayer(player, Message{Type: "error", Content: "Game has already started"})
		return
	}

	if _, exists := room.Players[name]; exists {
		SendToPlayer(player, Message{Type: "pseudoUsed"})
		return
	}

	player.Name = name
	room.Players[name] = player
	room.PlayerCount++
	if room.PlayerCount == 1 {
		player.Position.X = 1
		player.Position.Y = 1
	} else if room.PlayerCount == 2 {
		player.Position.X = 1
		player.Position.Y = 19
	} else if room.PlayerCount == 3 {
		player.Position.X = 11
		player.Position.Y = 1
	} else if room.PlayerCount == 4 {
		player.Position.X = 11
		player.Position.Y = 19
	}

	BroadcastPlayerJoined(name)
	fmt.Println("connected", name)

	if room.PlayerCount >= 2 && !room.CountdownStarted && !room.WaitingTimerStarted {
		room.WaitingTimerStarted = true
		go StartWaitingTimer()
	}
	// gestionFirstTimer()
}

func StartWaitingTimer() {
	for i := 0; i < int(room.WaitingTime.Seconds()); i++ {
		time.Sleep(1 * time.Second)
		room.mu.Lock()
		if room.PlayerCount == 4 {
			room.mu.Unlock()
			break
		}
		room.mu.Unlock()
	}

	room.mu.Lock()
	defer room.mu.Unlock()

	if room.PlayerCount >= 2 {
		fmt.Println("StartWaitingTimerFinish", room.PlayerCount)
		room.CountdownStarted = true
		broadcast <- Message{
			Type:        "startPreparation",
			Content:     "Starting countdown in 10 seconds.",
			PlayerCount: room.PlayerCount,
			PlayerOrder: GetPlayerOrder(),
		}
		room.GameStarted = true
	} else {
		room.WaitingTimerStarted = false
	}
}

func HandleClientDisconnection(player *Player) {
	room.mu.Lock()
	defer room.mu.Unlock()

	// delete(room.Players, player.Name)
	// room.PlayerCount--

	if _, exists := room.Players[player.Name]; exists {
		if room.PlayerCount == 1 {
			EndGame("You are the last player remaining. You win!")
		} else if room.PlayerCount > 1 {
			fmt.Println("HandleClientDisconnection")
			broadcast <- Message{
				Type:        "playerDisconnected",
				Name:        player.Name,
				PlayerCount: room.PlayerCount,
				PlayerOrder: GetPlayerOrder(),
				Content:     fmt.Sprintf("Player %s has been defeated. %d players remaining.", player.Name, room.PlayerCount),
			}
		} else {
			ResetRoom()
		}
	}
}

func BroadcastToRoom(room *Room, message Message) {
	room.mu.RLock()
	defer room.mu.RUnlock()

	for _, player := range room.Players {
		player.mu.Lock()
		err := player.Connection.WriteJSON(message)
		player.mu.Unlock()
		if err != nil {
			fmt.Printf("Error sending message to player %s: %v\n", player.Name, err)
		}
	}
}

func HandlePlayerRemoval(player *Player, room *Room) {
	room.mu.Lock()
	defer room.mu.Unlock()
	fmt.Println("HandlePlayerRemoval", room.PlayerCount)

	// if isDefeated {
	// 	player.Lives--
	// }
	var nameplayer = player.Name
	for _, player := range room.Players {
		player.mu.Lock()
		message := Message{
			Type: "rmplayer",
			Name: nameplayer,
		}
		err := player.Connection.WriteJSON(message)
		player.mu.Unlock()
		if err != nil {
			fmt.Printf("Error sending message to player %s: %v\n", player.Name, err)
		}
	}

	// if player.Lives == 0  {
		if _, exists := room.Players[player.Name]; exists {
			delete(room.Players, player.Name)
			room.PlayerCount--
		}


	fmt.Println("HandlePlayerRemoval1", room.PlayerCount)

	if room.PlayerCount == 1 {
		fmt.Println("HandlePlayerRemoval2", room.PlayerCount)

		for _, remainingPlayer := range room.Players {
			err := remainingPlayer.Connection.WriteJSON(Message{
				Type:    "gameEnded",
				Content: "You are the last player remaining. You win!",
			})
			if err != nil {
				fmt.Println("Error sending win message:", err)
			}
		}
		// EndGame("The game has ended as there is only one player remaining.")
	} else if room.PlayerCount > 1 {
		fmt.Println("HandlePlayerRemoval3", room.PlayerCount)

		// broadcastMessage := Message{
		// 	Type:        "playerRemoved",
		// 	Name:        player.Name,
		// 	PlayerCount: room.PlayerCount,
		// 	PlayerOrder: GetPlayerOrder(),
		// 	Content:     messageContent,
		// }
		// BroadcastToRoom(room, broadcastMessage)
	} else {
		room.CountdownStarted = false
	}
}

func BroadcastPlayerJoined(name string) {
	broadcast <- Message{
		Type:        "playerJoined",
		Name:        name,
		Seconds:     room.TempsRestant,
		PlayerCount: room.PlayerCount,
		PlayerOrder: GetPlayerOrder(),
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

func EndGame(message string) {
	broadcast <- Message{
		Type:    "gameEnded",
		Content: message,
	}
	ResetRoom()
}
