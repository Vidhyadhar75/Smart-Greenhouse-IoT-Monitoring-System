---

# 🌱 Smart Greenhouse IoT Monitoring System

![IoT](https://img.shields.io/badge/IoT-Greenhouse-green)
![ESP32](https://img.shields.io/badge/ESP32-FreeRTOS-blue)
![LoRa](https://img.shields.io/badge/Communication-LoRaWAN-orange)
![MQTT](https://img.shields.io/badge/Protocol-MQTT-yellow)
![React](https://img.shields.io/badge/Frontend-React-blue)
![NodeJS](https://img.shields.io/badge/Backend-Node.js-green)

An **IoT-based Smart Greenhouse Monitoring System** designed to monitor environmental conditions and soil health using distributed sensor nodes.

The system integrates:

* **ESP32 + FreeRTOS**
* **ESP-NOW communication**
* **LoRa Mesh networking (8KM+)**
* **MQTT cloud connectivity**
* **Real-time dashboard**

This architecture enables **long-range monitoring, low power communication, and intelligent greenhouse management**.

![Smart Greenhouse](https://raw.githubusercontent.com/Vidhyadhar75/Smart-Greenhouse-IoT-Monitoring-System/main/Greenhouse.jpeg)


---

# 📡 System Architecture

![Architecture Diagram](https://raw.githubusercontent.com/Vidhyadhar75/Smart-Greenhouse-IoT-Monitoring-System/main/architecture%20diagram.jpg)
### Data Flow

```
Sensor Nodes
     │
     │ ESP-NOW
     ▼
Master Node (Gateway)
     │
     │ LoRa Mesh Network
     ▼
Receiver Node
     │
     │ WiFi
     ▼
MQTT Broker
     │
     ▼
Server + Dashboard
```

---

# 🧠 System Components

## 🌿 Greenhouse Sensor Nodes

Multiple ESP32 nodes collect environmental and soil data.

| Node   | Function                            |
| ------ | ----------------------------------- |
| Node 1 | Air Quality Monitoring              |
| Node 2 | Soil Nutrient Monitoring            |
| Node 3 | Soil Moisture Monitoring            |
| Node 4 | Soil Moisture Monitoring            |
| Node 5 | Soil Moisture Monitoring            |
| Node 6 | Motors / Foggers / Power Monitoring |

All nodes communicate with the **Master Node using ESP-NOW**.
![Nodes](https://raw.githubusercontent.com/Vidhyadhar75/Smart-Greenhouse-IoT-Monitoring-System/main/nodes.jpeg)
![NPK Node](https://raw.githubusercontent.com/Vidhyadhar75/Smart-Greenhouse-IoT-Monitoring-System/main/npk%20node.jpeg)

---

## 🧩 Master Node (Gateway)

The **Master Node** acts as the central gateway.

Responsibilities:

* Receive ESP-NOW packets
* Aggregate sensor data
* Send data via **LoRa**

Hardware:

* ESP32
* LoRa SX1278 / SX1262

---

## 📡 LoRa Mesh Network

Used for **long-distance communication (8KM+)**.

Benefits:

* Low power
* Long range
* Multi-hop mesh communication

---

## 📥 Receiver Node

The receiver node:

* Receives LoRa packets
* Converts data to JSON
* Publishes data to MQTT broker

---

## ☁️ Cloud Server

The server handles:

* MQTT message processing
* Data storage
* API services
* Dashboard visualization

Users can monitor greenhouse conditions remotely.

---

# 🧵 FreeRTOS Architecture

ESP32 uses **FreeRTOS for multitasking**.

Example tasks:

| Task               | Description               |
| ------------------ | ------------------------- |
| Sensor Task        | Reads sensor values       |
| Communication Task | Sends data via ESP-NOW    |
| Control Task       | Controls motors / foggers |
| Processing Task    | Formats data              |



Benefits:

* real-time execution
* parallel processing
* stable system operation

---

# 🌡 Sensors Used

## NPK Sensor

Measures soil nutrients.

Parameters:

* Nitrogen
* Phosphorus
* Potassium

Interface:

RS485 (via MAX485 module)

---

## Soil Moisture Sensor

Measures soil water content.

Used for:

* irrigation control
* water monitoring

Interface:

Analog → ESP32 ADC

---

## MH-Z19 CO₂ Sensor

Measures greenhouse CO₂ concentration.

Technology:

NDIR infrared sensing

Range:

```
0 – 5000 ppm
```

Interface:

UART

---

## BME680 Environmental Sensor

Measures:

* Temperature
* Humidity
* Pressure
* Gas / Air quality

Interface:

I2C

---

# 📊 Sensor Summary

| Sensor        | Measures                             | Interface |
| ------------- | ------------------------------------ | --------- |
| NPK Sensor    | Nitrogen, Phosphorus, Potassium      | RS485     |
| Soil Moisture | Soil water level                     | Analog    |
| MH-Z19        | CO₂ concentration                    | UART      |
| BME680        | Temperature, Humidity, Pressure, Gas | I2C       |

---

# 🧰 Hardware Components

* ESP32
* LoRa SX1278 / SX1262
* NPK Sensor
* Soil Moisture Sensors
* MH-Z19 CO₂ Sensor
* BME680 Sensor
* Relay Modules
* Motors / Foggers
* Power Monitoring Module

---

# 💻 Software Stack

## Firmware

* Arduino Framework
* FreeRTOS
* ESP-NOW
* LoRa communication

---

## Backend

* Node.js
* MQTT Broker
* REST APIs

---

## Frontend

* React
* Vite Dashboard
![Frontend App](https://raw.githubusercontent.com/Vidhyadhar75/Smart-Greenhouse-IoT-Monitoring-System/main/frontend%20app.png)

---

## Cloud

* MQTT Server
* Database
* Web Dashboard

---

# 📡 MQTT Topics

Example topics:

```
greenhouse/airquality
greenhouse/soil
greenhouse/npk
greenhouse/moisture
greenhouse/power
```

Example payload:

```json
{
 "temperature": 28.4,
 "humidity": 65,
 "co2": 420,
 "soil_moisture": 36,
 "nitrogen": 15,
 "phosphorus": 10,
 "potassium": 12
}
```

---

# 📂 Project Structure

```
smart-greenhouse/
│
├── firmware/
│   ├── sensor_nodes/
│   ├── master_node/
│   ├── receiver_node/
│
├── backend/
│   ├── mqtt-server/
│   ├── api/
│
├── frontend/
│   └── dashboard/
│
├── docs/
│   └── architecture.png
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/smart-greenhouse.git
```

---

## Backend Setup

```bash
cd backend
npm install
node server.js
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# 🔮 Future Improvements

* AI crop health prediction
* Automated irrigation system
* Edge AI anomaly detection
* Mobile monitoring application
* Weather prediction integration

---

# 👨‍💻 Author

**Vidhyadhara Rao Kotagiri**
BTech IoT — KL University

---

⭐ If you like this project, please **give it a star on GitHub!**

---

