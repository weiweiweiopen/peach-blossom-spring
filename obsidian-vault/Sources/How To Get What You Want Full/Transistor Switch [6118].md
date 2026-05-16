---
source: How To Get What You Want / KOBAKANT DIY
title: "Transistor Switch"
url: "https://www.kobakant.at/DIY/?p=6118"
postId: 6118
date: "2016-05-09T14:46:50"
modified: "2020-01-09T17:03:13"
slug: "transistor-switch"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Transistor Switch

Source: https://www.kobakant.at/DIY/?p=6118

## Excerpt

When you are controlling actuator that needs more than 5V or more than 40mA (this is the maximum current digital pins can supply), you can not directly drive this actuator from the digital pins. This is the case, when you want to use strong motor, embroidered speaker, SMA or any heat actuators.. and many more. […]

## Content

When you are controlling actuator that needs more than 5V or more than 40mA (this is the maximum current digital pins can supply), you can not directly drive this actuator from the digital pins.

This is the case, when you want to use strong motor, embroidered speaker, SMA or any heat actuators.. and many more. You will need to build a  transistor switch circuit to control these applications from Arduino.

So, idea is that if you could control a switch like this with Arduino. You can do this by using Transistor Switch circuit.

You can find many tutorials on this, like these ones

 http://www.electronics-tutorials.ws/transistor/tran_4.html

 http://hyperphysics.phy-astr.gsu.edu/hbase/electronic/transwitch.html

The idea is something like this. The voltage you give from Arduino’s Digital Output pin now works like the finger pushing the switch. This is NPN common emitter circuit. When you give 5V out, the switch closes (ON), and if you give 0V, the switch opens (OFF)

or if I write it in schematic way, it is something like this. I added few more components in this circuit (protection diode, pull down resister, protection resister). You can read what they are for in the above tutorial link.

Transistor pins

B: Base. You can control ON/OFF state of the transistor switch by applying voltage (i.e. 5V)

C: Collector. On NPN type transistor switch circuit, load (i.e. motor) is above the collector pin

E: Emitter. On NPN type transistor switch circuit, Emitter connects to GND. When voltage is applied to Base pin, Collector and Emitter gets closed (connected).

For example, one of the commonly used NPN Darlington Transistor TIP122 pins are like this

When do you need Transistor Switch?

– Controlling High Power LED

– Turning DC motor on/off

– Controlling the heat element for thermometric prints

– Activating SMA

– Controlling the Flip dot/ Flap (Electromagnetic Coil)

mosFET for Heat controlling applications

For controlling heat elements or SMA, one needs low internal resistance transistor, otherwise the transistor itself gets hot when you let the electricity go through. mosFETs (Field Effect Transistor) works better for these applications. We often use IRLR8743 N-channel mosFET for these applications.
