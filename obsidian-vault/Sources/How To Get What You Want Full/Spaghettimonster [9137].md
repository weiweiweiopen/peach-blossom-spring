---
source: How To Get What You Want / KOBAKANT DIY
title: "Spaghettimonster"
url: "https://www.kobakant.at/DIY/?p=9137"
postId: 9137
date: "2021-09-25T23:13:59"
modified: "2022-12-14T15:19:54"
slug: "esp-aux-breakout"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Spaghettimonster

Source: https://www.kobakant.at/DIY/?p=9137

## Excerpt

the spaghetti monster is basically the idea to use 3.5mm audio sockets and cables to make 2/3/4-way connections between the gpio pins of a microcontroller board and textile/wearable sensors & actuators mounted around the body. specifically a first instance of this idea was designed to breakout 6 analog pins of an ESP32 Devboard to connect […]

## Content

the spaghetti monster is basically the idea to use 3.5mm audio sockets and cables to make 2/3/4-way connections between the gpio pins of a microcontroller board and textile/wearable sensors & actuators mounted around the body.

specifically a first instance of this idea was designed to breakout 6 analog pins of an ESP32 Devboard to connect to textile sensors. in this first design we mounted potis on the ESP breakoutboard so that the mini aux breakoouts mounted on the sensor side are mono (2-way). but because audio cables have 3 connections it would also lend itself to mounting the pull-up/voltage dividing poti on the sensor side.

photos >>  https://www.flickr.com/photos/plusea/albums/72157719958295195

Spaghetti Monster:

Spaghetti Babies:

Bill of Materials (BOM)

3.5mm Aux Jacks:

 https://www.segor.de/#Q=KLBU3%252C5ST%252FMini1&M=1

 https://www.reichelt.de/at/en/jack-panel-socket-3-5-mm-stereo-angled-pcb-lum-1503-07-p116184.html

PT 6-L 250K Setting potentiometer, horizontal, 6mm, 250 K-Ohm:

we used 250K Ohm for our textile sensors, but you could also select a different value depending on the range of your sensors.

 https://www.segor.de/#Q=PT6KV-250k&M=1

 https://www.reichelt.de/at/en/setting-potentiometer-horizontal-6mm-100-k-ohm-pt-6-l-100k-p14981.html

poti knobs PRK 6ws:

 https://www.segor.de/#Q=PRK6ws-10x&M=1

3.5 mm Male to Male Audio Jack Cable (mono or stereo)

spiral cables can be nice!

search online for “patching cables”

Older version:

DIY spaghetti monster:

DIY spaghetti babies:

WORKING WITH SPAGHETTI MONSTER

LINKS

This page >>  https://www.kobakant.at/DIY/?p=9137

OSC and MQTT code examples >>  http://hyperdramatik.net/mediawiki/index.php?title=Hauptseite#Kommunikation_.2F_Netzwerkommunikation

Julian’s code examples (arduino midi, osc and vvvv) >>  https://github.com/clockdiv/Spaghettimonster

ESP32-38-PIN-DEVBOARD

>>  https://www.studiopieters.nl/esp32-pinout/

!!! ATTENTION: the pin labeld GND on the lower left side of the board (above 5V) is actually CMD – this is a terrible mistake!

PROGRAMMING ESP with ARDUINO IDE

1

Menu: Preferences —> Additional Boards Manager URLs:

 https://dl.espressif.com/dl/package_esp32_index.json

2

Menu: Tools —> Boards —> Boards Manager:

search for: “ESP32”

Install: “esp32 by Espressif Systems”

3

Menu: Tools —> Board: ESP32 Dev Module

Menu: Tools —> Port: dev/cu…

(unplug and plug to see which port appears)

Menu: Tools —> Flash Mode: QIO

Menu: Tools —> Flash Size: 4MB

Menu: Tools —> Flash Frequency: 80Mhz

Menu: Tools —> Upload Speed: 115200

UPLOAD Arduino CODE to ESP

1 OPEN EXAMPLE

Menu: File —> Examples —> Basics —> “Blink”

edit: LED_PIN = 2;

2 UPLOAD

—> connect an LED between GPIO pin 2 and GND (!make sure it is ground and not CMD!)

the LED should blink on and off

READING an ANALOG SENSOR VALUE with ESP

1 OPEN EXAMPLE

Menu: File —> Examples —> Communication —> “Graph”

edit: Serial.begin(115200);

edit: pick a GPIO pin with and ADC

(GPIO = General Purpose In Out)

(ADC = Analog Digital Converter)

for example: analogRead(34);

2 UPLOAD

// Note: ADC2 pins cannot be used when Wi-Fi is used. So, if you’re using Wi-Fi and you’re having trouble getting the value from an ADC2 GPIO, you may consider using an ADC1 GPIO instead, that should solve your problem.

READING multiple ANALOG SENSOR VALUES with ESP

1 OPEN EXAMPLE

Code example: Spaghettimonster_Serial

// sends all 6 analog inputs over serial

int numOfSensors = 6;

byte analogPins[] = {

36, 39, 34, 35, 32, 33

};

void setup() {

for (int i = 0; i < numOfSensors; i++) {

pinMode(analogPins[i], INPUT);

}

Serial.begin(115200);

}

void loop() {

for (int i = 0; i < numOfSensors; i++) {

Serial.print(analogRead(analogPins[i]));

Serial.print(“\t”);

}

//print the following min and max sensor values

//for graphing using the arduino plotter

//because otherwise auto-adjust makes it hard to see

Serial.print(0);

Serial.print(“\t”);

Serial.print(4095);

Serial.println();

delay(20);  //a little bit of delay

}

2 UPLOAD

3 OPEN SERIAL MONITOR

you should see 6 analog sensor value printed in one line, plus the two values: “0” = min and “4095” = max

SENDING DATA from ESP to COMPUTER with OSC

1 INSTALL OSCuino LIBRARY

Download OSCuino library from github:  https://github.com/CNMAT/OSC

Code –> Download ZIP

Arduino Menu: Sketch –> Include Library –> Add .ZIP Library

select .ZIP file

2 OPEN CODE EXAMPLE

Open code example: Spaghettimonster_OSC (https://github.com/clockdiv/Spaghettimonster/tree/main/Spaghettimonster_OSC)

//sends all 6 analog inputs as osc messages as well as over serial

4 UPLOAD SKETCH

Tip: sometimes you need to press and hold the BOOT button on the ESP for 2 seconds while Arduino IDE is trying to program.

“Hard resetting via RTS pin…” = upload was successful

Making-of:
