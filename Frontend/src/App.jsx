import React, { useState, useEffect } from "react";
import {
FaTemperatureHigh,
FaTint,
FaBolt,
FaLeaf,
FaWater,
FaWind,
FaCog,
FaMoon,
FaSun
} from "react-icons/fa";

import {
LineChart,
Line,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer
} from "recharts";

/* ---------------- MQTT TOPIC MAP ---------------- */

const topicMap = {

"greenhouse/air/temperature":"Temperature",
"greenhouse/air/humidity":"Humidity",
"greenhouse/air/co2":"CO2",
"greenhouse/air/pressure":"Pressure",
"greenhouse/air/gas":"Gas",

"greenhouse/npk/moisture":"Moisture",
"greenhouse/npk/temperature":"NPK Temperature",
"greenhouse/npk/ph":"pH",
"greenhouse/npk/ec":"EC",
"greenhouse/npk/nitrogen":"Nitrogen",
"greenhouse/npk/phosphorus":"Phosphorus",
"greenhouse/npk/potassium":"Potassium",

"greenhouse/soil/moisture":"Soil Moisture",

"greenhouse/power/voltage":"Voltage",
"greenhouse/power/current":"Current",
"greenhouse/power/power":"Power"

};

/* ---------------- CHART DATA ---------------- */

const initialChart=[];

for(let i=1;i<=10;i++){
initialChart.push({
time:i,
temp:0,
hum:0,
co2:0
});
}

/* ---------------- SENSOR CONFIG ---------------- */

const sections=[

{
name:"Air Quality",
nodes:[
{ name:"CO2", unit:"ppm", min:0, max:4000, icon:<FaWind/> },
{ name:"Temperature", unit:"°C", min:0, max:50, icon:<FaTemperatureHigh/> },
{ name:"Humidity", unit:"%", min:0, max:100, icon:<FaTint/> },
{ name:"Pressure", unit:"Pa", min:90000, max:110000, icon:<FaWind/> },
{ name:"Gas", unit:"mol", min:0, max:10, icon:<FaLeaf/> }
]
},

{
name:"NPK",
nodes:[
{ name:"Moisture", unit:"%", min:0, max:100, icon:<FaWater/> },
{ name:"NPK Temperature", unit:"°C", min:0, max:50, icon:<FaTemperatureHigh/> },
{ name:"pH", unit:"pH", min:0, max:14, icon:<FaLeaf/> },
{ name:"EC", unit:"ec", min:0, max:5, icon:<FaBolt/> },
{ name:"Nitrogen", unit:"N2", min:0, max:200, icon:<FaLeaf/> },
{ name:"Phosphorus", unit:"phs", min:0, max:100, icon:<FaLeaf/> },
{ name:"Potassium", unit:"mmol", min:0, max:100, icon:<FaLeaf/> }
]
},

{
name:"Soil",
nodes:[
{ name:"Soil Moisture", unit:"m3", min:0, max:4093, icon:<FaWater/> }
]
},

{
name:"Motors",
motors:true
},

{
name:"Power",
nodes:[
{ name:"Voltage", unit:"V", min:0, max:24, icon:<FaBolt/> },
{ name:"Current", unit:"A", min:0, max:10, icon:<FaBolt/> },
{ name:"Power", unit:"W", min:0, max:500, icon:<FaBolt/> }
]
}

];

/* ---------------- RANDOM SENSOR DATA ---------------- */

function generateSensorData(){

return{

"greenhouse/air/temperature": 26 + Math.random()*6,
"greenhouse/air/humidity": 55 + Math.random()*20,
"greenhouse/air/co2": 420 + Math.random()*200,
"greenhouse/air/pressure": 100000 + Math.random()*200,
"greenhouse/air/gas": Math.random()*5,

"greenhouse/npk/moisture": 40 + Math.random()*30,
"greenhouse/npk/temperature": 25 + Math.random()*5,
"greenhouse/npk/ph": 6 + Math.random()*1.5,
"greenhouse/npk/ec": 1 + Math.random()*2,
"greenhouse/npk/nitrogen": 40 + Math.random()*40,
"greenhouse/npk/phosphorus": 20 + Math.random()*20,
"greenhouse/npk/potassium": 30 + Math.random()*30,

"greenhouse/soil/moisture": 1500 + Math.random()*500,

"greenhouse/power/voltage": 12 + Math.random()*1,
"greenhouse/power/current": 1 + Math.random()*2,
"greenhouse/power/power": 40 + Math.random()*80

};

}

/* ---------------- SENSOR CARD ---------------- */

function SensorCard({node,value,dark}){

const percent=((value-node.min)/(node.max-node.min))*100;

let color="#22c55e";
let bg=dark?"#1e293b":"#ecfdf5";
let border="#bbf7d0";

if(percent>75){
color="#ef4444";
bg=dark?"#3f1d1d":"#fef2f2";
border="#fecaca";
}
else if(percent>50){
color="#f59e0b";
bg=dark?"#3f2f16":"#fffbeb";
border="#fde68a";
}

return(

<div style={{
background:bg,
padding:"22px",
borderRadius:"14px",
border:`1px solid ${border}`,
boxShadow:"0 8px 20px rgba(0,0,0,0.06)",
color:dark?"#f8fafc":"#111827"
}}>

<div style={{display:"flex",alignItems:"center",gap:"10px"}}>
<span style={{fontSize:"22px",color:color}}>
{node.icon}
</span>
<b>{node.name}</b>
</div>

<div style={{
fontSize:"32px",
fontWeight:"700",
color:color
}}>
{value?.toFixed ? value.toFixed(1) : "--"} {node.unit}
</div>

<div style={{
height:"8px",
background:"#e5e7eb",
borderRadius:"10px",
overflow:"hidden",
marginTop:"10px"
}}>
<div style={{
width:`${percent}%`,
height:"100%",
background:color
}}/>
</div>

</div>

);

}

