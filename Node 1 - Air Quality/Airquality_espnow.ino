#include <WiFi.h>
#include <esp_now.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME680.h>

/* ================= OBJECTS ================= */
HardwareSerial co2Serial(2);
Adafruit_BME680 bme;

/* ================= RECEIVER MAC ================= */
/* Replace with your receiver MAC address */
uint8_t receiverMAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

/* ================= DATA STRUCT ================= */
typedef struct {
  int co2;
  float temperature;
  float humidity;
  float pressure;
  float gas;
} SensorData;

SensorData dataToSend;

/* ================= CO2 COMMAND ================= */
byte cmd[9] = {0xFF, 0x01, 0x86, 0, 0, 0, 0, 0, 0x79};
byte response[9];

/* ================= SEND CALLBACK ================= */
void onDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("Send Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Fail");
}

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);
  delay(2000);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW Init Failed");
    return;
  }

  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, receiverMAC, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  esp_now_add_peer(&peerInfo);

  co2Serial.begin(9600, SERIAL_8N1, 32, 33);
  Wire.begin(23, 22);

  if (!bme.begin()) {
    Serial.println("BME680 Not Found");
    while (1);
  }

  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150);
}

/* ================= LOOP ================= */
void loop() {

  /* ---------- READ CO2 ---------- */
  int co2 = 0;
  while (co2Serial.available()) co2Serial.read();

  co2Serial.write(cmd, 9);
  delay(100);

  if (co2Serial.available() >= 9) {
    co2Serial.readBytes(response, 9);
    if (response[0] == 0xFF && response[1] == 0x86) {
      co2 = (response[2] << 8) | response[3];
    }
  }

  /* ---------- READ BME680 ---------- */
  if (!bme.performReading()) {
    Serial.println("BME680 Reading Failed");
    return;
  }

  dataToSend.co2 = co2;
  dataToSend.temperature = bme.temperature;
  dataToSend.humidity = bme.humidity;
  dataToSend.pressure = bme.pressure / 100.0;
  dataToSend.gas = bme.gas_resistance / 1000.0;

  Serial.println("Sending sensor packet...");
  esp_now_send(receiverMAC, (uint8_t *)&dataToSend, sizeof(dataToSend));

  delay(5000);
}