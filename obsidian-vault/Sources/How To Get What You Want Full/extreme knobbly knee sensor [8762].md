---
source: How To Get What You Want / KOBAKANT DIY
title: "extreme knobbly knee sensor"
url: "https://www.kobakant.at/DIY/?p=8762"
postId: 8762
date: "2021-03-09T22:46:31"
modified: "2021-03-24T18:19:12"
slug: "extreme-knobbly-knee-sensor"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# extreme knobbly knee sensor

Source: https://www.kobakant.at/DIY/?p=8762

## Excerpt

as you can see the knob of this knee is so extremely knobbly that is detaches from the knee almost completely. the result are unique sensing properties that include being able to tell which direction the knob is knobbling. based on the same construction as the interested sensor nr2 but connecting to different pins of […]

## Content

as you can see the knob of this knee is so extremely knobbly that is detaches from the knee almost completely. the result are unique sensing properties that include being able to tell which direction the knob is knobbling.

based on the same construction as the  interested sensor nr2 but connecting to different pins of the flora and reading with different code.

photos >>  https://www.flickr.com/photos/plusea/albums/72157718765032961

initial sketch of the idea:

code:

// knoblykneesensorcode

#define sensorPIN   A10

#define ioPINx1 6

#define ioPINx2 12

#define ioPINy1 2

#define ioPINy2 3

void setup() {

pinMode(sensorPIN, INPUT);

Serial.begin(9600);

}

void loop() {

//READ <—X—>

pinMode(ioPINx1, OUTPUT);

digitalWrite(ioPINx1, HIGH);

pinMode(ioPINx2, OUTPUT);

digitalWrite(ioPINx2, LOW);

pinMode(ioPINy1, INPUT_PULLUP);

pinMode(ioPINy2, INPUT_PULLUP);

delay(20);

int sensorData = analogRead(sensorPIN);

Serial.print(sensorData);

Serial.print(“\t”);

//READ <—Y—>

pinMode(ioPINy1, OUTPUT);

digitalWrite(ioPINy1, HIGH);

pinMode(ioPINy2, OUTPUT);

digitalWrite(ioPINy2, LOW);

pinMode(ioPINx1, INPUT_PULLUP);

pinMode(ioPINx2, INPUT_PULLUP);

delay(20);

sensorData = analogRead(sensorPIN);

Serial.print(sensorData);

Serial.print(“\t”);

Serial.print(0);

Serial.print(“\t”);

Serial.println(1023);

}
