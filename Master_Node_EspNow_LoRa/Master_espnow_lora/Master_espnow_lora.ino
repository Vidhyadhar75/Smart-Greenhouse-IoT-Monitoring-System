#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

/* ================= WIFI ================= */

const char* ssid = "KLEF";
const char* password = "";

/* ================= MQTT ================= */

const char* mqtt_server = "10.32.2.65";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

/* ================= ESPNOW STRUCTS ================= */

typedef struct {
  int   co2;
  float temperature;
  float humidity;
  float pressure;
  float gas;
} SensorData;

typedef struct {
  float moisture;
  float temperature;
  int conductivity;
  float ph;
  int nitrogen;
  int phosphorus;
  int potassium;
} npk_data_t;

typedef struct {
  int soilValue;
} Soil;

typedef struct {
  float voltage;
  float current_mA;
  float power_mW;
} ina219_data_t;

typedef struct {
  uint8_t motor1;
  uint8_t motor2;
} motor_cmd_t;

/* ================= MOTOR ESP MAC ================= */

uint8_t MOTOR_ESP_MAC[] = {0x4C,0x11,0xAE,0x65,0x71,0x84};

/* ================= QUEUE ================= */

typedef enum {
  PKT_BME = 1,
  PKT_NPK = 2,
  PKT_SOIL = 3,
  PKT_INA = 4
} pkt_type_t;

typedef struct {
  pkt_type_t type;
  uint8_t mac[6];
  union {
    SensorData bme;
    npk_data_t npk;
    Soil soil;
    ina219_data_t ina;
  } data;
} mqtt_item_t;

QueueHandle_t mqttQueue;

/* ================= ESPNOW RX ================= */

void onDataRecv(const esp_now_recv_info_t *info,
                const uint8_t *data,
                int len) {

  mqtt_item_t item;
  memcpy(item.mac, info->src_addr, 6);

  if (len == sizeof(SensorData)) {
    item.type = PKT_BME;
    memcpy(&item.data.bme, data, sizeof(SensorData));
  }
  else if (len == sizeof(npk_data_t)) {
    item.type = PKT_NPK;
    memcpy(&item.data.npk, data, sizeof(npk_data_t));
  }
  else if (len == sizeof(Soil)) {
    item.type = PKT_SOIL;
    memcpy(&item.data.soil, data, sizeof(Soil));
  }
  else if (len == sizeof(ina219_data_t)) {
    item.type = PKT_INA;
    memcpy(&item.data.ina, data, sizeof(ina219_data_t));
  }
  else {
    return;
  }

  xQueueSend(mqttQueue, &item, 0);
}

/* ================= MQTT COMMAND CALLBACK ================= */

void mqttCallback(char* topic, byte* payload, unsigned int length) {

  String msg;

  for (int i = 0; i < length; i++)
    msg += (char)payload[i];

  Serial.print("MQTT CMD: ");
  Serial.println(msg);

  motor_cmd_t cmd;

  if (msg == "M1=1") cmd.motor1 = 1;
  else if (msg == "M1=0") cmd.motor1 = 0;
  else if (msg == "M2=1") cmd.motor2 = 1;
  else if (msg == "M2=0") cmd.motor2 = 0;
  else return;

  esp_now_send(MOTOR_ESP_MAC,(uint8_t*)&cmd,sizeof(cmd));
}

/* ================= WIFI CONNECT ================= */

void connectWiFi() {

  WiFi.begin(ssid,password);

  while(WiFi.status()!=WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
}

/* ================= MQTT CONNECT ================= */

void connectMQTT() {

  while (!mqttClient.connected()) {

    Serial.print("Connecting MQTT...");

    if (mqttClient.connect("ESP32_Gateway")) {

      Serial.println("connected");

      mqttClient.subscribe("farm/motor/cmd");

    } else {

      Serial.print("failed rc=");
      Serial.println(mqttClient.state());

      delay(2000);
    }
  }
}

/* ================= MQTT TX TASK ================= */

void mqttPublishTask(void *pv) {

  mqtt_item_t item;

  for (;;) {

    if (xQueueReceive(mqttQueue,&item,portMAX_DELAY)==pdTRUE) {

      String topic;
      String json="{";

      if(item.type==PKT_BME){

        topic="farm/sensor/bme";

        json+="\"co2\":"+String(item.data.bme.co2);
        json+=",\"temp\":"+String(item.data.bme.temperature,1);
        json+=",\"hum\":"+String(item.data.bme.humidity,1);
        json+=",\"press\":"+String(item.data.bme.pressure);
        json+=",\"gas\":"+String(item.data.bme.gas,1);
      }

      else if(item.type==PKT_NPK){

        topic="farm/sensor/npk";

        json+="\"moist\":"+String(item.data.npk.moisture);
        json+=",\"temp\":"+String(item.data.npk.temperature);
        json+=",\"ph\":"+String(item.data.npk.ph);
        json+=",\"ec\":"+String(item.data.npk.conductivity);
        json+=",\"n\":"+String(item.data.npk.nitrogen);
        json+=",\"p\":"+String(item.data.npk.phosphorus);
        json+=",\"k\":"+String(item.data.npk.potassium);
      }

      else if(item.type==PKT_SOIL){

        topic="farm/sensor/soil";

        json+="\"soil\":"+String(item.data.soil.soilValue);
      }

      else if(item.type==PKT_INA){

        topic="farm/power";

        json+="\"voltage\":"+String(item.data.ina.voltage);
        json+=",\"current\":"+String(item.data.ina.current_mA);
        json+=",\"power\":"+String(item.data.ina.power_mW);
      }

      json+="}";

      mqttClient.publish(topic.c_str(),json.c_str());

      Serial.println("MQTT PUB: "+json);
    }
  }
}

/* ================= SETUP ================= */

void setup(){

  Serial.begin(115200);

  connectWiFi();

  mqttClient.setServer(mqtt_server,mqtt_port);
  mqttClient.setCallback(mqttCallback);

  connectMQTT();

  WiFi.mode(WIFI_STA);

  if(esp_now_init()!=ESP_OK){
    Serial.println("ESP NOW INIT FAILED");
    return;
  }

  esp_now_register_recv_cb(onDataRecv);

  esp_now_peer_info_t peer={};

  memcpy(peer.peer_addr,MOTOR_ESP_MAC,6);
  peer.channel=0;
  peer.encrypt=false;

  esp_now_add_peer(&peer);

  mqttQueue = xQueueCreate(20,sizeof(mqtt_item_t));

  xTaskCreatePinnedToCore(mqttPublishTask,"mqttTX",6000,NULL,1,NULL,1);

  Serial.println("Gateway Ready");
}

/* ================= LOOP ================= */

void loop(){

  if(!mqttClient.connected())
    connectMQTT();

  mqttClient.loop();
}