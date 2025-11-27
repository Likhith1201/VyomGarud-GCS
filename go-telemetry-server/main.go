package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// --- CONFIGURATION ---
const (
	UDPPort       = ":14551"
	WebSocketPort = ":5000"
)

// --- DATA STRUCTURES ---
type TelemetryData struct {
	Lat     float64 `json:"lat"`
	Lon     float64 `json:"lon"`
	Alt     float64 `json:"alt"`
	Heading float64 `json:"heading"`
	Speed   float64 `json:"speed"`
	Battery int     `json:"battery"`
	Mode    string  `json:"mode"`
}

var (
	clients   = make(map[*websocket.Conn]bool)
	broadcast = make(chan TelemetryData)
	upgrader  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	mutex = &sync.Mutex{}
)

func main() {
	fmt.Println("🚀 VyomGarud GoLang High-Speed Engine Starting...")

	go startUDPListener()
	go handleMessages()

	http.HandleFunc("/", handleConnections)
	
	fmt.Printf("WebSocket Server listening on localhost%s\n", WebSocketPort)
	fmt.Printf("UDP Listener waiting on %s\n", UDPPort)
	
	err := http.ListenAndServe(WebSocketPort, nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}

func startUDPListener() {
	addr, _ := net.ResolveUDPAddr("udp", UDPPort)
	conn, _ := net.ListenUDP("udp", addr)
	defer conn.Close()
	buffer := make([]byte, 1024)
	startTime := time.Now()
	
	// Physics Constants
	radius := 0.002
	latBase := 12.9716
	lonBase := 77.5946

	for {
		_, _, err := conn.ReadFromUDP(buffer)
		if err != nil { continue }

		// GoLang Physics Engine
		elapsed := time.Since(startTime).Seconds()
		angle := elapsed * 0.5

		data := TelemetryData{
			Lat:     latBase + math.Sin(angle)*radius,
			Lon:     lonBase + math.Cos(angle)*radius,
			Alt:     50 + math.Sin(angle)*10, 
			Heading: 0,
			Speed:   22.5, 
			Battery: 99,
			Mode:    "FLYING (GO-LANG)",
		}

		broadcast <- data
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer ws.Close()

	mutex.Lock()
	clients[ws] = true
	mutex.Unlock()
	
	fmt.Println("New Client Connected (Native WebSocket)!")

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			mutex.Lock()
			delete(clients, ws)
			mutex.Unlock()
			break
		}
	}
}

func handleMessages() {
	for {
		data := <-broadcast
		
		// Send RAW JSON 
		jsonBody, _ := json.Marshal(data)

		mutex.Lock()
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, jsonBody)
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
		mutex.Unlock()
	}
}