---
source: How To Get What You Want / KOBAKANT DIY
title: "Textile Sensor Indulgence"
url: "https://www.kobakant.at/DIY/?p=6977"
postId: 6977
date: "2018-09-19T17:33:13"
modified: "2019-05-04T09:40:27"
slug: "what-can-technology-do-for-you"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Textile Sensor Indulgence

Source: https://www.kobakant.at/DIY/?p=6977

## Excerpt

October 24-26 2018, 17-20:30 (10h), at ČIPke in Ljubljana, Slovenia

## Content

October 24-26 2018, 17-20:30 (10h), at ČIPke in Ljubljana, Slovenia

In this 3-evening workshop we will introduce a palette of conductive fabrics, fibers and threads from which you can construct all kinds of textile sensors. We will demand you be rigorous about investigating the conductive, resistive and piezoresistive properties of these materials. We will challenge you to hone your craft skills by producing well-made replicas of select designs. Finally, we will ask you to be inventive and produce and document a textile sensor design of your own.

During this workshop each participant will compile a swatch-book of the experiments, copies and new designs they produce.

Swatchbook pages:

>>  www.kobakant.at/downloads/swatchbooks/18-RampaWSswatchPages.pdf

More info:

Cipkeen:  https://cipkeen.wordpress.com/2018/10/04/cipke-kobakant-e-techstil-24-26-october-17h-20h/

Ljudmila:  https://wiki.ljudmila.org/Textile_Sensor_Indulgence

Apply by sending an email to:  info@rampalab.org

SCHEDULE

Wednesday October 24th 17-20:30

17-17:15 welcome, intro

17:15-18:00 KOBAKANT presentation

Meet the Materials (conductive)

Meet the Multimeter

Digital Sensors Intro

Making Digital Sensors

(if finish early: invent your own digital sensor)

Show&Tell (could also be beginning of second eve)

Thursday October 25th 17-20:30

(Show&Tell)

Meet the Materials (resistive, piezoresistive)

Voltage Divider, ADC, Arduino/Teensy, serial plotter, midi, analog synth….

Analog Sensors Intro

Making analog sensors

Show&Tell

Friday October 24th 17-20:30

Invent your own analog/digital sensor

Document your sensor

Show&Tell

goodbye

DAY1

Meet the materials

– Copper Conductive Fabric

– Silver Stretch Conductive Fabric

– RIPSTOP SILVER FABRIC

– SOFT&SAFE

– High Flex 3981

– High Flex 3981 silver 14/000

– Elitex

– Shieldex

– 25% Metal Egypto Color Gold Gimp

Meet the multimeter

We can not see the electrons flowing. So we can not tell by looking if there is an electrical connection, or how much electrical resistance between one end to the other end of the circuit or a material.

To measure this, we use a tool called multimeter. This will be your friend throughout the workshop. Here is how to use it.

Check connection

 

turn the dial to arrow/sound sign. Place the probe to the to end of the part where you want to check the electrical connection. If there are connection, it will beep.

Check Resistance

 

Turn the dial to ohm mark part. there are few numbers on the ohm part, start from the smallest, or if you know roughly how much it should be, start with closest one. If it is on the diral 200 ohm, it means it will measure the resistance maximum 200ohm. If the resistance is bigger than 200ohm, it shows 1. like in the picture. In this case, turn the dial to bigger maximum range (for example 2000, or 20k (20,000)) to see if you start to see a number.

Textile Sensors

One can make different types of sensors. Some sensors have two states, “on” or “off”, or another words, “contact” or “no contact” like on/off switches of a light. Other sensors have range of states, like a dimmer of a light. The two state kind of sensors are digital sensors, and the sensors that has range is called analog sensors.

We can build these sensors and read the resistance change with multimeter.

Push Button

 

 http://www.kobakant.at/DIY/?p=48

Tilt Switch

 

 http://www.kobakant.at/DIY/?p=201

Button Switch

 http://www.kobakant.at/DIY/?p=7349

DAY2

Resistive Sensor (value, analog)

You are measuring the material’s electrical resistivity. The characteristics of the resistive material decides how the sensor behaves electrically.

Adjustable Slider

photos >>  https://www.flickr.com/photos/plusea/albums/72157685063387786

>>  http://www.kobakant.at/DIY/?p=6886

 

Knit Stretch Sensor 

 http://www.kobakant.at/DIY/?p=2108

 

      

Bend Sensor 

 http://www.kobakant.at/DIY/?p=20

     

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

 

Arduino sketch that reads analog input and displays on plotter with fixed range, fade LED and play sound>>  https://github.com/KOBAKANT/workshop-examples/tree/master/AnalogReadSerial_plotter_fixedrange_LEDfade

E-Textile Sensor Tester

 

 

front:

 

back:

 

analog

Slider

Pressure Sensor

Pressure Button

Bend Sensor

Knit Stretch

Crochet Squeeze

Felted
