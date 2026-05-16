---
source: How To Get What You Want / KOBAKANT DIY
title: "Fabricademy: Soft Circuits and Textiles Sensors"
url: "https://www.kobakant.at/DIY/?p=6745"
postId: 6745
date: "2017-09-18T11:00:40"
modified: "2017-12-24T15:43:22"
slug: "fabricademy-soft-circuits-and-textiles-sensors"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Fabricademy: Soft Circuits and Textiles Sensors

Source: https://www.kobakant.at/DIY/?p=6745

## Excerpt

Week 5 on the 21st of October 2017 as part of the Fabricademy As part of the Fabricademy we will teach one of the week sessions introducing electronics textiles as a field of making soft, flexible, wearable electronics. Students will learn techniques by copying swatches as well as producing their own unique designs. In this […]

## Content

Week 5 on the 21st of October 2017 as part of the Fabricademy

As part of the Fabricademy we will teach one of the week sessions introducing electronics textiles as a field of making soft, flexible, wearable electronics. Students will learn techniques by copying swatches as well as producing their own unique designs.

 

In this week’s course, students will be introduced to an overview of the field of electronic textiles, example works in the field as well as materials and technical developments that have made these projects possible. We will go into details on different techniques for making soft/flexible/fabric circuits.

We will also introduce idea of microcontrollers using ATTINY as an example. We will cover simple exercise of opening blink LED example, going over the code basic and uploading to have the first step into Arduino programing.

The exercise for the week will be to replicate/copy the swatch example, program your own ATTINY microcontroller with example code and design a basic circuit using the techniques of your choice. 

We ask each student to create at least one analog fabric sensor and one digital sensor we mention in the course. Then create a fabric circuit using one or more of the connection technique (embroidered circuit, laser cut circuit, vinyl cut circuit) we cover in the course. They can connect the sensors simply with LED and a battery, or connect with programmed ATTINY to give a behavior to the fabric circuit. One can use buzzer speaker instead of LED as an actuator.

Presentation

>>  https://docs.google.com/presentation/d/1ZsBGGfrVjuXvKnbPGTdxCGsX-FldWBmCy7sS10bK0dg/edit?usp=sharing

Links:

Getting Started in Electronics >>  https://docs.google.com/file/d/0B5jcnBPSPWQyaTU1OW5NbVJQNW8/edit

wiki >>  http://wiki.textile-academy.org/fabricademy2017

>>  http://textile-academy.org/

>>  http://fabtextiles.org/tag/fabricademy/

>>  http://docs.academany.org/softacademy-handbook/_book/08_bootcamp.html

Introduction to Electricity

Getting Started in Electronics >>  https://docs.google.com/file/d/0B5jcnBPSPWQyaTU1OW5NbVJQNW8/edit

Meet the Materials

– Meet the multimeter!

– Conductive fabrics

– Conductive threads

– Fusible interfacing

 

Soft Circuit Techniques

Topics covered:

– Different techniques for making soft/flexible/textile circuits

– Hard/soft connections (sewing, soldering, fusing, strain-relief…)

– Soldering with flux on conductive fabric

– Materials, tools

– Trace thickness, spacing

– Solder masks

– Strain relief

– Bend relief

By hand:

– Hand embroidery

– Fusing strips of conductive fabric

*paper electronics techniques*

– cutting and sticking copper tape by hand (Jie Qi)

– Drawing conductive circuits with silver pen (circuit scribe, other one)

By machine:

– Sewing Machine (bobbin thread)

– Machine embroidery

– Laser-cutting conductive fabric (lilypad, leah)

– Vinyl-cutting conductive fabric or copper tape

– Etching copper conductive fabric

– Electroplating conductive fabrics and threads

– Etched flex circuits

– Ordering PCBs online

connection between hard and soft

– Mount components on Protoboard (stripboard) and sew

– curled leg on the components

– Adding rings

– directly soldering on the legs

– press snaps (poppers)

