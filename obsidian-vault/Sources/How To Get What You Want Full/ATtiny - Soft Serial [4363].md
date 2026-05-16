---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny: Soft Serial"
url: "https://www.kobakant.at/DIY/?p=4363"
postId: 4363
date: "2012-07-19T11:11:18"
modified: "2013-06-23T09:27:45"
slug: "attiny-soft-serial"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny: Soft Serial

Source: https://www.kobakant.at/DIY/?p=4363

## Excerpt

Using software serial library on an ATtiny to send serial via FTDI over USB (or bluetooth) for communication to computer. Useful for debugging!

## Content

Using software serial library on an ATtiny to send serial via FTDI over USB (or bluetooth) for communication to computer. Useful for debugging!

// software serial example for ATtiny!

#include 

SoftwareSerial mySerial(0, 1); // RX, TX

void setup()

{

  // set the data rate for the SoftwareSerial port

  mySerial.begin(4800);

  mySerial.println(“Hello, world?”);

  pinMode(3, INPUT_PULLUP);

}

void loop() // run over and over

{

   int sensorValue = analogRead(3);

    mySerial.println(sensorValue);

}
