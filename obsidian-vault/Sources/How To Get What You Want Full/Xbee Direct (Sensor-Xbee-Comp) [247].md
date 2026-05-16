---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee Direct (Sensor-Xbee-Comp)"
url: "https://www.kobakant.at/DIY/?p=247"
postId: 247
date: "2009-04-03T15:22:47"
modified: "2009-07-02T11:09:08"
slug: "xbee-direct-sensor-xbee-comp"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee Direct (Sensor-Xbee-Comp)

Source: https://www.kobakant.at/DIY/?p=247

## Excerpt

This example explains how to send sensor input (analog) wirelessly to computer via Xbee (Series 1 802.15.4) without using microcontrollers. Step 1:  You need to set up the AT command for both receiver and sender. You can use X-CTU or some kind of terminal software,  Rob Faludi’s Xbee Terminal Max. I am using a small […]

## Content

This example explains how to send sensor input (analog) wirelessly to computer via Xbee (Series 1 802.15.4) without using microcontrollers.

Step 1:

 You need to set up the AT command for both receiver and sender.

You can use X-CTU or some kind of terminal software,  Rob Faludi’s  Xbee Terminal Max. I am using a small Max Patch made by  Ingo Randolf. You can download this max patch from  here>>

 

Screen shot of serialterminal_Xbee patch

[TABLE=6]

AT command setup example

Step 2: 

Connect the sensor to Xbee as following, and power the Xbee and sensor.

Breadboard setup

If you are supplying power bigger than 3.3V such as 9V battery or three AA batteries, you need to use 3.3v voltage regulator to supply 3.3V. You can also check the  SEWABLE 3.3V REGULATOR post.

 

 For testing, I am using Arduino Dicimila’s 3.3v power supply. Easy way to get 3.3V.

Step 3:

There are wonderful  XBee API Library for Processing from  Rob Faludi and  Dan Shiftman

I am using their example processing sketch to see if I am getting sensor input via Xbee directly.

 

Here, you can see I am receiving address of the sender and analog value (the first one)

Tip:

It helps to use ATRE (firmware reset) before starting a new project. Sometimes the AT command setup you put in the last project conflicts with the project you are working on and resulting to make you shout “…why does it NOT work??”