Creating Circuit Designs and Cut-files

– Inkscape

– Illustrator

– Photoshop

– Pen + paper + scan

– Eagle, Kikad, Fritzing

– Silhouette, Roland Cutmaster

Textile Sensors

See:  http://www.kobakant.at/DIY/?cat=26

Interactex – knit electronics database:  http://www.interactex.de/

E-Textile Swatch Exchange:  http://etextile-summercamp.org/swatch-exchange/category/2016/

Assignment 1: LED Circuit

 

 

Microcontrollers, ATtiny Programming

– USB TINY programmer

– Arduino IDE, Blink example, uploading

– explain a bit about the code, show the possibility of modification.

How to upload code to the ATtiny

This post is a summary that covers how to turn your arduino board into an ISP programmer and use it to program an ATtiny85 or 45 8-pin microcontroller.

>>  http://www.kobakant.at/DIY/?p=3742

Assignment 2: ATtiny Circuit

Arduino code:

 https://github.com/plusea/CODE/blob/master/WORKSHOP%20CODE/Fabricademy/ATtiny-code-example/ATtiny-code-example.ino

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

  pinMode(sensorPin, INPUT); // use digital pin number here

  pinMode(speakerPin, OUTPUT);

  pinMode(ledPin, OUTPUT);

}

void loop()

{

  sensorValue = analogRead(sensorPin); // use analog pin number here

  // MAKE SOUND:

  if(sensorValue < 900){
  noiseFrequency = map(sensorValue, 0, 1023, 100, 10000);
  noise (speakerPin, noiseFrequency);
  }

  // FADE LED:
  ledBrightness = map(sensorValue, 0, 1023, 0, 255);
  analogWrite(ledPin, ledBrightness);
}

// MAKE SOUND ON THE ATTINY WITHOUT THE SOUND LIBRARY:
void noise (unsigned char noisePin, int frequencyInHertz) {
  long delayAmount = (long)(1000000 / frequencyInHertz);
    digitalWrite(noisePin, HIGH);
    delayMicroseconds(delayAmount);
    digitalWrite(noisePin, LOW);
    delayMicroseconds(delayAmount);
}

 

MATERIALS AND TOOLS

Materials:

– Conductive fabric copper rip-stop

– Conductive fabric silver stretch

– Conductive thread Karl-grimm copper thread

– Conductive thread statex silver plated nylon

– Conductive yarn LessEMF

– Eeonyx stretch sensor fabric

– Eeonyx non-woven sensor fabric

– Cotton/silk woven non-stretch fabrics

– Cotton Jersey stretch fabric

– cotton thread

– Felt and/or Neoprene

– 3mm thick foam

– Fusible interfacing (Thermoweb Heat’n Bond Ultra Hold Iron-On Adhesive)

– Metal Beads

– Glass/plastic beads (for isolation, hole should be big enough for conductive thread)

– snap press/ poppers (ideally 7mm diameter, if not 10mm) 

– ATTINY85

– 8pin socket

– various resisters

