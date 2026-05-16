---
source: How To Get What You Want / KOBAKANT DIY
title: "pressure matrix code + circuit"
url: "https://www.kobakant.at/DIY/?p=7943"
postId: 7943
date: "2019-10-25T00:59:58"
modified: "2020-05-06T19:37:48"
slug: "pressure-matrix-code-circuit"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# pressure matrix code + circuit

Source: https://www.kobakant.at/DIY/?p=7943

## Excerpt

In this post I want to try and explain how a pressure matrix built from conductive rows and columns with a piezoresistive material (Eeonyx, Velostat) in between works, how to wire it up to an Arduino and write the Arduino code that will parse through the rows and columns to read the individual pressure points […]

## Content

In this post I want to try and explain how a pressure matrix built from conductive rows and columns with a piezoresistive material (Eeonyx, Velostat) in between works, how to wire it up to an Arduino and write the Arduino code that will parse through the rows and columns to read the individual pressure points at each row/column intersection.

1) how a piezoresistive pressure sensor works

2) wiring matrix to arduino

3) the matrix code

 

More illustrations >>  https://www.flickr.com/photos/plusea/albums/72157691421107353

Translating WORLD to COMPUTER:

 

1) how a piezoresistive pressure sensor works

the  piezoresistive effect is described as “a change in the electrical resistivity of a semiconductor or metal when mechanical strain is applied”. How does this “change in electrical resistivity” happen?

Together with Maurin D. and Adrian F., I’ve speculated about the factors that play into this, and have attempted to describe it more detail here:

>>  https://www.kobakant.at/DIY/?p=7832

In this illustration I try to capture the fact that there is not only a change in resistance happening inside the material, but also between the electrodes and the material.

 

In etextiles for piezoresistive materials, we most often use:

– Velostat/Linqstat (because it is so easy and cheap to get, the downside being it is plastic sheet)

– Eeonyx fabrics (hard to get)

– knit/woven/felted steel fiber blends or steel fiber yarn blends (https://www.kobakant.at/DIY/?p=6005)

And on either side of these materials we create conductors/leads/electrodes/probes by sewing lines of conductive thread, fusing strips of conductive fabric……

There are many many ways to assemble a fabric pressure sensor or pressure sensor matrix. Here are a few:

SOFT

With the same principal you can go on to make larger soft fabric touchpads like this one:

>>  https://www.kobakant.at/DIY/?p=7651

SEWN directly onto the piezoresistive

>>  https://www.kobakant.at/DIY/?p=6900

WOVEN from strips

>>  https://www.kobakant.at/DIY/?p=4296

WOVEN through holes

>>  https://www.kobakant.at/DIY/?p=6889

WOVEN & stretchy

>>  https://www.kobakant.at/DIY/?p=7217

STRETCHY

And stretchy ones too:

>>  http://www.kobakant.at/DIY/?p=7639

in NEOPRENE

>>  https://www.kobakant.at/DIY/?p=213

KAPTON and copper tape

>>  https://www.kobakant.at/DIY/?p=7443

 

3×3 Paper Matrix Example

This is the 3 x 3 paper touchpad that you can quickly assemble in order to go through the example and learn to build the circuity and write the code.

Photos >>  https://www.flickr.com/photos/plusea/albums/72157708415692535

template to print on paper:

 

 

print, cut, tape, assemble:

 

 

 

2) wiring matrix to arduino

TRANSLATING: world –> computer

– resistance –> voltage

– analog –> digital

 

TRANSLATING: resistance(ohm) –> voltage(volt)

Ohm’s law: V = I x R

 

Velostat = fixed resistor

Velostat = variable resistor

 

 

 

Voltage Divider:

 

 

 

 

 

 

 

3) the matrix code

TRANSLATING: analog –> digital (using the ADC)

ADC = Analog Digital Converter:

analogRead(pin#);

ARDUINO CODE:

/*

Pressure Sensor Matrix Code

parsing through a pressure sensor matrix grid by switching individual

rows/columns to be HIGH, LOW or INPUT (high impedance) to detect

location and pressure.

>>  https://www.kobakant.at/DIY/?p=7443

*/

#define numRows 3

#define numCols 3

#define sensorPoints numRows*numCols

int rows[] = {A0, A1, A2};

int cols[] = {5,6,7};

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

    if (i < sensorPoints – 1) Serial.print(“\t”);

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

>>  http://howtogetwhatyouwant.at/

*/

import processing.serial.*;

Serial myPort;  // The serial port

int rows = 10;

int cols = 10;

int maxNumberOfSensors = rows*cols;

float[] sensorValue = new float[maxNumberOfSensors];  // global variable for storing mapped sensor values

float[] previousValue = new float[maxNumberOfSensors];  // array of previous values

int rectSize = 0;

int rectY;

void setup () {

size(600, 600);  // set up the window to whatever size you want

rectSize = width/rows;

println(Serial.list());  // List all the available serial ports

String portName = Serial.list()[1];  // set the number of your serial port!

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

rect(rectSize * (i%rows), rectY, rectSize, rectSize);  //top left

if((i+1) % rows == 0) rectY += rectSize;

}

rectY=0;

}

void serialEvent (Serial myPort) {

String inString = myPort.readStringUntil(‘\n’);  // get the ASCII string

println(“test”);

if (inString != null) {  // if it’s not empty

inString = trim(inString);  // trim off any whitespace

int incomingValues[] = int(split(inString, “\t”));  // convert to an array of ints

if (incomingValues.length <= maxNumberOfSensors && incomingValues.length > 0) {

for (int i = 0; i < incomingValues.length; i++) {

// map the incoming values (0 to  1023) to an appropriate gray-scale range (0-255):

sensorValue[i] = map(incomingValues[i], 0, 1023, 0, 255); // stretch 5×5

println(sensorValue[i]);  // print value to see

}

}

}

}

 

Internal pull-up resistor

pinMode(pin#, INPUT_PULLUP);

  

 

2 sensors

 

3 sensors

 

6 sensors ?????????????

 

9 sensors !

 

CODE

GROUND the pin:

pinMode(pin#, OUTPUT);

digitalWrite(pin#, LOW);

 

IGNOTE the pin:

pinMode(pin#, INPUT);

 

1:

 

READ from this pin:

pinMode(pin#, INPUT);

analogRead(pin#);

 

READ from this intersection:

 

 

2:

 

3:

 

4:

 

Wiring:
