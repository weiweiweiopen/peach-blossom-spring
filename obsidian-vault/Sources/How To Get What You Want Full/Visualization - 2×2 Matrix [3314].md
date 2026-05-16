---
source: How To Get What You Want / KOBAKANT DIY
title: "Visualization: 2×2 Matrix"
url: "https://www.kobakant.at/DIY/?p=3314"
postId: 3314
date: "2009-06-14T16:21:26"
modified: "2021-02-18T11:49:38"
slug: "visualization-2x2-matrix"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Visualization: 2×2 Matrix

Source: https://www.kobakant.at/DIY/?p=3314

## Excerpt

This code is great for visualizing pressure sensor matrices using a grid of squares that are filled with gray-scale values from 0-255, corresponding to the pressure sensor value.

## Content

This code is great for visualizing pressure sensor matrices using a grid of squares that are filled with gray-scale values from 0-255, corresponding to the pressure sensor value.

ARDUINO CODE :::

/*

2×2 presure sensor matrix code,

where each row/column is connected to an individual analog pin

>> github plusea

*/

int rowPin1 = A2;

int rowPin2 = A3;

int colPin1 = 10;

int colPin2 = 11;

int sensorValues[] = {

0,0,0,0};

void setup() {

pinMode(rowPin1, INPUT);

pinMode(rowPin2, INPUT);

digitalWrite(16, HIGH);

digitalWrite(17, HIGH);

pinMode(colPin1, OUTPUT);

pinMode(colPin2, OUTPUT);

Serial.begin(9600);

}

void loop() {

digitalWrite(colPin1, HIGH);

digitalWrite(colPin2, LOW);

sensorValues[0] = analogRead(rowPin1);

sensorValues[1] = analogRead(rowPin2);

delay(10);

digitalWrite(colPin1, LOW);

digitalWrite(colPin2, HIGH);

sensorValues[2] = analogRead(rowPin1);

sensorValues[3] = analogRead(rowPin2);

delay(10);

Serial.print(sensorValues[0]);

Serial.print(‘,’);

Serial.print(sensorValues[1]);

Serial.print(‘,’);

Serial.print(sensorValues[2]);

Serial.print(‘,’);

Serial.print(sensorValues[3]);

Serial.println();

}

PROCESSING CODE :::

/*

Code based on Tom Igoe’s Serial Graphing Sketch

>>  http://wiki.processing.org/w/Tom_Igoe_Interview

Reads 4 analog inputs and visualizes them by drawing a 2×2 grid,

using grayscale shading of each square to represent sensor value.

>>  http://www.kobakant.at/DIY/?cat=347

*/

import processing.serial.*;

Serial myPort;  // The serial port

int maxNumberOfSensors = 4;

float[] sensorValue = new float[maxNumberOfSensors];  // global variable for storing mapped sensor values

float[] previousValue = new float[maxNumberOfSensors];  // array of previous values

int rectSize = 200;

void setup () {

size(600, 600);  // set up the window to whatever size you want

println(Serial.list());  // List all the available serial ports

String portName = Serial.list()[0];

myPort = new Serial(this, portName, 9600);

myPort.clear();

myPort.bufferUntil(‘\n’);  // don’t generate a serialEvent() until you get a newline (\n) byte

background(255);    // set inital background

smooth();  // turn on antialiasing

rectMode(CORNER);

}

void draw () {

fill(sensorValue[0]);

rect(width/2-rectSize, height/2-rectSize, rectSize,rectSize);  //top left

fill(sensorValue[0]);

rect(width/2, height/2-rectSize, rectSize,rectSize);  //top right

fill(sensorValue[0]);

rect(width/2-rectSize, height/2, rectSize,rectSize);  //bottom left

fill(sensorValue[0]);

rect(width/2, height/2, rectSize,rectSize);  //bottom right

}

void serialEvent (Serial myPort) {

String inString = myPort.readStringUntil(‘\n’);  // get the ASCII string

if (inString != null) {  // if it’s not empty

inString = trim(inString);  // trim off any whitespace

int incomingValues[] = int(split(inString, “,”));  // convert to an array of ints

if (incomingValues.length <= maxNumberOfSensors && incomingValues.length > 0) {

for (int i = 0; i < incomingValues.length; i++) {

        // map the incoming values (0 to  1023) to an appropriate gray-scale range (0-255):

        sensorValue[i] = map(incomingValues[i], 0, 1023, 0, 255);

      }

    }

  }

}

Video:
