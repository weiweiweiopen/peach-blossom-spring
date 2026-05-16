---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny Snap Diamond"
url: "https://www.kobakant.at/DIY/?p=6703"
postId: 6703
date: "2017-04-27T05:00:38"
modified: "2017-05-05T23:12:16"
slug: "attiny-breakout"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny Snap Diamond

Source: https://www.kobakant.at/DIY/?p=6703

## Excerpt

A breakout board for the ATtiny84. Designed to sit on the back of the hand and interface to 5 textile stretch sensors on three fingers. Reading their analog values and translating them into lighting patterns as well as sending their analog sensor data over serial rx and tx connections.

## Content

A breakout board for the ATtiny84. Designed to sit on the back of the hand and interface to 5 textile stretch sensors on three fingers. Reading their analog values and translating them into lighting patterns as well as sending their analog sensor data over serial rx and tx connections.

Notes for next version:

Use Packetizer for sending analog values over serial:

>>  https://github.com/i-n-g-o/Packetizer

// IMPORTANT: To reduce NeoPixel burnout risk, add 1000 uF capacitor across

// pixel power leads, add 300 – 500 Ohm resistor on first pixel’s data input

// and minimize distance between Arduino and first pixel.  Avoid connecting

// on a live circuit…if you must, connect GND first.

Trick: doublesided FR2 circuitboard flip technique

1) mill top side and drill holes

2) flip board in bracket (although sometimes the othermill won’t recognise bracket or if you don’t have one….)

3) set up to drill holes in bottom side. keep hand on pause button. press pause just before it starts rotating. check to see if endmill wants to enter correct hole.

if yes: press stop. turn off drill holes. turn on mill traes and mill outline. run job.

if no: press stop. adjust placement of board (x,y). repeat drill holes step until drill wants to enter hole correctly. then procede with “if yes”.

4) done

Boards

Eagle files >>  https://github.com/plusea

DIY VRglove Instructable >>

Flickr set >>  https://www.flickr.com/photos/plusea/albums/72157679861886694

DIY VRglove Flickr group >> 

Othermill cnc mill and Otherplan software >>  https://othermachine.co/othermill-pro/

Reflow oven >>  https://www.instructables.com/id/Guide-to-the-T-962A-Reflow-Oven/

Safety Dataglove Version

 https://www.arduino.cc/en/Reference/SoftwareSerial

Simple Breakout Version

Re-mapped for sensor order:

// Thumb = 1

// Index finger knuckle = 0

// Index hand knuckle = 3

// Middle finger knuckle = 4

// Middle hand knuckle = 5

ATtiny84 Version

Top and bottom:

Circuit layout:

Schematic:

Code

Programming Adafruit Metro

– download arduino IDE

– add the Adafruit Board Support package!

explained here >>  https://learn.adafruit.com/adafruit-arduino-ide-setup/arduino-1-dot-6-x-ide

– install drivers

>>  http://www.ftdichip.com/Drivers/VCP.htm

>>  http://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers

– restart arduino

– select board “Adafruit Metro”

– select port “/dev/cuSLAB_USBtoUART”

– upload

Arduino Code

/*

  Code for DIY E-Textile VR Glove

  by Rachel Freire, Arty, Hannah

  Reads the values of 5 ananlog stretch sensors on the knuckles of 3 fingers.

  Sends these over the serial port.

  Controls the colour of a neopixel LED according to the incoming values.

  DOCUMENTATION:

  Instructable >>

  Snap diamond >>  http://www.kobakant.at/DIY/?p=6703

*/

#include 

#ifdef __AVR__

#include 

#endif

#define PIN 2

Adafruit_NeoPixel strip = Adafruit_NeoPixel(1, PIN, NEO_GRB + NEO_KHZ800);

int sensorValues[] = {0,0,0,0,0};

byte analogPins[] = {

  A1, A0, A3, A4, A5

};

// re-mapped for sensor order:

// Thumb = 1

// Index finger knuckle = 0

// Index hand knuckle = 3

// Middle finger knuckle = 4

// Middle hand knuckle = 5

