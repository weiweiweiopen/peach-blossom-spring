---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny Programming Shield"
url: "https://www.kobakant.at/DIY/?p=3996"
postId: 3996
date: "2013-02-20T20:37:36"
modified: "2013-02-23T14:48:15"
slug: "attiny-programming-arduino-shield"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny Programming Shield

Source: https://www.kobakant.at/DIY/?p=3996

## Excerpt

This little circuit sits nicely ontop of an Arduino board and lets you quickly plug in an ATtiny chip for programming using the Arduino “language” and IDE to write the code, and the Arduino board as an ISP programmer to upload the code to the tiny chip.

## Content

This little circuit sits nicely ontop of an Arduino board and lets you quickly plug in an ATtiny chip for programming using the Arduino “language” and IDE to write the code, and the Arduino board as an ISP programmer to upload the code to the tiny chip.

>>  Instructable

For instructions on how to use Arduino to program ATtinies, please look at the following links. This post will only explain how to build the programming shield.

Arduino as ISP >>  http://www.kobakant.at/DIY/?p=3742

Arduino board as ATtiny programmer (by Dave Mellis) >>  http://hlt.media.mit.edu/?p=1706

Programming an ATtiny w/ Arduino 1.0.1 (by Dave Mellis) >>  http://hlt.media.mit.edu/?p=1695

Step-by-Step Instructions

Materials

– Perforated circuit board

– Male and female headers

– Wire

– 10uF capacitor

– Arduino Uno or Duemilanove (with an ATmega328, not an older board with an ATmega168!)

– ATtiny45 or 85

Tools

– Cutter knife

– Cutting mat

– File

– Wire cutters and stripper

– Soldering iron

– Helping hand

Use the following illustration to help you throughout the following steps:

1) Cut Circuit Board to Shape

Cut a piece of perforated circuit board to size and file the edges:

2) Solder Male Headers

Take 4 male headers and solder them to the circuit board, but with the solder connections on the unintended side of the circuit board. So solder them you will need to hold them away from the circuit board a bit so that you can make the solder connection. Once you’ve got the first pin soldered the rest will be easier:

Video: Soldering headers to perforated circuit board:

Make sure the board with headers fit into your Arduino:

3) Disconnect Circuit Traces

Disconnect the line traces as follows (see illustration and video) using a cutter knife:

Video: Cutting connection on a perforated circuit board:

4) Solder Female Headers

Then insert the female header pins and use an ATtiny chip as reference to make sure you get the spacing right:

Then solder:

5) Solder Circuit

Use jumper wire or cut wire to length and strip either end and start to populate the circuit board with wires to make the connections between the pins of the Arduino and the pins of the ATtiny. Use illustration and the following information for reference:

Wiring your ISP connection:

ATtiny        —–  Arduino

Pin PB2 (SCK)   —–  Pin 13

Pin PB1 (MISO)  —–  Pin 12

Pin PB0 (MOSI)  —–  Pin 11

Pin PB5 (Reset) —–  Pin 10

Plus (VCC)    —–  +5V

Minus (GND)   —–  GND

10uF Capcitor:

Arduino pins: RESET —-||—- GND

 

Bend wires on bottom side to stop them falling out before you solder them:

Done!

6) Upload your program!

Now plug in your Arduino and follow the instructions in the Arduino as ISP post linked to at the top of this page.

Video: Using ATtiny shield to program an ATtiny to play a song:
