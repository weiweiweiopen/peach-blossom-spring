---
source: How To Get What You Want / KOBAKANT DIY
title: "Touch the Tone"
url: "https://www.kobakant.at/DIY/?p=9064"
postId: 9064
date: "2021-05-26T14:15:40"
modified: "2021-06-09T23:36:45"
slug: "touch-the-tone"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Touch the Tone

Source: https://www.kobakant.at/DIY/?p=9064

## Excerpt

2 days workshop organized at the Alanus Hochschule für Kunst und Gesellschaft from May 29 – 30th 2021. The workshop is open to the students at the Hochschule. In this two days hands-on workshop, you will be introduced to Capacitive Sensing technique(https://playground.arduino.cc/Main/CapacitiveSensor/) using Arduino. It is a simple but powerful technique to create objects and […]

## Content

2 days workshop organized at the  Alanus Hochschule für Kunst und Gesellschaft from May 29 – 30th 2021. The workshop is open to the students at the Hochschule.

In this two days hands-on workshop, you will be introduced to Capacitive Sensing technique(https://playground.arduino.cc/Main/CapacitiveSensor/) using Arduino. It is a simple but powerful technique to create objects and surfaces “interactive” for interactive installations and performances. We will explore ordinary materials that are electrically conductive (plants, grafite, gold leaf, salt water..etc) and specifically made conductive materials (conductive thread, conductive fabric, conductive ink…. etc) to create our own capacitive sensor design. The sensors will be connected to an Arduino board, and further with a computer to synthesize sound using Pure Data software (https://puredata.info/). You will be shown necessary basic programming techniques to use Arduino and Pure Data synthesis during the workshop. You do not need any prior programming experience to take the workshop. The main focus of the workshop is to design your own sound synthesising interactive objects with your choice of medium and materials.

You will need the software below (download link):
Arduino IDE ( https://www.arduino.cc/en/software )
Arduino Capsense Library ( https://playground.arduino.cc/Main/CapacitiveSensor/)
Pure Data ( http://puredata.info/downloads/pure-data)

In this workshop we will use  Arduino nano. We will go through the installation of the IDE and connecting your computer to Arduino the first time… but in case it does not work smoothly, here are some troubleshooting tutorials.

Sparkfun Installation tutorial page >>  https://learn.sparkfun.com/tutorials/installing-arduino-ide

FTDI driver page >>  https://ftdichip.com/Drivers/vcp-drivers/

Ohm’s Law

We talked about Voltage, Current and Resistance of electricity, and Ohm’s law in the introduction. Here are more details >>  https://en.wikipedia.org/wiki/Ohm%27s_law
 https://www.kobakant.at/DIY/?p=7916

In the workshop, we had different types of conductive materials. For example, Copper conductive thread, silver conductive thread, copper fabric, conductive wool, copper tape, Bare conductive ink, copper wire and goldleaf. They are all conductive and low resistance. 

You can embed these conductive materials on your object and use them as a sensor

Capacitive Sensor

We will use capacitive sensing technique using CapacitiveSensor library >>  https://www.arduino.cc/reference/en/libraries/capacitivehttps://playground.arduino.cc/Main/CapacitiveSensor/sensor/

To add capacitive sensor library to your Arduino, go to sketch/include Library/manage Library… option from the menu. This will open a new window.

Type in “capacitiveSensor” as one word and return. It will search internet to find the library. The first one shows up on the list, developed by Paul Bagder is the one we want to use. click install and it will install it to your Arduino. Now you can go to File/examples and you will see capacitiveSensor examples in the list. This means you have the library installed.

Example sketch/ patch that we use in the course:
 PD patch>> 
 Arduino sketch>>
