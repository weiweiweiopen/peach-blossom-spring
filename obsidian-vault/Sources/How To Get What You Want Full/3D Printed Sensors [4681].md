---
source: How To Get What You Want / KOBAKANT DIY
title: "3D Printed Sensors"
url: "https://www.kobakant.at/DIY/?p=4681"
postId: 4681
date: "2013-10-13T14:51:39"
modified: "2013-10-13T15:02:25"
slug: "3d-printed-bend-sensor"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# 3D Printed Sensors

Source: https://www.kobakant.at/DIY/?p=4681

## Excerpt

Attempts to 3D print a variety of sensors from conductive ABS material in collaboration with FabLab Berlin. Interestingly the resistance of the material decreases when bent, implying that the electrical connections are being broken in the material because it is being stretched or damaged. When pressured the resistance through the material decreases.

## Content

Attempts to 3D print a variety of sensors from conductive ABS material in collaboration with  FabLab Berlin. Interestingly the resistance of the material decreases when bent, implying that the electrical connections are being broken in the material because it is being stretched or damaged. When pressured the resistance through the material decreases.

Materials:

>>  1.75mm ABS Conductive (black)

>>  1.75mm Flex EcoPLA black

Tools:

>>  Flashforge Creator 3D printer that can print two materials from two nozzles

Bend Sensor

Resistance of 1.75mm ABS Conductive before printing:

relaxed = 301 Kilo Ohm, bent = 846 Kilo Ohm

Resistance of 1.75mm ABS Conductive after being printed in U shape on Flex EcoPLA base. Both materials are black so you can’t really see what is what:

relaxed = 34 Mega Ohm, bent = 38 Mega Ohm

The Circuit

To read and visualize the change in electrical resistance of the material we use the following circuit: an Arduino LilyPad functions as the analog to digital converter, reading analog values from the sensor and sending them over the serial port (USB) to the computer. The Arduino code is a combination of the  “graph” example with  “smoothing”.

 

Because the resistance of the 3D printed conductive material is so high (32 – 38 Mega Ohm) the voltage divider needs to have a similarly high value. A 16 Mega Ohm pull-up resistor was made by cutting a thin strip of Eeontex non-woven fabric.

A sketch written in Processing visualizes the values in a graph. The Processing code is taken from the Arduino  “graph” example.

Video of 1.75mm ABS Conductive before printing:

Video of 1.75mm ABS Conductive after being printed in U shape on Flex EcoPLA base:

Pressure Sensor

…coming soon…
