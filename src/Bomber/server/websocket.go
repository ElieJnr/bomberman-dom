package server

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var (
	upgrader    = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	waitingRoom = make(map[*websocket.Conn]string)
	broadcast   = make(chan Message)
)

func HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	go SendPingMessages(conn)

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Error reading message:", err)
			HandleDisconnection(conn)
			break
		}

		fmt.Println("Message received:", msg)

		switch msg.Type {
		case "join":
			HandleJoin(conn, msg.Name)
		case "logout":
			HandleLogout(conn)
		default:
			broadcast <- msg
		}
	}
}

func SendPingMessages(conn *websocket.Conn) {
	for {
		time.Sleep(10 * time.Second)
		if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
			fmt.Println("Error sending ping message:", err)
			HandleDisconnection(conn)
			return
		}
	}
}

func HandleJoin(conn *websocket.Conn, name string) {
	mu.Lock()
	defer mu.Unlock()

	if gameStarted {
		conn.WriteJSON(Message{Type: "gameStarted", Content: "Game has already started. You cannot join now."})
		CloseConn(conn)
		return
	}

	if _, exists := waitingRoom[conn]; !exists {
		fmt.Printf("%s connected\n", name)
		waitingRoom[conn] = name
		playerOrder = append(playerOrder, name)
		playerCount++
		BroadcastPlayerJoined(name)

		if playerCount == 2 && !countdownStarted {
			go StartCountdown()
		}
	}
}

func HandleLogout(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()

	RemovePlayer(conn)
}

func HandleDisconnection(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()

	RemovePlayer(conn)
}

func RemovePlayer(conn *websocket.Conn) {
	name, exists := waitingRoom[conn]
	if !exists {
		name = "Unknown"
	}

	fmt.Printf("Player %s disconnected\n", name)
	delete(waitingRoom, conn)
	RemovePlayerFromOrder(name)
	playerCount--

	if playerCount < 2 {
		countdownStarted = false
	}

	broadcast <- Message{
		Type:        "playerDisconnected",
		Name:        name,
		PlayerOrder: playerOrder,
		PlayerCount: playerCount,
	}
}

func BroadcastPlayerJoined(name string) {
	broadcast <- Message{
		Type:        "playerJoined",
		Name:        name,
		Seconds:     maxWaitTime,
		PlayerCount: playerCount,
		PlayerOrder: playerOrder,
	}
}

func CloseConn(conn *websocket.Conn) {
	conn.Close()
}
