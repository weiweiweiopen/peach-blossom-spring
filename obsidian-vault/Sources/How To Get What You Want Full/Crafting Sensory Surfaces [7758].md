---
source: How To Get What You Want / KOBAKANT DIY
title: "Crafting Sensory Surfaces"
url: "https://www.kobakant.at/DIY/?p=7758"
postId: 7758
date: "2019-08-28T11:20:19"
modified: "2019-09-06T16:55:03"
slug: "the-sound-of-chirimen"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Crafting Sensory Surfaces

Source: https://www.kobakant.at/DIY/?p=7758

## Excerpt

A part of textiles summer school at DLAB KIT Kyoto Japan. August 19 – 30, 2019 Textiles stand at the forefront of material technology offering a staggering range of characteristics for designers to exploit: touch, fold, stretch, stroke, squeeze, scrub, etc. We manipulate textile surfaces that surround us in various ways. By embedding e-textile materials […]

## Content

A part of textiles summer school at DLAB KIT Kyoto Japan.

August 19 – 30, 2019

Textiles stand at the forefront of material technology offering a staggering range of characteristics for designers to exploit: touch, fold, stretch, stroke, squeeze, scrub, etc. We manipulate textile surfaces that surround us in various ways.

By embedding e-textile materials these surfaces are capable of becoming sensors that detect our interaction and act as soft interfaces for digital devices. Yet, we do not have a wide range of vocabulary for these electronic devices. What will future technologies look, feel, sound, and act like? How will we use them? How will we understand them in our cultural context?

The participants will be introduced to various conductive textile materials and their electrical properties; how to construct sensors using a range of textile techniques (weaving, knitting, crocheting, embroidering, bonding, smocking, felting…) and read them with a microcontroller. We will also experiment with textile speakers and play back sound samples from microcontrollers. The workshop is intended for beginners and does not require previous knowledge in programming and electronics.

The workshop was a part of the Textiles Summer School at the Kyoto Institute of Technology, organized by Prof. Julia Cassim. The school started off with learning about the traditional weaving techniques of the  “Chirimen” fabric, following the visit to the Chirimen weavers in Kyotango region. With a lot of input from this fascinating weaving techniques, intricate crafts skills of the weavers and designs of kimono fabric we were introduced in the Kyotango archive, we started our experiments on e-textiles.

 Photos from the KIT textiles summer school 2019 >>

Tutorials

The workshop started off with the introduction to the e-textile materials we can use during the workshop. Please see the “Materials” section on the bottom for the details.

 Download the workshop booklet PDF from here >> 

  

  

Then the participants were made into group of 4, and made their first fabric sensors following the sample designs.

Fabric Button >>  http://www.kobakant.at/DIY/?p=48

Tilt sensor>>  http://www.kobakant.at/DIY/?p=201

Fabric Bend sensor >>  https://www.arduino.cc/en/Main/Softwaretarget="_blank"> http://www.kobakant.at/DIY/?p=20

bonded bend sensor >>  https://www.kobakant.at/DIY/?p=6835

felted pressure sensor>>  https://www.kobakant.at/DIY/?p=7795

knit stretch sensor >>  http://www.kobakant.at/DIY/?p=2108

  

  

After finishing the sensors, we measured the range of resistance change with multimeter and calculated the mean resistance.

Then we did a physical experiment with  voltage divider using 9V battery.

 

The next step is to learn about  Arduino and read the fabric sensors with Arduino. You can download the Arduino IDE (software) from here >>  https://www.arduino.cc/en/Main/Software

sketch >> File/ Examples/ 0.1Basics/ AnalogReadSerial

You can open the serial monitor (from tools or from right top corner icon) and see which value Arduino is reading. The range of analog reading is 0-1023.

You can also use serial plotter and see the value as a graph. In this case, you want to add the following line to fix the graph range.

Serial.print(0);

Serial.print(“,”);

Serial.print(1023);

Serial.print(“,”);

Serial.println(sensorValue);

We also explored following functions of Arduino

 digitalWrite();

 digitalRead();

 analogRead();

 map();

 tone();

 if()

For people who want to play better sound, you can also look into the Mozzi library >>  https://sensorium.github.io/Mozzi/

The sensors we made are either contact switch (on/off) or resistive sensors that change its electrical resistance when manipulated.

One can also make another type of sensor with e-texitle materials which is called capactive sensor.

Here is the details of capacitive sensor and link to download the capacitive sensor library.

 https://playground.arduino.cc/Main/CapacitiveSensor/

In the workshop, we have also used  sound board mini from adafruit to play back the .wav file. Here is the tutorial from Adafruit about how to use this board >>  https://learn.adafruit.com/adafruit-audio-fx-sound-board/triggering-audio

3D print + fabric

there was some question about 3D printing on fabric. Here is an example of 3D printing on fabric from Lara Grant.

 https://www.instructables.com/id/3D-Printed-Conductive-Snap-Fabric/http://etextile-summercamp.org/swatch-exchange/3d-printing-garments-seams-and-conductive-traces/

 http://etextile-summercamp.org/swatch-exchange/conductive-snap-fabric/

Also this sample from Rachel Freire explores the stretchy 3D print combination with fabric >>  http://etextile-summercamp.org/swatch-exchange/3d-printing-garments-seams-and-conductive-traces/

Group works

The participants were asked to select one fabric sample from the archive and pick a sound sample that corresponds to the impression they get from the fabric sample. Using this sound sample as the starting point, they were asked to design a surface that sense human interaction that represent the sound that one has chosen. 

Group A

      

Group B

     

Group C

        

Group D

        

Group E

       

Materials

Highly conductive textile materials

Copper Ripstop Fabric Shieldex Kassel

Company:  Statex

Characteristics: Corrosion proof copper-silver plated polyamide ripstop fabric, < 0.03 Ohms/cm2 surface resistivity.

Shieldex Technik-tex 

Company:  Statex

Characteristics: Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver, < 2 Ohms/cm2 surface resistivity (front/visible side). stretchy in one direction

 

High Flex 3981 7X1 

company:  Karl Grimm 

Characteristic: Very conductive, Solder-able

Shieldex Shieldex 235/34

company: Statex

Characteristic: Shieldex 235/34 dtex 4-ply HC: Silver plated, 50 Ω/m ± 10 Ω/m

Elitex Fadenmaterial Art Nr. 235/34 PA/Ag

company:  Imbut GmbH 

Characteristic: silver conductive thread (100% polyamid beschichtet mit silber

Materials: Resistive (not so conductive) textile materials

Eeonyx non woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), non woven, can be used to make pressure or bend sensor

Eeonyx stretch woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), knit/ jersey, Stretch in both direction. Can be used to make pressure or stretch sensor

 

Velostat

Company : 3M

We bought it from lessEMF, but 3M produces it and there are more retailers.

Characteristics: Piezo resistive. Changes its resistance when pressed. Good for pressure sensors.

Nm50/3 Bekinox conductive yarn

Company:  Bekaert

Characteristics: Nm50/3 conductive yarn, 80% polyester 20% stainless steel, light grey. You can make stretch/pressure sensitive surface with this.

conductive wool

Company:  Bekaert

Characteristic: Wool fiber mixed with stainless steel fiber, Suitable for felting