void setup() {

  for (int i = 0; i < 5; i++) {
    pinMode(analogPins[i], INPUT);
  }
  Serial.begin(9600);

  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void loop() {

  for (int i = 0; i < 5; i++) {
    sensorValues[i] = analogRead(analogPins[i]);
    Serial.print(sensorValues[i]);
    if (i < 4) Serial.print(",");
  }
  Serial.println();

  int redColour = map(sensorValues[1], 240, 250, 0, 255); //thumb
  int greenColour = map((sensorValues[0] + sensorValues[3]) / 2, 230, 260, 0, 255); //index
  int blueColour = map((sensorValues[4] + sensorValues[5]) / 2, 250, 300, 0, 255); //middle

  strip.setPixelColor(0, Wheel((redColour + greenColour + blueColour) / 3)); // edit wheel
  //strip.setPixelColor(0, strip.Color(redColour, greenColour, blueColour)); // edit RGB
  strip.show(); // This sends the updated pixel color to the hardware.
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if(WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if(WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

Processing Code

/*

 Code for DIY E-Textile VR Glove

 by Rachel Freire, Arty, Hannah

 Reads the values of 5 ananlog stretch sensors on the knuckles of 3 fingers.

 Sends these over the serial port.

 Controls the colour of a neopixel LED according to the incoming values.

 DOCUMENTATION:

 Instructable >>

 Snap diamond >>  http://www.kobakant.at/DIY/?p=6703

 Based on Serial Graphing Sketch by Tom Igoe

 This sketch takes ASCII values from the serial port at 9600 bps and graphs them.

 The values should be comma-delimited, with a newline at the end of every set of values.

 */

import processing.serial.*;

int maxNumberOfSensors = 5;       // Arduino has 6 analog inputs, so I chose 6

boolean fontInitialized = false;  // whether the font’s been initialized

Serial myPort;                    // The serial port

float[] previousValue = new float[maxNumberOfSensors];  // array of previous values

int xpos = 0;                     // x position of the graph

int[] mappedValues = new int[maxNumberOfSensors];

PFont myFont;                     // font for writing text to the window

String[] sensorNames = {“Thumb”, “Index_fk”, “Index_hk”, “Middle_fk”, “Middle_hk”};

void setup () {

  size(800, 600);

  println(Serial.list());

  String portName = Serial.list()[1];

  myPort = new Serial(this, portName, 9600);

  myPort.clear();

  myPort.bufferUntil(‘\n’);

  background(0);

  smooth();

    myFont = createFont(PFont.list()[3], 14);

  textFont(myFont);

  fontInitialized = true;

  // set inital background:

}

void draw () {

  for (int i = 0; i < mappedValues.length; i++) {
    float ypos = map(mappedValues[i], 0, 1023, 0, height/mappedValues.length);
    float graphBottom = i * height/mappedValues.length;
    ypos = ypos + graphBottom;
    noStroke();
    fill(0);
    rect(10, graphBottom+1, 110, 20);
    fill(255);
        int textPos = int(graphBottom) + 14;
        // sometimes serialEvent() can happen before setup() is done.
        // so you need to make sure the font is initialized before
        // you text():
        if (fontInitialized) {
          text(sensorNames[i] + ":" + mappedValues[i], 10, textPos);
        }
    stroke(127);
    strokeWeight(1);
    line(0, graphBottom, width, graphBottom);
    strokeWeight(5);
    stroke(64*i, 32*i, 255);
    line(xpos, previousValue[i], xpos+1, ypos);
    previousValue[i] = ypos;
  }
  
  if (xpos >= width) {

    xpos = 0;

    background(0);

  } else {

    xpos++;

  }

}

void serialEvent (Serial myPort) {

  String inString = myPort.readStringUntil(‘\n’);  // get the ASCII string:

  if (inString != null) {  // if it’s not empty

    inString = trim(inString);  // trim off any whitespace

    int incomingValues[] = int(split(inString, “,”));  // convert to an array of ints

    println(“length: ” + incomingValues.length + ” values.\t”);

    if (incomingValues.length <= maxNumberOfSensors && incomingValues.length > 0) {

      for (int i = 0; i < incomingValues.length; i++) {
        mappedValues[i] = int(map(incomingValues[i], 200, 500, 0, 1023));
        mappedValues[i] = constrain(mappedValues[i], 0, 1023);
        println("incoming: " + incomingValues[i] + "       mapped: " + mappedValues[i]);
      }
    }
  }
}
