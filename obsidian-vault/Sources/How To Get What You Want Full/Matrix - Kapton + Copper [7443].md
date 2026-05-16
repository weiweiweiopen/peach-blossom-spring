---
source: How To Get What You Want / KOBAKANT DIY
title: "Matrix: Kapton + Copper"
url: "https://www.kobakant.at/DIY/?p=7443"
postId: 7443
date: "2018-12-15T19:40:50"
modified: "2018-12-15T20:38:06"
slug: "matrix-kapton-copper"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Matrix: Kapton + Copper

Source: https://www.kobakant.at/DIY/?p=7443

## Excerpt

A simple pressure sensor matrix made from two Kapton film sheets with 7×7 copper tape traces and a piece of Velostat or Eeonyx piezoresistive material in between.

## Content

A simple pressure sensor matrix made from two Kapton film sheets with 7×7 copper tape traces and a piece of Velostat or Eeonyx piezoresistive material in between.

Flickr set >>  https://www.flickr.com/photos/plusea/albums/72157704662279354

 

MAKING OF:

 

 

 

 

 

 

 

 

 

 

 

CIRCUIT & CODE:

Teensy LC pinout:

ARDUINO CODE:

/*

  Matrix: Kapton + Copper

  A simple pressure sensor matrix made from two Kapton film sheets with

  7×7 copper tape traces and a piece of Velostat or Eeonyx piezoresistive

  material in between.

  parsing through this grid by switching individual rows/columns to be

  HIGH, LOW or INPUT (high impedance) to detect location and pressure.

  >>  http://howtogetwhatyouwant.at/

*/

#define numRows 7

#define numCols 7

#define sensorPoints numRows*numCols

int rows[] = {A0, A1, A2, A3, A4, A5, A6};

int cols[] = {11,10,9,8,7,6,5};

int incomingValues[sensorPoints] = {};

void setup() {

  // set all rows and columns to INPUT (high impedance):

  for (int i = 0; i < numRows; i++) {
    pinMode(rows[i], INPUT_PULLUP);
  }
  for (int i = 0; i < numCols; i++) {
    pinMode(cols[i], INPUT);
  }
  Serial.begin(9600);
}

void loop() {
  for (int colCount = 0; colCount < numCols; colCount++) {
    pinMode(cols[colCount], OUTPUT);  // set as OUTPUT
    digitalWrite(cols[colCount], LOW);  // set LOW

    for (int rowCount = 0; rowCount < numRows; rowCount++) {
      incomingValues[colCount * numRows + rowCount] = analogRead(rows[rowCount]);  // read INPUT
    }// end rowCount

    pinMode(cols[colCount], INPUT);  // set back to INPUT!

  }// end colCount

  // Print the incoming values of the grid:
  for (int i = 0; i < sensorPoints; i++) {
    Serial.print(incomingValues[i]);
    if (i < sensorPoints - 1) Serial.print("\t");
  }
  Serial.println();
  delay(10);
}

PROCESSING CODE:

/*

 Code based on Tom Igoe’s Serial Graphing Sketch

 >>  http://wiki.processing.org/w/Tom_Igoe_Interview

 Reads X analog inputs and visualizes them by drawing a grid

 using grayscale shading of each square to represent sensor value.

 >>

 */

import processing.serial.*;

Serial myPort;  // The serial port

int maxNumberOfSensors = 49;

float[] sensorValue = new float[maxNumberOfSensors];  // global variable for storing mapped sensor values

float[] previousValue = new float[maxNumberOfSensors];  // array of previous values

int rectSize = 0;

int rectY;

void setup () {

  size(600, 600);  // set up the window to whatever size you want

  rectSize = width/7;

  println(Serial.list());  // List all the available serial ports

  String portName = Serial.list()[2];

  myPort = new Serial(this, portName, 9600);

  myPort.clear();

  myPort.bufferUntil(‘\n’);  // don’t generate a serialEvent() until you get a newline (\n) byte

  background(255);    // set inital background

  smooth();  // turn on antialiasing

  rectMode(CORNER);

}

void draw () {

  for (int i = 0; i < maxNumberOfSensors; i++) {
    fill(sensorValue[i]);
    rect(rectSize * (i%7), rectY, rectSize, rectSize);  //top left
    if((i+1) % 7 == 0) rectY += rectSize;
    println(rectY);
  }
  rectY=0;
}

void serialEvent (Serial myPort) {
  String inString = myPort.readStringUntil('\n');  // get the ASCII string

  if (inString != null) {  // if it's not empty
    inString = trim(inString);  // trim off any whitespace
    int incomingValues[] = int(split(inString, "\t"));  // convert to an array of ints

    if (incomingValues.length <= maxNumberOfSensors && incomingValues.length > 0) {

      for (int i = 0; i < incomingValues.length; i++) {
        // map the incoming values (0 to  1023) to an appropriate gray-scale range (0-255):
        sensorValue[i] = map(incomingValues[i], 0, 1023, 0, 255); 
        //println(sensorValue[i]);
      }
    }
  }
}
