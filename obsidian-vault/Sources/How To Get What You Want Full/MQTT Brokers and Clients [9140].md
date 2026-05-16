---
source: How To Get What You Want / KOBAKANT DIY
title: "MQTT Brokers and Clients"
url: "https://www.kobakant.at/DIY/?p=9140"
postId: 9140
date: "2021-09-30T10:54:47"
modified: "2021-11-15T07:51:33"
slug: "mosquitto-local-mqtt-broker"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# MQTT Brokers and Clients

Source: https://www.kobakant.at/DIY/?p=9140

## Excerpt

These are out notes from working with various MQTT Broker options, which we have used mostly to publish sensor data wirelessly from a Client running on an ESP32 Dev Module (programmed with Arduio) and then subscribe to this data from various other Clients: – another ESP32 dev module – a Processing sketch on a computer […]

## Content

These are out notes from working with various MQTT Broker options, which we have used mostly to publish sensor data wirelessly from a Client running on an ESP32 Dev Module (programmed with Arduio) and then subscribe to this data from various other Clients:

– another ESP32 dev module

– a Processing sketch on a computer

– a Pure Data patch on a computer

In general these are the different Broker options you have:

– a public online Broker hosted by somebody else (for example: Shiftr “try” namespace, Mosquitto’s “test” server)

– an online service (free or paid) that allows you to host your own Broker (for example: Shiftr)

– a local Broker that you run on your own computer or a designated computer (like a Rasberry Pi) (for example: Shiftr Desktop App, Mosquitto)

These are the different Broker options we tired out:

1) SHIFTR BROKER

1.1) SHIFTR online public “try” namespace (or own namespace)

1.2) SHIFTR Desktop App (free download)

2) MOSQUITTO BROKER

2.1) test server at test.mosquitto.org

2.2) Local Mosquitto MQTT broker on Mac computer

2.3) Local Mosquitto MQTT broker on Rasberry Pi

MQTT?

Here are two illustrations depicting how MQTT works:

1) SHIFTR

1.1) SHIFTR ONLINE

BROKER: SHIFTR ONLINE

Shiftr has an public online namespace called “try” where you can quickly and easyily start publishing and subscribing data:  https://www.shiftr.io/try

When you connect to this space with a Client, You should be able to see yourself pop up as your Client ID name (tip: pick a unique name to see yourself!). When you publish or subscribe data from the Broker you should see black balls flying from you to the center to the topic you are publishing to, or the other way around when you subscribe.

The visualization is interactive, you can click on nodes and pull them around to arrange the space.

There is a lot going on here. If you want to use Shiftr for a project, you can create your own account for free and can have your own private or public namespaces.

Shiftr has libraries for various platforms including Arduino and Processing.

CLIENT: ARDUINO

To code an Arduino Client we use Shiftr’s MQTT library for Arduino. There are other MQTT libraries for Arduino that would also work.

Install the Shiftr.io Arduino MQTT library:

Sketch –> Include Library –> Manage Libraries –> search: “MQTT”

the scroll down until you see “MQTT by Joel Gaehwiller”

Open the example:

File –> Examples –> MQTT –> “ESP32DevelopmentBoard”

In the example code, enter your Wifi connection information:

const char ssid[] = “yourNetworkName”;

const char pass[] = “yourNetworkPassword”;

The client.connect function takes the following information:

client.connect(“client ID”, “name of your instance”, “token secret”)

It connects you to the online Shiftr Broker’s public namespace called “try”:

void connect() {

while (!client.connect(“arduino”, “try”, “try”)) { ….. }

}

The client.begin function takes the Broker’s URL or IP:

client.begin(“URL or IP”, net);

void setup() {

client.begin(“broker.shiftr.io”, net);

…. }

CLIENT: PROCESSING

To code a Proccessing Client we use Shiftr’s MQTT library for Processing.

Install Library:

Sketch –> Import Library –> Add Library –> filter: “MQTT”

install: “MQTT library for Processing based on the Eclipse Paho project by Joel Gaehwiller”

Open Example:

File –> Examples –> MQTT –> “PublishSubscribe”

The following line of code connects you to the online Shiftr Broker’s public namespace called “try” with the Client ID “processing”.

client.connect(“mqtt://public:public@public.cloud.shiftr.io”, “processing”);

Notes:

Make sure the URL in your code is the same as the current URL shown on the public namespace website: “mqtt://public:public@public.cloud.shiftr.io”

If you are using your own namespace, make sure you edit the URL to include name_of_your_instance

token_secret

url_of_your_instance

“mqtt://name_of_your_instance:token_secret@url_of_your_instance.cloud.shiftr.io”

1.2) SHIFTR Desktop App

BROKER: SHIFTR DESKTOP APP

You should be able to see your connections and data in the app, just like in the online visualization. Running this App means your computer is hosting a localhost MQTT broker. How cool is this! If you only need to send data locally, then you don’t need to send it over the internet! All the devices publishing and subscribing just need to be in the same network (for example: connected to the same wifi network).

Download App for free:  https://www.shiftr.io/desktop

To connect to this Broker, you need to find out the IP address of the computer running the App.

On a Mac:

network settings –> Advanced –> TCP/IP –> IPv4 Address: 192.168.0.9 (for example)

