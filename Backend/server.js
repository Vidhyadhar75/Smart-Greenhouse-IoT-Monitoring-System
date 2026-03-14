const mqtt = require("mqtt")
const WebSocket = require("ws")
const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000

/* ---------------- MQTT CONNECTION ---------------- */

const MQTT_BROKER = "mqtt://34.100.154.108:1883"

const mqttClient = mqtt.connect(MQTT_BROKER,{
reconnectPeriod: 2000
})

/* latest sensor values */

const latestData = {}

const topics = [

"greenhouse/air/temperature",
"greenhouse/air/humidity",
"greenhouse/air/co2",
"greenhouse/air/pressure",
"greenhouse/air/gas",

"greenhouse/npk/moisture",
"greenhouse/npk/temperature",
"greenhouse/npk/ph",
"greenhouse/npk/ec",
"greenhouse/npk/nitrogen",
"greenhouse/npk/phosphorus",
"greenhouse/npk/potassium",

"greenhouse/soil/moisture",

"greenhouse/power/voltage",
"greenhouse/power/current",
"greenhouse/power/power"

]
mqttClient.on("connect",()=>{

console.log("MQTT Connected")

topics.forEach(topic=>{
mqttClient.subscribe(topic)
})

})

mqttClient.on("reconnect",()=>{
console.log("MQTT Reconnecting...")
})

mqttClient.on("error",(err)=>{
console.error("MQTT Error:",err)
})

mqttClient.on("message",(topic,message)=>{

const value = parseFloat(message.toString())

latestData[topic] = value

broadcast({
type:"update",
topic,
value
})

})

/* ---------------- EXPRESS SERVER ---------------- */

const server = app.listen(PORT,()=>{
console.log("Server running on",PORT)
})

/* ---------------- MOTOR CONTROL API ---------------- */

app.post("/motor",(req,res)=>{

const {motor,state} = req.body

if(!motor){
return res.status(400).json({error:"motor missing"})
}

const topic = `greenhouse/motors/${motor}/set`

mqttClient.publish(topic,state)

console.log("Motor command:",topic,state)

res.json({
status:"ok",
topic,
state
})

})

/* ---------------- WEBSOCKET ---------------- */

const wss = new WebSocket.Server({server})

function broadcast(data){

wss.clients.forEach(client=>{
if(client.readyState === WebSocket.OPEN){
client.send(JSON.stringify(data))
}
})

}

wss.on("connection",(ws)=>{

console.log("Dashboard connected")

/* send latest stored values */

ws.send(JSON.stringify({
type:"init",
data:latestData
}))

ws.on("close",()=>{
console.log("Dashboard disconnected")
})

})