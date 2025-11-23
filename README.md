# 🛰️ VyomGarud: Sentinel-X1 Ground Control System (GCS)

A **military-grade, cloud-capable Ground Control Station** developed for the **VyomGarud Round 3 Technical Challenge**.  
This system visualizes real-time telemetry from UAVs using the **MAVLink** protocol, supporting hybrid communication environments (4G/LTE + LoRa).

---

## 🎯 Mission Capabilities

- **Sentinel-X1 Telemetry** — Decodes MAVLink v2.0 data including Attitude, GPS coordinates, Home Position & Battery.
- **Tactical Map Tracking** — Live UAV geolocation using Leaflet with custom drone icons.
- **Real-time Flight Analytics** — Dynamic graphing for altitude & ground speed at up to 10Hz refresh rate.
- **Hybrid Link Simulation** — UDP-based streaming simulating loiter flight patterns over Bangalore.

---

## 🛠 Tech Stack

| Layer | Technologies |
|--------|--------------|
| **Frontend** | React, Vite, Leaflet Maps, Recharts, Socket.io-client |
| **Backend** | Python, Flask, Flask-SocketIO, PyMAVLink |
| **Protocols** | UDP (MAVLink v2.0), WebSockets (Real-Time JSON) |
| **Dev Tools** | VS Code, Postman, Linux/Windows |

---

## 📁 System Structure

```text
/backend
  ├── app.py           # Telemetry Server (MAVLink In -> WebSocket Out)
  ├── simulator.py     # Sentinel-X1 Simulator - Loiter flight generator
  └── requirements.txt # Python dependencies

/frontend
  ├── src/             # Dashboard UI + Map + Charts
  └── package.json     # Frontend libraries
```

---

## ⚙️ Deployment Instructions

### 🔹 Prerequisites
- Python 3.10+
- Node.js + npm

---

### **Phase 1: Initialize Backend Core**

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start telemetry server:

```bash
python app.py
```

📡 Status: Server listening for MAVLink packets on **UDP Port 14551**

---

### **Phase 2: Launch Mission Control (Frontend)**

```bash
cd frontend
npm install
npm run dev
```

Access GCS:  
👉 **http://localhost:5173**  
📍 Status: Displays **"SEARCHING FOR LINK"**

---

### **Phase 3: Start UAV Flight Simulation**

Open another terminal inside backend and run:

```bash
cd backend
python simulator.py
```

✈️ Result: Dashboard status switches to **FLYING**, drone begins **loiter pattern over Bangalore** with real-time movement.

---

## 🛰 Architecture & Data Flow

```
Drone Simulator  --->  MAVLink UDP  --->  Flask Telemetry Server
  (simulator.py)          (14551)         (app.py / pymavlink)
                                     |
                                     └── WebSockets ---> React Dashboard
                                             (socket.io)
```

### Layer Breakdown

| Layer | Purpose |
|--------|----------|
| **Drone Layer** | Generates MAVLink heartbeat/position/attitude packets |
| **Backend Layer** | Converts binary MAVLink to JSON, broadcasts via WebSocket |
| **Frontend Layer** | Renders live maps, charts & telemetry cards |

---

## ⚠️ Troubleshooting

| Issue | Cause | Fix |
|--------|--------|------|
| Dashboard stuck on **DISCONNECTED** | Port 14551 already in use or dead process | Restart VS Code + retry backend → frontend → simulator order |
| Simulator shows packet errors | Python dependencies missing | Reinstall: `pip install -r requirements.txt` |

---

## 👨‍💻 Developed By

**Pullela Likhith**  
For **VyomGarud Recruitment Drive — Round 3 Technical Challenge**

