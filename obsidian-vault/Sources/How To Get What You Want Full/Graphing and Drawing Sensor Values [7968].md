---
source: How To Get What You Want / KOBAKANT DIY
title: "Graphing and Drawing Sensor Values"
url: "https://www.kobakant.at/DIY/?p=7968"
postId: 7968
date: "2019-12-02T17:15:37"
modified: "2019-12-31T08:16:35"
slug: "spekulative-objekte"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Graphing and Drawing Sensor Values

Source: https://www.kobakant.at/DIY/?p=7968

## Excerpt

CODE EXAMPLES ARDUINO Single Analog Sensor Value Smoothing a Single Analog Sensor Value Multiple Analog Sensor Values Smoothing Multiple Analog Sensor Values ARDUINO —> PROCESSING Graph Single Analog Sensor Value in Processing Graph Multiple Analog Sensor Values in Processing ARDUINO Single Analog Sensor Value Examples: Communication –> Graph This example contains the code you need […]

## Content

CODE EXAMPLES

ARDUINO

Single Analog Sensor Value

Smoothing a Single Analog Sensor Value

Multiple Analog Sensor Values

Smoothing Multiple Analog Sensor Values

ARDUINO —> PROCESSING

Graph Single Analog Sensor Value in Processing

Graph Multiple Analog Sensor Values in Processing

ARDUINO

Single Analog Sensor Value

Examples: Communication –> Graph

This example contains the code you need to read an analog sensor value and send it over the Serial port.

You will need to build a  voltage divider in order to connect your sensor to the Arduino.

Voltage Divider:

External voltage divider connected to Arduino:

Or you can use the following line of code to turn on the internal pull-up resistors inside the Arduino’s ATmega328 chip:

pinMode(A0, INPUT_PULLUP);

Internal voltage divider using “pull-up” resistor inside Arduino:

Open the  Serial Monitor> and you should see the sensor’s value 10bit [0-1023] being printed.

 

Open the  Serial Plotter> and you should see the sensor’s value 10bit [0-1023] being plotted as a graph.

 

Notice that the graph auto-zooms to adjust to the current sensor range. This is annoying. You can fix the graph to a set range by also printing the analog sensor’s minimum and maximum values. Add the following lines of code to the sketch:

Serial.print(0);

Serial.print(“,”);

Serial.print(1023);

Serial.print(“,”);

Serial.println(analogRead(A0));

Open the Serial Monitor and you should see:

 

Open the Serial Plotter and you should see:

 

Smoothing a Single Analog Sensor Value

To smooth your sensor value, a simple line of code you can add to calculate the running average is:

averageSensorValue = (averageSensorValue * (average-1) + currentSensorValue) / average;

GITHUB: a_graphMultiple-smoothing

Open the Serial Monitor and you should see:

 

Open the Serial Plotter and you should see:

 

The green line is the raw sensor value, the yellow line is the smoothed sensor value.

Multiple Analog Sensor Values

To graph multiple sensor values, you can use this code:

>> GITHUB: a_graphMultiple

Open the Serial Monitor and you should see:

 

Open the Serial Plotter and you should see:

 

Smoothing Multiple Analog Sensor Values

Open the Serial Plotter and you should see:

 

ARDUINO —> PROCESSING

Graph Single Analog Sensor Value in Processing

Examples: Communication –> Graph

This example contains the Arduino code you need to read an analog sensor value and send it over the Serial port. As well as the Processing code (see the un-commented section bellow the Arduino code!) you need to graph that value in processing.

In the Processing code you need to change the port number ### to match your Arduino port number.

myPort = new Serial(this, Serial.list()[###], 9600);

Run the Processing sketch and you should see something like:

 

Graph Multiple Analog Sensor Values in Processing

This code draws circles in different colours with the diameter of the incoming sensor value.

>> GITHUB: a_graphMultiple-ellipse

Run the sketch and it should look like this:

 

/////////

NOTES

/////////

// note the 20mS delay between sending serial data packets. This is because the Arduino sends data faster than Processing can read and act on it.

Tom Igoe’s initial graphing code for processing:

 https://gist.github.com/madeintaiwan/6410770

// does not work for me in latest version of processing 3.5.3 !?!?!

Ingo’s packetizer code

download zip:  https://github.com/i-n-g-o/Packetizer

sketch —> include library —> add ZIP library

Arduino Cookbook by Michael Margolis

Chapter 4. Serial Communications

 https://www.oreilly.com/library/view/arduino-cookbook/9781449399368/ch04.html
