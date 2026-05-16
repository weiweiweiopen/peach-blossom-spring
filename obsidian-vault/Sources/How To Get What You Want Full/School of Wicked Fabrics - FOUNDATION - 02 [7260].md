---
source: How To Get What You Want / KOBAKANT DIY
title: "School of Wicked Fabrics: FOUNDATION /02"
url: "https://www.kobakant.at/DIY/?p=7260"
postId: 7260
date: "2018-08-05T22:41:19"
modified: "2018-08-06T22:27:44"
slug: "school-of-wicked-fabrics-foundation-02"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# School of Wicked Fabrics: FOUNDATION /02

Source: https://www.kobakant.at/DIY/?p=7260

## Excerpt

Textile Sensors One can make different types of sensors. Some sensors have two states, “on” or “off”, or another words, “contact” or “no contact” like on/off switches of a light. Other sensors have range of states, like a dimmer of a light. The two state kind of sensors are digital sensors, and the sensors that […]

## Content

Textile Sensors

One can make different types of sensors. Some sensors have two states, “on” or “off”, or another words, “contact” or “no contact” like on/off switches of a light. Other sensors have range of states, like a dimmer of a light. The two state kind of sensors are digital sensors, and the sensors that has range is called analog sensors.

We can build these sensors and read the resistance change with multimeter.

Contact Sensor (ON/OFF, digital)

Push Button

 

 http://www.kobakant.at/DIY/?p=48

Tilt Switch

 

 http://www.kobakant.at/DIY/?p=201

Resistive Sensor (value, analog)

You are measuring the material’s electrical resistivity. The characteristics of the resistive material decides how the sensor behaves electrically.

Knit Stretch Sensor 

 http://www.kobakant.at/DIY/?p=2108

 

      

Bend Sensor 

 http://www.kobakant.at/DIY/?p=20

     

Pressure Sensor for heavy weight

 http://www.kobakant.at/DIY/?p=5689

      

Stretch Sensor 

 

      

Conductive Wool: Needle Felt Squeeze Sensor

You can mix a bit of wool to increase the range of resistance change.

 

       

Voltage Divider

If you have 2 exactly same resistors, the voltage gets half in the middle, like the first diagram. As the ratio between two resisters changes, the voltage you get in the middle (between the resisters) changes accordingly.

One can calculate this by

Supply voltage (5v) x resistanceA / (resistanceA + resistanceB) = divided voltage

So much of a theory, let’s try this to see if it really works. Here is an experiment with two resister with a multumeter.

The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to 0V (GND) of the power supply and the middle point where two resisters meet. You can see 2.44 in the multilmeter’s display. (almost 2.5V.. maybe the resister had some range) It divides the 5V in 50/50 ratio.

In the second experiment, I changed one of the resister to 47kohm. So now the ratio of two resisters are 10/47. So, I should read 5V x 10/(10+47) = 0.877 V in theory. As you can see in multimeter, it is 0.85V it measures. Not bad!

Now, if you change one of the resister to our resistive textile sensor, it works the same. The felt sensor I tested here has about 8kohm – 100kohm resistance range. You can see how the voltage that gets divided in the middle changes as I manipulate the felt. Now, if you connect the point where multimeter is reading to the Arduino Analog input, we can read how much voltage comes in.
