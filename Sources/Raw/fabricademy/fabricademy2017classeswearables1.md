---
type: pbs-source
sourceFamily: fabricademy
title: "fabricademy2017:classes:wearables1"
url: http://wiki.textile-academy.org/fabricademy2017/classes/wearables1
length: 6071
---

# fabricademy2017:classes:wearables1

fabricademy2017
classes
wearables1
# Table of Contents
Introduction to Electricity
Meet the Materials
Soft Circuit Techniques
Textile Sensors
Assignment 1: LED Circuit
Microcontrollers, ATtiny Programming
Assignment 2: ATtiny Circuit
Hannah Pierre Wilson and Mika Satomi are KOBAKANT and teach the class of e-textiles and wearables.
You can find the documentation of the class agenda here and on their webpage
In this week’s course, students will be introduced to an overview of the field of electronic textiles, example works in the field as well as materials and technical developments that have made these projects possible. We will go into details on different techniques for making soft/flexible/fabric circuits.
We will also introduce idea of microcontrollers using ATTINY as an example. We will cover simple exercise of opening blink LED example, going over the code basic and uploading to have the first step into arduino programing.
The exercise for the week will be to replicate/copy the swatch example, program your own ATTINY microcontroller with example code and design a basic circuit using the techniques of your choice.
We ask each student to create at least one analog fabric sensor and one digital sensor we mention in the course. Then create a fabric circuit using one or more of the connection technique (embroidered circuit, laser cut circuit, vinyl cut circuit) we cover in the course. They can connect the sensors simply with LED and a battery, or connect with programmed ATTINY to give a behavior to the fabric circuit. One can use buzzer speaker instead of LED as an actuator.
CLASS PRESENTATION
# Introduction to Electricity
# Meet the Materials
– Meet the multimeter!
– conductive fabrics
– conductive threads
– fusible interfacing
# Soft Circuit Techniques
# Topics covered:
– Different techniques for making soft/flexible/textile circuits
– Hard/soft connections (sewing, soldering, fusing, strain-relief…)
– Soldering with flux on conductive fabric
– Materials, tools
– Trace thickness, spacing
– Solder masks
– Strain relief
– Bend relief
# By hand:
– Hand embroidery
– Fusing strips of conductive fabric
*paper electronics techniques*
– cutting and sticking copper tape by hand (Jie Qi)
– Drawing conductive circuits with silver pen (circuit scribe, other one)
# By machine:
– Sewing Machine (bobbin thread)
– Machine embroidery
– Laser-cutting conductive fabric ( lilypad , leah)
– Vinyl-cutting conductive fabric or copper tape
– Etching copper conductive fabric
– Electroplating conductive fabrics and threads
– Etched flex circuits
– Ordering PCBs online
# connection between hard and soft
– Mount components on Protoboard (stripboard) and sew
– curled leg on the components
– Adding rings
– directly soldering on the legs
– press snaps (poppers)
# Creating Circuit Designs and Cut-files
– Inkscape
– Illustrator
– Photoshop
– Pen + paper + scan
– Eagle, Kikad, Fritzing
– Silhouette, Roland Cutmaster
Silhouette, Roland Cutmaster
# Textile Sensors
See: http://www.kobakant.at/DIY/?cat=26
# Assignment 1: LED Circuit
# Microcontrollers, ATtiny Programming
– USB TINY programmer
– Arduino IDE, Blink example, uploading
– explain a bit about the code, show the possibility of modification.
# How to upload code to the ATtiny
This post is a summary that covers how to turn your arduino board into an ISP programmer and use it to program an ATtiny85 or 45 8-pin microcontroller.
# Assignment 2: ATtiny Circuit
Arduino code:
/*
CODE for the Fabricademy e-textile sensor swatch
first built for the Fabricademy 2017
Hannah Perner-Wilson and Mika Satomi, KOBAKANT
*/
#define sensorPin 3
#define speakerPin 2
#define ledPin 0
int sensorValue = 0;
int noiseFrequency = 0;
int ledBrightness = 0;
void setup()
{
pinMode(sensorPin, INPUT); use digital pin number here
pinMode(speakerPin, OUTPUT);
pinMode(ledPin, OUTPUT);
} void loop()
{
sensorValue = analogRead(sensorPin); use analog pin number here
MAKE SOUND:
if(sensorValue < 900){ noiseFrequency = map(sensorValue, 0, 1023, 100, 10000); noise (speakerPin, noiseFrequency); } FADE LED: ledBrightness = map(sensorValue, 0, 1023, 0, 255); analogWrite(ledPin, ledBrightness); } MAKE SOUND ON THE ATTINY WITHOUT THE SOUND LIBRARY: void noise (unsigned char noisePin, int frequencyInHertz) { long delayAmount = (long)(1000000 / frequencyInHertz); digitalWrite(noisePin, HIGH); delayMicroseconds(delayAmount); digitalWrite(noisePin, LOW); delayMicroseconds(delayAmount); } —-
Arduino source code//
Attiny Programming
DIY Attiny Programming Shield tutorial
Attiny soft sensor and coil speaker
You also do the tutorial of Liza Stark with the Attiny embroidery here
===== MATERIALS AND TOOLS =====
Materials:
– Conductive fabric copper rip-stop
– Conductive fabric silver stretch
– conductive thread Karl-grimm copper thread
– Conductive thread statex silver plated nylon
– conductive yarn LessEMF
– Eeonyx stretch sensor fabric
– Eeonyx non-woven sensor fabric – Cotton/silk woven non-stretch fabrics
– Cotton Jersey stretch fabric
– cotton thread
– felt and/or neoprene
– 3mm thick foam
– Fusible interfacing (Thermoweb Heat’n Bond Ultra Hold iron-on Adhesive) – Metal Beads
– Glass/plastic beads (for isolation, hole should be big enough for conductive thread)
– snap press/ poppers (ideally 7mm diameter, if not 10mm) – ATTINY85
– 8pin socket
– various resisters
– LED (SMD (PLCC2 and Through-hole)
– speaker/buzzer
– purfboard
– 3V battery
– 3V battery holder (or we make fabric battery holder)
– Flux
– Solder
– single core wire or bare wire – copper foil sheet
– capton tape or sheet (solder mask) Tools:
– Sewing needles
– Scissors
– Fabric Scissors
– Iron
– crochet hooks
– Sewing machine*
– knitting mill*
– knitting machine*
– knitting needle* – laser cutter*
– vinyl cutter* – Breadboard
– jumper cable
– crocodile clip
– Soldering iron
– multimeter
– thin nose plier
– wire cutter/ knipper
– USB ATTINY programmer
– computer with Arduino IDE * optional
Except where otherwise noted, content on this wiki is licensed under the following license: CC Attribution-Share Alike 4.0 International