– LED (SMD (PLCC2 and Through-hole)

– speaker/buzzer

– purfboard

– 3V battery

– 3V battery holder (or we make fabric battery holder)

– Flux

– Solder

– single core wire or bare wire

– copper foil sheet

– capton tape or sheet (solder mask)

Tools:

– Sewing needles

– Scissors

– Fabric Scissors

– Iron

– crochet hooks

– Sewing machine*

– knitting mill*

– knitting machine*

– knitting needle*

– laser cutter*

– vinyl cutter*

– Breadboard

– jumper cable

– crocodile clip

– Soldering iron

– multimeter

– thin nose plier

– wire cutter/ knipper

– USB ATTINY programmer

– computer with Arduino IDE

* optional

MATERIAL SAMPLES

USEABLE QUANTITIES of:

Karl-Grimm High Flex 3981

Fine copper fiber plied with synthetic fiber core. Solderable

Producer: Karl Grimm Distributer: Karl Grimm

Shieldex

Silver Plated synthetic thread.

Producer: Statex | Distributer: Statex

SAMPLE SHEETS containing 3x5cm samples of:

CONDUCTIVE FABRICS

Copper Conductive Fabric

Corrosion proof copper-silver plated polyamide ripstop fabric

Producer: Statex

 Distributer: LessEMF

Ripstop Silver Fabric

Pure Silver coated onto nylon RipStop. Comfortable and safe against the skin. Resistivity is less than 0.25 Ohm/sq.

LessEMF

Pure Copper Polyester Taffeta Fabric

Pure copper, tarnish resistant finish. High conductivity, resistivity: 0.05 Ohm/sq.

LessEMF

Silver Stretch Conductive Fabric

Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver

Producer: Statex

 Distributer: LessEMF

VeilShield

Woven 132/inch mesh polyester fibers coated with Zinc-blackened Nickel over Copper for better corrosion resistance. not suitable for prolonged skin contact if you have a Nickel allergy. 70% light transmission. 0.1 Ohm/sq resistivit.

LessEMF

Safety Silk

Natural Silk plus Pure Silver. <1 Ohm/sq.
LessEMF

Soft&Safe Shielding Fabric
70% bamboo fiber and 30% Silver. high conductivity (<1 Ohm per sq). 
LessEMF

SaniSilver
Double side weave. one side is highly conductive (<1 Ohm per sq) pure Silver, the other side is pure cotton (~100 Ohm/sq)
Producer: LessEMF

RESISTIVE FABRICS

Eeontex Non-Woven
Carbon doped Polyester/Nylon with a conductive polymer formulation.
Producer: Eeonyx 
Distributer: Sparkfun
                    
Eeontex Stretch Fabric
A conductive knitted nylon/elastane fabricwith a conductive polymer formulation. Stretch in both direction.
Producer: Eeonyx 
Distributer: Sparkfun

Eeontex Twill Fabric
Woven polyester fabric coated with a conductive polymer formulation.
Producer: Eeonyx 

Conductive Wool
Wool 80% stainless steel fiber 20%. Resistive material. Suitable for felting.
Producer: Bekaert
                    
Velostat
Piezoresistive carbon impregnated plastic sheet material.
Producer: 3M 
Distributor: LessEMF

ESD Foam
Anti-static foam used for packaging material.

CONDUCTIVE THREADS

Karl-Grimm High Flex 3981
Fine copper fiber plied with synthetic fiber core. Solderable                    
Producer: Karl Grimm Distributer: Karl Grimm
                    
Karl-Grimm High Flex 3981 Silver 14/000
Fine copper fiber coated with silver plied with synthetic fiber core. Solderable
Producer: Karl Grimm Distributer: Karl Grimm
                                      
Elitex
235/34 Polyamide plated with silver.
Producer: Imbut GmbH | Distributer: Imbut GmbH
                    
Shieldex
Silver Plated synthetic thread.
Producer: Statex | Distributer: Statex

Bekinox VN
Fine stainless steel fiber plied. Good for heating use.
Producer: Bekaert | Distributer: Bekaert

25% Metal Egypto Color Gold Gimp
Thread wrapped with metal wire
Producer: Bart and Fransis | Distributer: Bart and Fransis
                    
Radio Conductive Thread
90% polyesther SuperTech + 10% 0,035mm Inox Steel thread
Producer: Bart and Fransis | Distributer: Bart and Fransis

RESISTIVE THREADS

Silver Plated Nylon
66 Yarn 22+3ply 110 PET. Resistance: <1000 Ohm/10cm.
LessEMF

Nm10/3 Conductive Yarn
80% polyester 20% stainless steel, light grey.
Producer: Bekaert | Distributer: Bekaert

Silverspun Yarn
87% combed cotton, 5% silver, 5% nylon, 3% Spandex. Highly conductive, about 10 Ohm per inch. The silver is permanently adhered to the yarn and will not wash out. LessEMF
