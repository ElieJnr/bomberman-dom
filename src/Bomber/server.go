package main

import (
    "fmt"
    "github.com/gorilla/websocket"
    "net/http"
    "sync"
)

var (
    upgrader    = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
    waitingRoom = make(map[*websocket.Conn]string)
    broadcast   = make(chan Message)
    playerCount = 0
    maxWaitTime = 20 
    mu          sync.Mutex
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
            break
        default:
            broadcast <- msg
        }
    }
}

func handleJoin(conn *websocket.Conn, name string) {
    mu.Lock()
    defer mu.Unlock()

    if _, exists := waitingRoom[conn]; !exists {
        fmt.Printf("%s connected\n", name)
        waitingRoom[conn] = name
        playerCount++
        broadcast <- Message{Type: "playerJoined", Name: name, Seconds: maxWaitTime, PlayerCount: playerCount}
    }
}

func handleLogout(conn *websocket.Conn) {
    mu.Lock()
    defer mu.Unlock()

    if name, exists := waitingRoom[conn]; exists {
        broadcast <- Message{Type: "playerDisconnected", Name: name}
        delete(waitingRoom, conn)
        playerCount--
    }
}

func handleDisconnection(conn *websocket.Conn) {
    mu.Lock()
    defer mu.Unlock()

    if name, exists := waitingRoom[conn]; exists {
        broadcast <- Message{Type: "playerDisconnected", Name: name}
        delete(waitingRoom, conn)
        playerCount--
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

func main() {
    http.HandleFunc("/", handleConnection)

    go handleMessages()

    fmt.Println("Server started at ws://localhost:8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        fmt.Println("Error starting server:", err)
    }
}
