---
source: How To Get What You Want / KOBAKANT DIY
title: "Example Circuits and Code"
url: "https://www.kobakant.at/DIY/?p=6315"
postId: 6315
date: "2016-01-13T18:31:34"
modified: "2016-09-13T18:55:31"
slug: "example-circuits-and-code"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Example Circuits and Code

Source: https://www.kobakant.at/DIY/?p=6315

## Excerpt

A collection of simple example circuits that demonstrate the use of textile sensors and e-textile circuit techniques in combination with microcontroller programming.

## Content

A collection of simple example circuits that demonstrate the use of textile sensors and e-textile circuit techniques in combination with microcontroller programming.

Flickr set >>  https://www.flickr.com/photos/plusea/albums/72157670530066984

Beaded Tilt Sensor –> Sound Notes

Arduino code:

int petals[] = {

  6, 9, 10, 17, 18, 19

};

int speaker = 5;

void setup() {

  for (int i = 0; i < 6; i++) {
    pinMode(petals[i], INPUT_PULLUP);
  }
  pinMode(speaker, OUTPUT);
Serial.begin(9600);
}

void loop() {
  
  for (int i = 0; i < 6; i++) {
    if (digitalRead(petals[i]) == 0) {
      tone(speaker, (i+1) * 1000, 500);
      delay(500);
    }
    else digitalWrite(speaker, HIGH);
  }

}

PWM Fading –> LED Lights

Arduino code:

int led[9] = {

  5, 6, 9, 10, 11, 16, 17, 18, 19

}; // LED pins

void setup() {

  for (int i = 0; i < 9; i++) {
    pinMode(led[i], OUTPUT);
    digitalWrite(led[i], HIGH);
    delay(100);
    digitalWrite(led[i], LOW);
  }
}

void loop() {
  for (int i = 0; i < 5; i++) {
    for (int f = 0; f <= 254; f += 1) {
      analogWrite(led[i], f);
      delay(5);
    }
    for (int f = 254; f >= 0; f -= 1) {

      analogWrite(led[i], f);

      delay(5);

    }

  }

  for (int i = 5; i < 9; i++) {
    digitalWrite(led[i], HIGH);
    delay(600);
    digitalWrite(led[i], LOW);
    delay(600);
  }
}

Analog Knit Sensor –> Sound Noise

Arduino code:

void setup() {

  Serial.begin(9600);

  pinMode(A2, INPUT_PULLUP);

}

void loop() {

  int sensorReading = analogRead(A2);

  Serial.println(sensorReading);

  int noise = map(sensorReading, 400, 1000, 120, 1500);

  tone(6, noise, 10);

  delay(1);

}
