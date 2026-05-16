---
source: How To Get What You Want / KOBAKANT DIY
title: "Musical Pillow"
url: "https://www.kobakant.at/DIY/?p=3540"
postId: 3540
date: "2012-06-15T20:40:00"
modified: "2012-06-18T10:13:27"
slug: "musical-pillow"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Musical Pillow

Source: https://www.kobakant.at/DIY/?p=3540

## Excerpt

An example using the LilyPad Arduino sewn to a pillow with a speaker and fabric tilt sensor, playing a different note for each petal of the sensor. The pillow also has an analog pin broken out to one of it’s corners to be connected to any external analog sensors to make noise.

## Content

An example using the LilyPad Arduino sewn to a pillow with a speaker and fabric tilt sensor, playing a different note for each petal of the sensor. The pillow also has an analog pin broken out to one of it’s corners to be connected to any external analog sensors to make noise.

Video:

Making-of

Materials and tools:

Sketch out your circuit connections:

Thread needle:

Cut out a piece of felt to mount behind LilyPad for improved electrical contact when sewing with conductive thread to circuit baord holes:

Tie knots at the ends of your thread and keep ends short. Use nail varnish on ends to stop fraying.

Trace shapes on conductive fabric with fusible interfacing and cut out:

Fuse to pillow fabric with an iron:

Or sew the patches down if your fusible doesn’t hold:-)

Finished back:

Finished front:

Close-ups:

Program the LilyPad Arduino:

Arduino Code:

#include “pitches.h”

// declare array of input pins connected to tilt sensor petals:

int tiltPetals[] = {

  5,6,11,16,18,19};

// declare pin variables:

int analogCorner = 3;

int GNDcorner = 10;

int speakerPin = 9;

// declare storage variables:

int tiltValue;

int cornerValue;

// declare array of notes associated with each tilt petal:

int notes[] = {

  NOTE_A1, NOTE_B2, NOTE_C3, NOTE_D4, NOTE_E5, NOTE_F6};

void setup() {

  // declare tilt sensor petals pins as digital inputs:

  for(int i = 0; i<6; i++){
    pinMode(tiltPetals[i], INPUT);
    digitalWrite(tiltPetals[i], HIGH); // set internal pull-up resistors
  }

  // declare analog corner pin as analog input
  pinMode(analogCorner, INPUT);
  digitalWrite(17, HIGH); // set internal pull-up resistor (analog pin 3 = digital pin 17)

  // declare other corner as output and set to be GND:
  pinMode(GNDcorner, OUTPUT);
  digitalWrite(GNDcorner, LOW);

  // declare speaker pin as output:
  pinMode(speakerPin, OUTPUT);

  Serial.begin(9600); // begin serial communication for debugging
}

void loop() {
  for(int i = 0; i<6; i++){
    tiltValue = digitalRead(tiltPetals[i]);
    Serial.print(tiltValue); // print value to serial monitor for debugging

    if(tiltValue == 0) {
      tone(speakerPin, notes[i], 1000);
    }
  }
  Serial.println(); // print a linebreak after each for loop

  cornerValue = analogRead(analogCorner);
  if(cornerValue < 1000) {
    tone(speakerPin, cornerValue, 250);
  }
  //Serial.println(cornerValue); // print analog value for debugging

  delay(10);
}
