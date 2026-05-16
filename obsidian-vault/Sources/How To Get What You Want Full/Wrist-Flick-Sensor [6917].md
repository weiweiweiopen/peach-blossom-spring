---
source: How To Get What You Want / KOBAKANT DIY
title: "Wrist-Flick-Sensor"
url: "https://www.kobakant.at/DIY/?p=6917"
postId: 6917
date: "2017-08-16T07:11:41"
modified: "2021-08-18T21:04:32"
slug: "wrist-flick-drum"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Wrist-Flick-Sensor

Source: https://www.kobakant.at/DIY/?p=6917

## Excerpt

Made during PIFcamp 2017, this textile sensor detects the impact of a conductive pendulum slapping against the wristband when the wrist is twisted back and forth in a flicking action. The conductive pendulum is made from a small heavy stone collected by the Soca river that has been sewn into a stretch conductive pouch.

## Content

Made during PIFcamp 2017, this textile sensor detects the impact of a conductive pendulum slapping against the wristband when the wrist is twisted back and forth in a flicking action. The conductive pendulum is made from a small heavy stone collected by the Soca river that has been sewn into a stretch conductive pouch.

In this example video the contact of flicking triggers a sound sample to be played, and the impact/force/pressure of the flick determines the volume of the playback. While the pressure sensor works, the pressure is always related to the speed of flicking, so in a second iteration I would like to only have a contact switch and calculate the duration between flicks to determine impact.

Flickr set >>  https://www.flickr.com/photos/plusea/albums/72157711121338118

 

 

 

Conductive fabric underneath the piezoresistive fabric of the pressure sensor:

 

/*

wristFlickDrum Code

>>

reads incoming serial values [0, 1023] and triggers a sound file

when they are bellow a set threshold.

the volume [-20, 20] of the playback depends on the incoming value.

*/

import processing.serial.*;

import ddf.minim.*;

int maxNumberOfSensors = 1;       // Arduino has 6 analog inputs, so I chose 6

Serial myPort;                    // The serial port

int[] sensorValues = new int[maxNumberOfSensors];  // array of previous values

Minim minim;

AudioSample sample;

AudioPlayer player;

void setup () {

size(400, 400);

//size(800, 600, P3D);

println(Serial.list());

String portName = Serial.list()[5];

myPort = new Serial(this, “/dev/tty.usbmodem1411”, 9600);

myPort.clear();

myPort.bufferUntil(‘\n’);

background(0);

smooth();

minim = new Minim(this);

sample = minim.loadSample( “ding.wav”, 512);

}

void draw () {

println(sensorValues[0]);

if (sensorValues[0] < 900) {

float volume = constrain(sensorValues[0], 20, 900);

volume = map(volume, 20, 900, 20, -20);

sample.setGain(volume);

sample.trigger();

}

}

void serialEvent (Serial myPort) {

// get the ASCII string:

String inString = myPort.readStringUntil(‘\n’);

// if it’s not empty:

if (inString != null) {

// trim off any whitespace:

inString = trim(inString);

// convert to an array of ints:

int incomingValues[] = int(split(inString, “,”));

if (incomingValues.length <= maxNumberOfSensors && incomingValues.length > 0) {

for (int i = 0; i < incomingValues.length; i++) {

sensorValues[i] = incomingValues[i];

}

}

}

}