CLIENT: ARDUINO

Download the Shiftr MQTT library (see above).

Open the Shiftr MQTT example (see above).

The following items in the code need to be changed.

Leave the “name of your instance” and the “token secret” blank:

void connect() {

//client.connect(“client ID”, “name of your instance”, “token secret”)

while (!client.connect(“arduino”, “”, “”)) { ….. }

}

Insert your IP address instead of the Shiftr URL:

void setup() {

client.begin(“192.168.0.9”, net);

…. }

CLIENT: PROCESSING

Download the Shiftr MQTT library (see above).

Open the Shiftr MQTT example (see above).

Insert your IP address instead of the Shiftr URL:

client.connect(“mqtt://192.168.0.9”, “processing”);

2) MOSQUITTO

2.1) MOSQUITTO Test Server

test.mosquitto.org

2.2) MOSQUITTO Local on Mac computer

>>  https://subscription.packtpub.com/book/application-development/9781787287815/1/ch01lvl1sec12/installing-a-mosquitto-broker-on-macos

open terminal

Install mosquitto: brew install mosquitto

CHANGE SOME SETTINGS

before running mosquitto we need to change some settings in the mosquitto config file so that it does not require ID and password:

Open the config file via terminal: pico /usr/local/etc/mosquitto/mosquitto.conf

in the config file search (ctrl-w) for “allow_anonymous”

should get you to this line: #allow_anonymous false

remove the “#” and change it to be: allow_anonymous true

add this line above: listener 1883

so that you have:

listener 1883

allow_anonymous true

close pico editor: ctrl + x

save: yes

RUN MOSQUITTO

to open/start mosquitto you can use the following lines in the terminal (the file paths will be different for you!): /usr/local/sbin/mosquitto -c /usr/local/etc/mosquitto/mosquitto.conf

to stop mosquitto: ctrl + c

ERROR: address already in use

if you get this error when trying to start mosquitto you can force quit mosquitto from the activity monitor.

try again and hopefully you see this:

publishing data with ESP32

CONNECTING

to connect to the broker you need to know your computer’s IP address, which is also your broker’s IP address as it is running on your computer. you find it in the network advanced settings:

ARDUINO CODE

/*

SimpleMQTTClient.ino

The purpose of this exemple is to illustrate a simple handling of MQTT and Wifi connection.

*/

#include “EspMQTTClient.h”

#define MYSSID “wifi_name”

#define MYPASS “wifi_password”

#define BROKER_IP “192.168.0.2”

#define MQTT_USERNAME “” // username, can be omitted if not needed

#define MQTT_PASS “” // password, can be omitted if not needed

#define CLIENT_NAME  “esp_group0_person1” // this name NEEDS TO BE UNIQUE for each device connecting to the broker!

EspMQTTClient client( MYSSID, MYPASS, BROKER_IP, MQTT_USERNAME, MQTT_PASS, CLIENT_NAME, 1883 );

#define totalLegs 6

int analogLegs[] = {36, 39, 34, 35, 32, 33};

int vals[totalLegs];

int avgs[totalLegs];

int samplesize = 5;

unsigned long lastMillis = 0;

String myTopic = “/group0/person1/”;

bool connected = false;

String str;

void setup()

{

Serial.begin(115200);

// Optionnal functionnalities of EspMQTTClient :

// client.enableDebuggingMessages(); // Enable debugging messages sent to serial output

// client.enableHTTPWebUpdater(); // Enable the web updater. User and password default to values of MQTTUsername and MQTTPassword. These can be overrited with enableHTTPWebUpdater(“user”, “password”).

client.enableLastWillMessage(“TestClient/lastwill”, “I am going offline”);  // You can activate the retain flag by setting the third parameter to true

}

// This function is called once everything is connected (Wifi and MQTT)

// WARNING : YOU MUST IMPLEMENT IT IF YOU USE EspMQTTClient

void onConnectionEstablished()

{

connected = true;

// Publish a message to “mytopic/test”

//client.publish(myTopic, “This is a message”); // You can activate the retain flag by setting the third parameter to true

}

void loop()

{

// this loop is a routine for the MQTT, do not add delay in main loop

client.loop();

//publish a message roughly every x miliseconds.

if (millis() – lastMillis > 50) {

lastMillis = millis();

for (int i = 0; i < totalLegs; i++) {

// read analog pins

vals[i] = analogRead(analogLegs[i]);

// take avarage of the sample size

avgs[i] = (avgs[i] * (samplesize – 1) + vals[i]) / samplesize;

str = str + ” ” + String(avgs[i]);

}

// after you cycle through all the pins, publish the readings as list to the MQTT

client.publish(myTopic, str);

str = “”;

//// communicate from the serial

Serial.print(vals[0]);

Serial.print(” “);

Serial.print(vals[1]);

Serial.print(” “);

Serial.print(vals[2]);

Serial.print(” “);

Serial.print(vals[3]);

Serial.print(” “);

Serial.print(vals[4]);

Serial.print(” “);

Serial.println(vals[5]);

}

}

subscribing with Pure Data

PURE DATA PATCH

subscribing with Processing

PROCESSING CODE

2.3) MOSQUITTO Local on Rasberry Pi
