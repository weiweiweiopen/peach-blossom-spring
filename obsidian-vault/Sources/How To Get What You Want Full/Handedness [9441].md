---
source: How To Get What You Want / KOBAKANT DIY
title: "Handedness"
url: "https://www.kobakant.at/DIY/?p=9441"
postId: 9441
date: "2022-01-25T16:40:45"
modified: "2022-01-28T12:24:04"
slug: "handedness"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Handedness

Source: https://www.kobakant.at/DIY/?p=9441

## Excerpt

This is a 3 days hands-on workshop held on January 26-28 2022 at the Interface Culture, Art University Linz Austria as a part of a course Fashionable Technology. Schedule:Day110:00 – 11:00 meet the materials11:00 – 13:00 building textile sensors (digital/analog)13:00 – 14:00 lunch break14:00 – 15:00 Arduino intro (students who are not Arduino beginners can […]

## Content

This is a 3 days hands-on workshop held on January 26-28 2022 at the Interface Culture, Art University Linz Austria as a part of a course Fashionable Technology.

Schedule:
Day1
10:00 – 11:00 meet the materials
11:00 – 13:00 building textile sensors (digital/analog)
13:00 – 14:00 lunch break
14:00 – 15:00 Arduino intro (students who are not Arduino beginners can skip)
15:00 – 16:00 connecting sensors with Arduino (serial communication, plotter)
16:00 – 17:00 installing PD, reading Serial communication with PD, simple synthesizers
17:00 – 18:00 Embroidered capacitive sensor, Arduino capsense library

Day2
10:00 – 10:30 Gloves as an Interface introduction
10:30 – 13:00 building gloves
13:00 – 14:00 lunch break
13:00 – 14:00 Reading gloves’ sensor with Arduino/ serial plotter, then into PD
14:00 – 15:00 synthesizing with PD + gloves
15:00 – 17:00 What is machine learning? (short lecture) ml.lib introduction
17:00 – 18:00 Group discussions, AI, machine learning: Is this intelligence?

Day3
10:00 – 11:00 Separate into small groups >> idea generation
11:00 – 13:00 prototype work
13:00 – 14:00 lunch break
14:00 – 17:00 prototype work
17:00 – 18:00 play/ feedback

Day1

Meet the Materials

Highly conductive textile materials
Copper Ripstop Fabric Shieldex Kassel
Company:  Statex
Characteristics: Corrosion proof copper-silver plated polyamide ripstop fabric, < 0.03 Ohms/cm2 surface resistivity.

Shieldex Technik-tex
Company:  Statex
Characteristics: Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver, < 2 Ohms/cm2 surface resistivity (front/visible side). stretchy in one direction

High Flex 3981 7X1 Silver 14/000
company:  Karl Grimm
Characteristic: Very conductive, Solder-able

Elitex Fadenmaterial Art Nr. 235/34 PA/Ag
company:  Imbut GmbH
Characteristic: silver conductive thread (100% polyamid beschichtet mit silber

Materials: Resistive (not so conductive) textile materials

Eeonyx stretch woven carbon resistive
Company:  Eeonyx
Characteristics: Resistive material (2k), knit/ jersey, Stretch in both direction. Can be used to make pressure or stretch sensor

Bekinox 50/2 conductive yarn
Company:  Bekeart
Characteristics: Nm50/2 conductive yarn, 80% polyester 20% stainless steel, light grey

conductive wool
Company: Bekaert
Characteristic: Wool fiber mixed with stainless steel fiber, Suitable for felting

Multimeter

We can not see the electrons flowing. So we can not tell by looking if there is an electrical connection, or how much electrical resistance between one end to the other end of the circuit or a material.
To measure this, we use a tool called multimeter. This will be your friend throughout the workshop. Here is how to use it.

Check connection

  
turn the dial to arrow/sound sign. Place the probe to the to end of the part where you want to check the electrical connection. If there are connection, it will beep.

Check Resistance

 
Turn the dial to ohm mark part. there are few numbers on the ohm part, start from the smallest, or if you know roughly how much it should be, start with closest one. If it is on the diral 200 ohm, it means it will measure the resistance maximum 200ohm. If the resistance is bigger than 200ohm, it shows 1. like in the picture. In this case, turn the dial to bigger maximum range (for example 2000, or 20k (20,000)) to see if you start to see a number.

Here is an example on how to read the measured resistance. The dial is set to 20M ohm (20,000,000 ohm), and you see 2.19 in the display. Where the period is shows the scale (if it is Mega or Kilo or without any scale). Since you are on Mega scale, this is 2.19 Mega Ohm (2,190,000 ohm). This is a bit confusing as if you are on 200k ohm dial and see 3.8, it is still 3.8 Kilo ohm (3,800 ohm). The number on your dial is not a multiplier. It just shows which scale you are in, and what is the maximum reading range.

Tips on working with e-Textile materials

Building Textile Sensors: Digital

We will build a digital sensor/ switches. Digital sensors have 2 states, 1(ON) and 0(OFF) while analog sensors have range of states like “half on” between on and off. The idea is simple. You have two conductors (conductive thread, conductive fabric.. or any material that conduct electricity) that has state of touching each other, or not touching each other.

Here is an example of finger switch. Conductors on each fingers are not electrically connected when your fingers are not touching each other, and when you close your fingers they contact and let the electricity go through.

Building Textile Sensors: Analog

Now we try analog sensor. Analog sensors shows range of inputs, like faders or volume knobs on your audio devices. It has range of states. The introduced textile sensors change its electrical resistance. Instead of ON (no resistance) or OFF (infinitely big resistance) it has the range in between the two.

 detailed tutorial here>>

 example with knitting mills>>

Pure Data >>  http://puredata.info/downloads

Serial communication example for Pure Data >>  https://cloud.servus.at/s/b6frY5n5o2DMEsc

Pure Data examples >>  https://cloud.servus.at/s/6FfN3sM8XMGnR6k

How to make sensor glove >>  https://www.kobakant.at/DIY/?p=9331

Datagloves Overview >>  https://www.kobakant.at/DIY/?p=7114

E-Textile Datagloves Overview >>  https://www.kobakant.at/DIY/?p=6730

int val1;
int val2;
int val3;
int val4;

void setup() {
  // put your setup code here, to run once:
 Serial.begin(9600);
}

void loop() {
  // read analog pins. check which pins you connected your sensors!
  val1 = analogRead(A1);
  val2 = analogRead(A2);
  val3 = analogRead(A3);
  val4 = analogRead(A4);

  // serial communication
  Serial.print(val1);
  Serial.print(" ");
  Serial.print(val2);
  Serial.print(" ");
  Serial.print(val3);
  Serial.print(" ");
  Serial.print(val4);
  Serial.print(" ");

  // auto range fixing lines. comment out when you communicate with PD
  Serial.print(0);
  Serial.print(" ");
  Serial.print(1023);  

  // end of package
  Serial.println();

  delay (10);
}
