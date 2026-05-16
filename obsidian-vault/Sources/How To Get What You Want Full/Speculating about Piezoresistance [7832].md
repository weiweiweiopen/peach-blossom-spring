---
source: How To Get What You Want / KOBAKANT DIY
title: "Speculating about Piezoresistance"
url: "https://www.kobakant.at/DIY/?p=7832"
postId: 7832
date: "2019-09-14T14:39:01"
modified: "2019-09-17T12:43:34"
slug: "speculating-about-piezoresistance"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Speculating about Piezoresistance

Source: https://www.kobakant.at/DIY/?p=7832

## Excerpt

Together with Maurin we have been wondering what exactly goes on inside a piezoresistive material – or where the piezoresistive effect takes place. >> https://en.wikipedia.org/wiki/Piezoresistive_effect Ideas for why/where changes in resistance are happening by Maurin Donneaud: The information I bring here comes from my intuitions that I have not yet had the time to confirm […]

## Content

Together with  Maurin we have been wondering what exactly goes on inside a piezoresistive material – or where the piezoresistive effect takes place.

>>  https://en.wikipedia.org/wiki/Piezoresistive_effect

Ideas for why/where changes in resistance are happening by Maurin Donneaud:

The information I bring here comes from my intuitions that I have not yet had the time to confirm by a more in-depth study of the field. I hope that this exchange will allow us to validate or re-qualify these observations. 

Resistive pressure sensors

Resistive pressure sensors are sensors used to quantify a pressure and / or deduce a contact. By extension, these sensors are used to measure a linear or surface position. They are used in a large number of industrial applications because they can be produced at low cost from functional ink printing processes deposited on flexible plastic films. These sensors consist of three layers of functional inks (conductive / resistive / conductive) and one or two layers of separation. Antistatic plastic packaging such as Velostat can be used to form the resistive layer of this type of sensor. For this type of sensor, the pressure exerted varies the size of the contact between the different layers. The higher the pressure, the larger the contact size and the lower the resistance. We can explain this by using Ohm’s laws which describes the operation of resistors connected in parallel. The stronger the support, the more our circuit has resistances in parallel which divide according to the following formula: R = (R1 x R2) / (R1 + R2)

 ——- \ ____ / ——- <- conductive layer
 - - - - - - - - - - - - <- separator
|||||||||||||||||||||||||||| <- resistive layer
 ---------------------- <- conductive layer

 ---- \ _________ / ---- <- conductive layer
 - - - - - - - - - - - - <- separator
|||||||||||||||||||||||||||| <- resistive layer
 ---------------------- <- conductive layer

Piezo-resistive pressure sensors

Like resistive sensors, piezo-resistive pressure sensors are sensors used to quantify a pressure and / or deduce a contact. By extension, these sensors are used to measure a linear or surface position. Piezo-resistive sensors are distinguished from resistive sensors because they change the resistance to crushing. Piezo-resistive substrates are produced from processes for coating high-resilience materials such as foam or nonwoven. The main characteristics sought are a reduction in the electrical resistance caused by the compression of the material. There are also fibers with similar properties (cf: …). To manufacture this type of sensor, it is possible to use antistatic foams (foam used to package electronic components). To illustrate the operation of this type of sensor, we can use the image of a potentiometer.

 ———————- <- conductive layer
|||||||||||||||||||||||||||| <- piezo-resistive layer
 ---------------------- <- conductive layer

At the electrical level

The resistance of a resistive or piezo-resistive sensor varies in proportion to the pressure they receive. In the first case this variation is caused by the variation of the size of the contact between the different layers of the sensor, in the second, it is the crushing of the material which is at the origin of the variation of resistance.

In both cases, the highest resistance value corresponds to the rest position (sensor released), and the lowest resistance value, to the sensor in working situation (sensor in limit of support). To interface these sensors it is necessary to build a voltage divider bridge by adding a fixed value resistor. The choice of this resistor determines the range of voltage variation at the output of the voltage divider bridge. (See: TODO, diagram and rule of the voltage divider bridge) …

Surface pressure sensors

The manufacture of a resistive or piezo-resistive surface pressure sensor requires playing on several parameters to be able to deduce the position of objects in support and movement on the surface of the sensor. At hardware level, the main difference between a simple resistive or piezo-resistive pressure sensor and a surface pressure sensor is in the implementation of the line / column mastering. To improve the tracking of moving objects on this type of sensors it is possible to implement a principle of inter-digitization (overlap between the rows and column

Ideas for why/where changes in resistance are happening by Adrian Freed:

1) surface contact density/quality of resistive and conductive interface

2) spatial contact density within a matrix (for foams and fiber lattices, and conductor loaded materials) “percolation”

3) in solid metals and semiconductors like silicon and germanium it is the inter-atomic spacing that is

modulated and that facilitates electrons being raised into the conduction band.

4) quantum tunneling

Also see:

Flexible Tactile Sensing Based on Piezoresistive Composites: A Review

>>  https://www.researchgate.net/publication/260875410_Flexible_Tactile_Sensing_Based_on_Piezoresistive_Composites_A_Review

Piezoresistive fabrics like Eeonyx stretch and non-woven:

 

 

The Truth about Velostat!?

It might be that Velostat is NOT a piezoresistive material, but that changes in resistance are actually changes in resistance of the contact with the material.

 

Maurin’s sketches

 

Piezoresistive yarn? – changes in resistance between fibers…
