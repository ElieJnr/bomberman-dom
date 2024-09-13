package main

import (
	"bomberman/server"
	"log"
	"net/http"
)

/* func main() {
	http.HandleFunc("/", server.HandleConnection)

	go server.HandleMessages()

	fmt.Println("Server started at ws://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
} */

func main() {
	http.HandleFunc("/", server.HandleConnection)
	go server.HandleBroadcast()

	log.Println("Server started at ws://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
