#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>

#define RXD2 16
#define TXD2 17

// ---------- Modbus Request ----------
unsigned char byteRequest[8] = {
  0x01, 0x03, 0x00, 0x00,
  0x00, 0x07, 0x04, 0x08
};

unsigned char byteResponse[19] = {};

// ---------- ESP-NOW Data Structure ----------
typedef struct {
  float moisture;
  float temperature;
  int conductivity;
  float ph;
  int nitrogen;
  int phosphorus;
  int potassium;
} npk_data_t;

npk_data_t npkData;

// ---------- BROADCAST MAC ADDRESS ----------
uint8_t broadcastMAC[] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};

// ---------- ESP-NOW SEND CALLBACK ----------
void onDataSent(const wifi_tx_info_t *tx_info, esp_now_send_status_t status) {
  Serial.print("ESP-NOW Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(4800, SERIAL_8N1, RXD2, TXD2);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  Serial.print("ESP-NOW Sender MAC: ");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW Init Failed");
    return;
  }

  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastMAC, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add broadcast peer");
    return;
  }

  Serial.println("ESP-NOW Broadcast Sender Ready");
}

void loop() {
  readAndSendNPK();
  delay(5000);
}

void readAndSendNPK() {
  Serial2.write(byteRequest, sizeof(byteRequest));
  delay(1000);

  if (Serial2.available() >= sizeof(byteResponse)) {
    Serial2.readBytes(byteResponse, sizeof(byteResponse));

    npkData.moisture     = ((byteResponse[3]  << 8) | byteResponse[4])  / 10.0;
    npkData.temperature  = ((byteResponse[5]  << 8) | byteResponse[6])  / 10.0;
    npkData.conductivity =  (byteResponse[7]  << 8) | byteResponse[8];
    npkData.ph           = ((byteResponse[9]  << 8) | byteResponse[10]) / 10.0;
    npkData.nitrogen     =  (byteResponse[11] << 8) | byteResponse[12];
    npkData.phosphorus   =  (byteResponse[13] << 8) | byteResponse[14];
    npkData.potassium    =  (byteResponse[15] << 8) | byteResponse[16];

    esp_now_send(broadcastMAC, (uint8_t *)&npkData, sizeof(npkData));

    Serial.println("ESP-NOW Broadcast Sent");
    Serial.printf(
      "M: %.1f T: %.1f pH: %.1f EC:%d N:%d P:%d K:%d\n\n",
      npkData.moisture,
      npkData.temperature,
      npkData.ph,
      npkData.conductivity,
      npkData.nitrogen,
      npkData.phosphorus,
      npkData.potassium
    );

  } else {
    Serial.println("No response from NPK sensor");
  }
}