/* ---------------- MOTOR CONTROL ---------------- */

function MotorControls(){

const [m1,setM1]=useState(false);
const [m2,setM2]=useState(false);

const sendMotor=(motor,state)=>{

fetch("https://green-house-backend.onrender.com/motor",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
motor,
state: state ? "ON":"OFF"
})
});

};

return(

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
gap:"20px"
}}>

{[
{label:"motor1",state:m1,set:setM1},
{label:"motor2",state:m2,set:setM2}
].map((motor,i)=>(

<div key={i} style={{
background:"white",
padding:"20px",
borderRadius:"12px",
boxShadow:"0 6px 15px rgba(0,0,0,0.08)",
textAlign:"center"
}}>

<div style={{fontSize:"24px",color:"#6366f1"}}>
<FaCog/>
</div>

<h3>{motor.label}</h3>

<button
onClick={()=>{

const newState=!motor.state;
motor.set(newState);
sendMotor(motor.label,newState);

}}
style={{
marginTop:"10px",
padding:"10px 20px",
border:"none",
borderRadius:"20px",
background:motor.state?"#22c55e":"#ef4444",
color:"white",
fontWeight:"bold",
cursor:"pointer"
}}
>
{motor.state?"ON":"OFF"}
</button>

</div>

))}

</div>

);

}

/* ---------------- MAIN APP ---------------- */

export default function App(){

const [dark,setDark]=useState(false);
const [sensorValues,setSensorValues]=useState({});
const [chartData,setChartData]=useState(initialChart);

/* chart updater */

const updateChart=(key,value)=>{

setChartData(prev=>{

const newData=[...prev];

newData.push({
time:newData.length+1,
...newData[newData.length-1],
[key]:value
});

if(newData.length>10) newData.shift();

return newData;

});

};

/* random sensor simulation */

useEffect(()=>{

function updateSensors(){

const data=generateSensorData();

setSensorValues(data);

updateChart("temp",data["greenhouse/air/temperature"]);
updateChart("hum",data["greenhouse/air/humidity"]);
updateChart("co2",data["greenhouse/air/co2"]);

}

updateSensors();

const interval=setInterval(updateSensors,3000);

return ()=>clearInterval(interval);

},[]);

const getValue=(topic)=>sensorValues[topic]||0;

const avgTemp=getValue("greenhouse/air/temperature");
const avgHum=getValue("greenhouse/air/humidity");
const avgCO2=getValue("greenhouse/air/co2");
const avgPower=getValue("greenhouse/power/power");

return(

<div style={{
minHeight:"100vh",
background: dark
? "linear-gradient(135deg,#0f172a,#1e293b)"
: "linear-gradient(135deg,#ecfdf5,#f8fafc)",
padding:"20px",
fontFamily:"Inter, sans-serif"
}}>

<div style={{maxWidth:"1400px",margin:"auto"}}>

<h1 style={{fontSize:"32px"}}>
🌱 Smart Greenhouse Dashboard
</h1>

{/* KPI */}

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
gap:"20px",
marginBottom:"40px"
}}>

<KPICard title="Temperature" value={avgTemp} unit="°C" dark={dark}/>
<KPICard title="Humidity" value={avgHum} unit="%" dark={dark}/>
<KPICard title="CO2" value={avgCO2} unit="ppm" dark={dark}/>
<KPICard title="Power" value={avgPower} unit="W" dark={dark}/>

</div>

{/* SENSOR SECTIONS */}

{sections.map((section,i)=>(

<div key={i} style={{marginBottom:"40px"}}>

<h2>{section.name}</h2>

{section.nodes && (

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:"20px"
}}>

{section.nodes.map((node,index)=>{

const topic=Object.keys(topicMap)
.find(t=>topicMap[t]===node.name);

const value=sensorValues[topic] ?? 0;

return(
<SensorCard
key={index}
node={node}
value={value}
dark={dark}
/>
);

})}

</div>

)}

{section.motors && <MotorControls/>}

</div>

))}

{/* CHARTS */}

<div style={{
marginTop:"50px",
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",
gap:"20px"
}}>

<Chart title="Temperature Trend" dataKey="temp" data={chartData} color="#ef4444" dark={dark}/>
<Chart title="Humidity Trend" dataKey="hum" data={chartData} color="#3b82f6" dark={dark}/>
<Chart title="CO2 Trend" dataKey="co2" data={chartData} color="#22c55e" dark={dark}/>

</div>

</div>

</div>

);

}

/* ---------------- KPI CARD ---------------- */

function KPICard({title,value,unit,dark}){

return(

<div style={{
background:dark?"#1e293b":"white",
padding:"20px",
borderRadius:"12px",
boxShadow:"0 6px 15px rgba(0,0,0,0.08)"
}}>

<div style={{opacity:.7}}>
{title}
</div>

<div style={{
fontSize:"26px",
fontWeight:"bold"
}}>
{value.toFixed ? value.toFixed(1) : value} {unit}
</div>

</div>

);

}

/* ---------------- CHART ---------------- */

function Chart({title,dataKey,data,color,dark}){

return(

<div style={{
background:dark?"#1e293b":"white",
padding:"20px",
borderRadius:"12px",
boxShadow:"0 6px 15px rgba(0,0,0,0.08)"
}}>

<h3 style={{marginBottom:"10px"}}>
{title}
</h3>

<ResponsiveContainer width="100%" height={250}>
<LineChart data={data}>
<CartesianGrid strokeDasharray="3 3"/>
<XAxis dataKey="time"/>
<YAxis/>
<Tooltip/>
<Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3}/>
</LineChart>
</ResponsiveContainer>

</div>

);

}