---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee Serial Communication"
url: "https://www.kobakant.at/DIY/?p=772"
postId: 772
date: "2009-06-07T00:37:16"
modified: "2009-06-23T18:17:28"
slug: "xbee-serial-communication"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee Serial Communication

Source: https://www.kobakant.at/DIY/?p=772

## Excerpt

The simple thing Xbee can do is to replace the serial connection wirelessly. You can do this pretty much out of the box. It is like replacing the USB cable of Arduino (serial communication) to invisible cable (wireless). Here is an example of how to set up serial wireless communication: On Arduino side, the connection […]

## Content

The simple thing Xbee can do is to replace the serial connection wirelessly.

You can do this pretty much out of the box.

It is like replacing the USB cable of Arduino (serial communication) to invisible cable (wireless).

Here is an example of how to set up serial wireless communication:

On Arduino side, the connection is following. Basically you need to connect power (3.3v) , GND and TX, RX connection. “Serial.print();” output from the Arduino goes through Xbee wireless connection to your computer.

In this example potentiometer (sensor) is connected to Analog 0 input. Arduino is programed to read Analog inputs data and send it as Serial.print

If you are supplying power bigger than 3.3V such as 9V battery or three AA batteries, or Arduino that gives only 5V, you need to use 3.3v voltage regulator to supply 3.3V. Here is how to set up 3.3v regulator.

 

You can also check   SEWABLE 3.3V REGULATOR post. 

For receiving side, it can be Xbee-Arduino or Xbee-computer setup.

If  you are making Xbee-Arduino setup, connect the same way without potentiometer, and the data can be received as Serial.read command. 

If  you are making Xbee-computer setup, connect Xbee via USB dongle. (see  USB dongle post for detial)

The data is received through serial communication. Here are example codes for sending  Analog 0-5 inputs from Arduino and receiving with  Processing or  max/msp.
