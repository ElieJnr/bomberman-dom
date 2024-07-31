package main

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	upgrader         = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	waitingRoom      = make(map[*websocket.Conn]string)
	broadcast        = make(chan Message)
	playerCount      = 0
	maxWaitTime      = 20
	mu               sync.Mutex
	countdownStarted = false
	gameStarted      = false
	playerOrder      []string
)

type Message struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Content     string `json:"content"`
	Action      string `json:"action"`
	Seconds     int    `json:"seconds,omitempty"`
	PlayerCount int    `json:"playerCount,omitempty"`
	PlayerOrder []string `json:"playerOrder,omitempty"`
}

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Error reading message:", err)
			handleDisconnection(conn)
			break
		}

		switch msg.Type {
		case "join":
			handleJoin(conn, msg.Name)
		case "logout":
			handleLogout(conn)
		default:
			broadcast <- msg
		}
	}
}

func handleJoin(conn *websocket.Conn, name string) {
	mu.Lock()
	defer mu.Unlock()

	if gameStarted {
		conn.WriteJSON(Message{Type: "gameStarted", Content: "Game has already started. You cannot join now."})
		closeConn(conn)
		return
	}

	if _, exists := waitingRoom[conn]; !exists {
		fmt.Printf("%s connected\n", name)
		waitingRoom[conn] = name
		playerOrder = append(playerOrder, name)
		playerCount++
		broadcast <- Message{Type: "playerJoined", Name: name, Seconds: maxWaitTime, PlayerCount: playerCount, PlayerOrder: playerOrder}
		// Commence le compte à rebours de 20 secondes si c'est le deuxième joueur
		if playerCount == 2 && !countdownStarted {
			go startCountdown()
		}
	}
}

func handleLogout(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()

	if name, exists := waitingRoom[conn]; exists {
		
		delete(waitingRoom, conn)
		removePlayerFromOrder(name)
		playerCount--
		broadcast <- Message{
            Type:        "playerDisconnected",
            Name:        name,
            PlayerOrder: playerOrder,
            PlayerCount: playerCount,
        }
	}
}

func handleDisconnection(conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()

	if name, exists := waitingRoom[conn]; exists {
		
		delete(waitingRoom, conn)
		removePlayerFromOrder(name)
		playerCount--
		if playerCount<2{
			countdownStarted = false
		}
		broadcast <- Message{
            Type:        "playerDisconnected",
            Name:        name,
            PlayerOrder: playerOrder,
            PlayerCount: playerCount,
        }
	}
}

func handleMessages() {
	for msg := range broadcast {
		mu.Lock()
		for client := range waitingRoom {
			if err := client.WriteJSON(msg); err != nil {
				fmt.Println("Error sending message to client:", err)
				handleDisconnection(client)
			} else {
				fmt.Println("Message sent to client:", msg)
			}
		}
		mu.Unlock()
	}
}

func removePlayerFromOrder(name string) {
    for i, player := range playerOrder {
        if player == name {
            playerOrder = append(playerOrder[:i], playerOrder[i+1:]...)
            break
        }
    }
}

func startCountdown() {
	countdownStarted = true
	defer func() { countdownStarted = false }()

	for i := 0; i < 20; i++ {
		time.Sleep(1 * time.Second)
        maxWaitTime--
		if playerCount == 4 {
			// Si 4 joueurs, on arrête le compte à rebours de 20s et on lance celui de 10s
			break
		}
		if !countdownStarted{
			maxWaitTime=20
			return
		}
	}

	// À la fin des 20s ou si 4 joueurs ont rejoint pendant les 20s
	if playerCount >= 2 {
        gameStarted = true
		broadcast <- Message{Type: "startPreparation"}
		time.Sleep(10 * time.Second)
		broadcast <- Message{Type: "startGame"}
		
	} else {
		broadcast <- Message{Type: "notEnoughPlayers"}
	}
	maxWaitTime=20
}

func closeConn(conn *websocket.Conn) {
	conn.Close()
}


func main() {
	http.HandleFunc("/", handleConnection)

	go handleMessages()

	fmt.Println("Server started at ws://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
