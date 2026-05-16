---
source: How To Get What You Want / KOBAKANT DIY
title: "KOBA School of Wickedfabrics: TAILORING"
url: "https://www.kobakant.at/DIY/?p=7310"
postId: 7310
date: "2018-08-18T14:12:11"
modified: "2019-01-16T14:36:11"
slug: "koba-school-of-wickedfabrics-tailoring"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# KOBA School of Wickedfabrics: TAILORING

Source: https://www.kobakant.at/DIY/?p=7310

## Excerpt

August 20-25 2018, KOBA in Berlin, Germany INTRODUCTION For the last 6 months KOBAKANT have been running KOBA, a tailorshop for electronic textiles and wearable technology in Berlin, Germany. The KOBA School of Wickedfabrics is intended as a time and place for us to formalize our tailoring process and share this experiance with you. This […]

## Content

August 20-25 2018,  KOBA in Berlin, Germany

INTRODUCTION

For the last 6 months KOBAKANT have been running KOBA, a tailorshop for electronic textiles  and wearable technology in Berlin, Germany.

The KOBA School of Wickedfabrics is intended as a time and place for us to formalize our tailoring process and share this experiance with you.

This booklet was made to accompany the TAILORING week school –

intended for professionals from diverse backgrounds who want to learn to develop e-textile garments from scratch to fitting.

By teaching a school for tailor-made wearable technology we hope to inspire you that different ways of producing technology are possible and tailoring is one of these paths to electronic diversity.

LINKS:

Download PDF booklet >>  https://drive.google.com/file/d/1N3TtKT4NhnQFrX1hZCTuLebKp_nbD7g9/view?usp=sharing

Flickr photo set >>  https://www.flickr.com/photos/plusea/albums/72157697292287642

Code examples >>  https://github.com/KOBAKANT/KOBA/blob/master/SCHOOL/TAILORING/

PARTICIPANTS:

Alexandra Mateus >> alexandramateus.com

Annie Lywood >> bonniebinary.co.uk

Caroline Mcmillan

Michaela Honauer >> mihoo.de

Roseanne Wakely >> rustysquid.com

SABLE CHAUD >> sablechaud.eu

Vera Castelijns 

SENSE YOURSELF MOVING

In order to go through the process of tailoring an e-textile garment from start to finish, we’ve prepared an example: each participant will tailor a simple blouse or jacket with 1-2 inputs (textile sensors) and 1-2 outputs (vibration motors). The textile sensor will capture a physical movement of the body and the vibration motor will respond to this movement and feed information back to you.

This may sound too simple, but trust us, e-textiles take time and to construct a garment, a sensor, a motor module and a custom circuit that connects them all takes a lot of time.

SCHEDULE

 

CONTENTS

MEET THE MATERIALS

materials overview

material samples

electricity introduced (ohm’s law)

your friend, the multimeter

TEXTILE SENSORS

beaded tilt sensor

fabric pushbutton

fabric slider

neoprene bend sensor

knit tretch sensor

crochet squeeze sensor

QUESTIONS:

Q: how to know the “perfect” pull-up resistor?

A: graph curve of different resistors and make choice.

Q: how to read a sensor matrix?

A: the i/o (in/out) pins of the arduino can be changed during the loop. start by manually coding these changes to read and write to the rows and columns of your matrix. then try implementing the for() loop.

here some example code for reading a 2 x 2 matrix:

simple:

>>  https://github.com/KOBAKANT/KOBA/blob/master/SCHOOL/TAILORING/KOBAtailoringMATRIX_simiple/KOBAtailoringMATRIX_simiple.ino

using for() loop to parse the rows and columns (easily scale-able):

>>  https://github.com/KOBAKANT/KOBA/blob/master/SCHOOL/TAILORING/KOBAtailoringMATRIX_parse/KOBAtailoringMATRIX_parse.ino

MICROCONTROLLER PROGRAMMING

flora

pull-up resistor

voltage divider

transistor switch

on wednesday we will be programming the Flora using the Arduino IDE programming environment. if you don’t already have it, please download the Arduino software for your computer from this link:

>>  https://www.arduino.cc/en/Main/Software

if you want to get a head start on installing the Adafruit boards package, you can open the Arduino IDE and follow the following steps. otherwise we will also go over this together during the school:

>>  https://learn.adafruit.com/add-boards-arduino-v164/setup

Q: #define x y VS int x = y?

A: #define ledPIN 2 is just a fancy way of setting up a “search and replace” in your code.  Wherever “ledPIN” appears, the arduino compiler pretends it saw a “2” instead.  It can’t be changed while the sketch is running, and it takes no memory in the processor.

int ledPIN = 2; is a variable.  It takes a little memory (two bytes) to store the value, and in fact it takes a little more memory to store the original value you started with.  However, this allows the sketch to modify that variable under any desired circumstances, and thus use the new value from that time on.

HARD/SOFT CONNECTIONS & BREAKOUT BOARDS

vinylcut breakouts

protoboard breakouts

PATTERN MAKING & CIRCUIT INTEGRATION

pattern basics

circuit layout/design

HOW TO…

solder

desolder

sew

crochet
