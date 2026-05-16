---
source: How To Get What You Want / KOBAKANT DIY
title: "Handcrafting Textile Sensors in Vienna"
url: "https://www.kobakant.at/DIY/?p=3011"
postId: 3011
date: "2011-05-26T15:39:59"
modified: "2011-06-08T11:23:50"
slug: "handcrafting-textile-sensors-from-scratch-2"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Handcrafting Textile Sensors in Vienna

Source: https://www.kobakant.at/DIY/?p=3011

## Excerpt

June 2 2011, 7pm, 3 hours, 15 participants, at Miss Baltazar’s Laboratory in Vienna/Austria If you have, PLEASE BRING: Knitting needles, crochet hook, multimeter, alligator clips, thread, yarn, fabric scraps and an Arduino board as well as your laptop with Arduino and Processing software installed. WHERE: Museumsquartier, Tagr TV / Transforming Freedom Space WHO: women […]

## Content

June 2 2011, 7pm, 3 hours, 15 participants, at  Miss Baltazar’s Laboratory in Vienna/Austria

If you have, PLEASE BRING: Knitting needles, crochet hook, multimeter, alligator clips, thread, yarn, fabric scraps and an Arduino board as well as your laptop with Arduino and Processing software installed.

WHERE: Museumsquartier, Tagr TV / Transforming Freedom Space

WHO: women and trans only

REQUIREMENTS: no previous knowledge of textiles or electronics necessary!

FEE: free

REGISTER AT:  mzbaltazarslaboratory@gmail.com

This hands-on workshop introduces a range of low-cost materials and tools for building textile sensors. Participants will learn techniques for handcrafting textile sensors and circuitry that include sewing, knitting, crochet and embroidery. The goal of the workshop is to familiarize participants with available electronic textile materials and introduce them to a variety of sensor and circuitry construction techniques.

Participants will also learn how to read the values of their sensors, using multimeters as well as Arduino and Processing.

Introduction and presentation links

>>  Massage me

>>  Instructables

>>  KOBAKANT

>>  HOW TO GET WHAT YOU WANT

>>  High-Low Tech

>>  Kit-of-No-Parts

>>  Plusea

Conductive materials

>>  Conductive thread

>>  Conductive fabric

>>  Velostat

>>  Neoprene

>>  Nm 10/3 conductive yarn

Sensors covered in the workshop

Conductive yarn sensors:

>>  Knit Stretch Sensor

>>  Crochet or Knit Pressure Sensor

>>  Crochet Tilt Potentiometer

>>  PomPom Pressure Sensor (felted)

Velostat sensors:

>>  Neoprene Bend Sensor

>>  Neoprene Pressure Sensor

>>  Neoprene Pressure Sensor Matrix

Digital sensors/switches:

>>  Stroke Sensor

>>  Tilt Sensor

Participant Creations

CODE

>> Copy and paste  Tom Igoe’s Arduino and Processing code that can read, send and graph multiple analog inputs

>> Bellow is some basic Arduino code that will read analog input and print it to the serial port. Copy and paste the code into a blank Arduino sketch, then upload it to your Arduino board. If you run the serial monitor you should see the values (between 0-1023) appear in the window.

// reads value of sensor attached between analog input zero (A0) and ground (-)

// writes value out the serial port

int value = 0;

void setup() {

  pinMode(A0, INPUT);

  digitalWrite(A0, HIGH);  //set internal pull-up resistor

  Serial.begin(9600);

}

void loop() {

  value = analogRead(A0);

  Serial.println(value);

}

Links

>>  Miss Baltazar’s Laboratory

>>  Workshop documentation of Flickr

>>  Arduino

>>  Processing

>>  Plug and Wear

>>  Less EMF
