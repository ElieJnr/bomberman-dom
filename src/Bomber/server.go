package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
var (
	waitingRoom = make(map[*websocket.Conn]string)
	broadcast   = make(chan Message)
	ClientName  string
	playerCount = 0
	maxWaitTime = 20
)

type Message struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Content     string `json:"content"`
	Action      string `json:"action"`
	Seconds     int    `json:"seconds,omitempty"`
	PlayerCount int    `json:"playerCount,omitempty"`
}

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()
	for {
		waitingRoom[conn] = ""
		fmt.Println("Client connected")
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Error reading message:", err)
			if waitingRoom[conn] != "" {
				broadcast <- Message{Type: "playerDisconnected", Name: waitingRoom[conn]}
				delete(waitingRoom, conn)
				playerCount--
			}
			break
		}

		if msg.Type == "join" {
			if waitingRoom[conn] == "" {
				// fmt.Printf("%s connected\n", msg.Name)
				waitingRoom[conn] = msg.Name
				playerCount++
				broadcast <- Message{Type: "playerJoined", Name: msg.Name, Seconds: maxWaitTime, PlayerCount: playerCount}
			}
		} else if msg.Type == "logout" {
			if waitingRoom[conn] != "" {
				broadcast <- Message{Type: "playerDisconnected", Name: waitingRoom[conn]}
				delete(waitingRoom, conn)
				playerCount--
			}
			break
		} else {
			broadcast <- msg
		}
	}
}
func handleMessages() {
	for {
		msg := <-broadcast
		fmt.Println("msg", msg)
		for client, name := range waitingRoom {
			if name != msg.Name {
				err := client.WriteJSON(msg)
				if err != nil {
					fmt.Println("Error sending message:", err)
					broadcast <- Message{Type: "playerDisconnected", Name: name}
					client.Close()
					delete(waitingRoom, client)
				}
			}
		}
	}
}
func main() {
	http.HandleFunc("/", handleConnection)
	go handleMessages()
	fmt.Println("Server started at ws://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
