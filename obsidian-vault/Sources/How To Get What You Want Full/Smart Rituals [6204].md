---
source: How To Get What You Want / KOBAKANT DIY
title: "Smart Rituals"
url: "https://www.kobakant.at/DIY/?p=6204"
postId: 6204
date: "2016-08-08T10:08:28"
modified: "2016-09-04T14:47:20"
slug: "smart-rituals"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Smart Rituals

Source: https://www.kobakant.at/DIY/?p=6204

## Excerpt

A/D/A Festival Hamburg, on Friday, August 26th – Saturday, August 27th. „The goal of building a smart city is to improve quality of life by using technology to improve the efficiency of services and meet residents’ needs“ (from wikipedia) by silently monitoring the city through embedded sensors. In this two-day workshop, us, the citizens, we […]

## Content

A/D/A Festival Hamburg, on Friday, August 26th – Saturday, August 27th.

„The goal of building a smart city is to improve quality of life by using technology to improve the efficiency of services and meet residents’ needs“ (from wikipedia) by silently monitoring the city through embedded sensors.

In this two-day workshop, us, the citizens, we will loudly embrace its smartness and create a series of city-costumes for a data collection. From theatrical stage to pagan rituals, costumes have always had the role to hide its wearer and provide anonymity. Our costumes will instead be equipped with sensors, Smart Textiles and Internet of Things technology allowing the wearer to collect data and send them to the internet by performing a new urban ritual. How anonymous can we be when dealing with data?

During this two days workshop, we will create a series of costumes equipped with various sensors, e-Textiles and Internet of Things technology allowing the wearer to collect data and send them to the Internet by performing a ceremonial gestures. 

To apply for the workshop, please visit the festival page

 http://www.ada-hamburg.de/workshops/smart-rituals-mika-satomi/

OUTCOME

We had 10 participants in total, producing 5 costumes. Together with 2 example costumes I brought in, 7 performers performed the Smart Rituals of data collection on the street of Hamburg as an outcome of the workshop. 

The produced costumes were:

Hairy Monster that detects how noisy the space is, produced by Sina Greinert, Katrin Rieber and Katrin Rieber

 

The Curious twins who count the nice people in the neighborhood, produced by Lilli Berger, Marie Josephine Bouquet and Mareike Brunswick.

 

Flower Fairly that can detect the brightness of the spot, produced by Suse Bohse, John Cheng and Anna Froelicher.

 

and Wooly creature that detects temperature and humidity of the space, produced by Barbro Scholz

 

We went around the street of St. Pauli, near the Fablab (workshop Venue) collecting data and sending them to the Internet on site. You can still check the collected data here >>  http://smart-rituals.herokuapp.com/

  

   

 
 
.flickr_badge_image {margin:0px;display:inline;}
.flickr_badge_image img {border: 0px solid #666666 !important; padding:0px; margin:2px;}
#flickr_badge_wrapper {width:600px;text-align:left}

Photo credit Mika Satomi, Axel Sylvester

Process

-Decide which data you are collecting

-Choose which costume to work on from the pre-made parts, sketch out the design

-Act out the ritual gestures to send (and count)

-Analyze the gesture and plan your eTextile sensor

-Sketch out the connection. Where is the sensor? where is the photon? where is the LED stripe? and how are they connected?

-build sensors

-embed the electrical connection on the costume using conductive fabric and threads

-embed LED stripe

-implement the program for the photon

-Connect all of them and test if it works out

-probably it does not work in the first test. Find out what is not working. It can be the hardware problem, or the program has a mistake.

-Practice your ritual, Pimp up your costume

        

Photos from the workshop process
 
.flickr_badge_image {margin:0px;display:inline;}
.flickr_badge_image img {border: 0px solid #666666 !important; padding:0px; margin:2px;}
#flickr_badge_wrapper {width:600px;text-align:left}

GIFs of costumes created by Lilly Berger

More of her gifs here >>  http://en.gif.ag/

Example Costumes

Meet the Happy Monster and GPS mama

  

GPS mama receives GPS signal and sends its position to the internet as it pauses. The Happy Monster counts “how many lovely People are around” and sends the count to the internet as it points to the sky.

Here is the GPS mama’s sending sequence. Left is the neutral position, and the left (clapping hand) gesture sends its data to the internet.

  

There is a conductive fabric on both of the palms and as she touch both palms together, it makes a contact (contact switch) and lets the microcontroller (the brain) know it is the time to send the data to the internet.

 

Here is how the Happy Monster counts lovely people.

Close both the hands’ index finger tip against the thumb. Keep them closed and lift both of the arms. Then lower the arms. This will count one person.

   

Then when it sends the data, it points up to the sky with right hand.

 

This sequence of gestures is sensed by contact switch on the finger tips and bend sensors under arms.

  

  

sensors for data collection

We want to make 4 costumes that collects data of Climate (temperature/humidity), Noise Level, Brightness and how nice the neighborhood is.

Climate: Temperature Humidity senor

 

Connect yellow cable to 3.3V, blue to GND and white to Digital Pin (example is on D6)

It is this product >>  https://www.sparkfun.com/products/10167

Noise: Sound Detector

 

Connect yellow cable to 3.3V, blue to GND and white to Analog Input pin (example is A2)

The gain is set to 40dB at the moment. You will receive 0- 4029 range number on the analog pin depending on the noise level.

more detail on the sensor here >>  https://learn.sparkfun.com/tutorials/sound-detector-hookup-guide?_ga=1.75387472.331890191.1461702805

Brightness: LDR (Light Dependent Resister)

 

This is a resister that changes its resistance depending on the light amount. Connect one end to GND and the other end to Analog Input pin (example A2).

 

Now you need to add a resister on the breakout board side. Use multimeter to measure the resistance of your LDR when it is exposed to bright light, and when it is in dark. take the middle point (for example, if the bright state is 1k ohm and dark is 10k ohm, take 5k ohm as mid point) and that is the resister you will need.

This resister is called Voltage Divider. For more details, you can check this post >>  http://www.kobakant.at/DIY/?p=6102

Technology Introduction

Basic components of an electronics project

You can imagine how electronics projects could work by comparing how we function. The above example shows a person picking up an apple from an apple tree. He (?I am not sure of this person’ gender…) have already tasted an apple from a same tree, and this was good (tasted sweet). now this person sees a red apple on a tree. He thinks that this apple is probably ripe and decides to pick it.

sensor >> mouth (sweet) eye (red) skin (touch)

actuator >> arm/hand (pick an apple)

microcontroller/ program >> deciding if he should pick the apple or not depending on the information he has gathered.

In our costume project, we have:

sensor >> data collection sensors/ sensor to recognize gestures

microcontroller/ program >> Particle photon board

actuator >> Wifi module on the photon to send data to the Internet/ LED stripe to display the send sequence

 

Particle photon board and its breakout board, Lipo rechargeable battery

  

Breakout board on textile mount. The back side is Velcro to mount on a costume.

Make sure to place the photon with USB socket facing down (to lipo battery pocket side)

eTextile sensors

To detect the gestures, we use e-Textile sensors. For this workshop, we use

Bend Sensor >> http://www.kobakant.at/DIY/?p=20

Tilt Sensor >> http://www.kobakant.at/DIY/?p=201

Knit Stretch Sensor >>  http://www.kobakant.at/DIY/?p=2108

Contact Switch

  

Programming Photon

We use  Particle Photon microcontroller board to read out sensors and connect to wifi. Particle Photon is a microcontroller board with wifi that lets you connect with internet through wifi and upload data to its server easily. You can read more about it from here.

 https://docs.particle.io/guide/getting-started/intro/core/

We have already prepared the first part of the setup guide so it connects to the wifi already. To program your photon, go to this link.

 https://build.particle.io/build

 To connect photon with the costumes, I made a small mount with Velcro on the back with the headder sockets to connect wires from the sensors on your costumes.

  

You can place the mount on your costume and use popper to connect the wires onto conductive fabric.

 

How To

Connecting wire onto conductive fabric

Strip a wire, twist it and make a loop

  

Hook the loop end onto the male popper, and close with female popper that is not fastened to fabrics.

  

eTextile circuit making techniques

Iron-on traces

Apply fusible interfacing (iron-on glue) onto the back of conductive fabric. If you are making electrical connection, make sure the conductivity of your fabric is high (use multimeter to check!)

Cut the conductive fabric into thin stripe.

 

Press it with iron onto the base fabric

 

If you are using silver stretch fabric, make sure it is not too hot. medium (2, silk) setting is good for it.

 

Also, using a piece of fabric or paper to cover the ironing area protects the conductive fabric from getting too hot. Silver conductive stretch is not strong against heat and if you heat it up too much, it changes its color to yellow and becomes non-conductive.

 

Sewing machine traces

Use conductive thread on the bobbin side of the thread. When mounting on the bobbin, make sure it is not too tight. If it is tight, loosen the tension by turning the little screw on the side.

  

Sew it normally. You will see the conductive thread on the bottom side. You can add little conductive fabric on the end to make further connections.

   

Materials

Costume Materials

Here are materials I will bring for the workshop. Imagine how you can assemble a costume out of them… just for your inspiration…

Shiny fabric, See through lace

  

Stretchy jersey, tule

  

Fake Hair, 2nd hand clothes

  

Feather, fringes

  

Scarfs, Neckties

  

Fullbody suit, fake fur fabric

  

ribbons, stuffing

  

Plastic Flower, Lamp shades

  

Mask and a fan

 

Conductive Textiles

Copper Ripstop Fabric Shieldex Kassel

Company:  Statex

Characteristics: Corrosion proof copper-silver plated polyamide ripstop fabric, < 0.03 Ohms/cm2 surface resistivity.

Shieldex Technik-tex P130

Company:  Statex

Characteristics: Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver, 2 Ohms/cm2 surface resistivity (front/visible side). stretchy in both direction

 

Shieldex Technik-tex 

Company:  Statex

Characteristics: Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver, < 2 Ohms/cm2 surface resistivity (front/visible side). stretchy in one direction

 

Silver Ripstop Shieldex Bremen

Company:  Statex

Characteristics: Silver plated polyamide fabric (RS), Parachute silk with 99% pure silver, < 0.3 Ohms/cm2 surface resistivity.

 

Eeonyx non woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), non woven, can be used to make pressure or bend sensor

Eeonyx stretch woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), knit/ jersey, Stretch in both direction. Can be used to make pressure or stretch sensor

 

High Flex 3981 7X1 Silver 14/000

company:  Karl Grimm 

Characteristic: Very conductive, Solder-able

Elitex Fadenmaterial Art Nr. 235/34 PA/Ag

company:  Imbut GmbH 

Characteristic: silver conductive thread (100% polyamid beschichtet mit silber

Nm10/3 conductive yarn

Company:  plug and wear

Characteristics: Nm10/3 conductive yarn, 80% polyester 20% stainless steel, light grey, Surface resistance < 100000ohm

Where to buy them

Many of the electronics components (Photon, sensors, LED strip) comes from US based internet shop  Sparkfun.com and  adafruit.com. As they are US companies, it is a bit tricky to order from Europe, as your package can get stuck at customs or the shipping cost can get very high. You can also check European distributors of these company such as  watterott.com and  Flikto.de

They also have some of the conductive fabric and thread in small quantities.

Photon and mount

We use  Particle Photon microcontroller board to read out sensors and connect to wifi. To connect photon with the costumes, I made a small mount with Velcro on the back with the headder sockets to connect wires from the sensors on your costumes.

  

You can place the mount on your costume and use popper to connect the wires onto conductive fabric.

 

How To

Connecting wire onto conductive fabric

Strip a wire, twist it and make a loop

  

Hook the loop end onto the male popper, and close with female popper that is not fastened to fabrics.

  

eTextile circuit making techniques

Iron-on traces

Apply fusible interfacing (iron-on glue) onto the back of conductive fabric. If you are making electrical connection, make sure the conductivity of your fabric is high (use multimeter to check!)

Cut the conductive fabric into thin stripe.

 

Press it with iron onto the base fabric

 

If you are using silver stretch fabric, make sure it is not too hot. medium (2, silk) setting is good for it.

 

Also, using a piece of fabric or paper to cover the ironing area protects the conductive fabric from getting too hot. Silver conductive stretch is not strong against heat and if you heat it up too much, it changes its color to yellow and becomes non-conductive.

 

Sewing machine traces

You can wind the conductive thread as bobbin thread and use a sewing machine to apply conductive trace on your fabric. You may have to adjust the tension of your bobbin as some conductive threads are quite thick.

  

  

Multimeter

We can not see the electrons flowing. So we can not tell by looking if there is an electrical connection, or how much electrical resistance between one end to the other end of the circuit or a material.

To measure this, we use a tool called multimeter. This will be your friend throughout the workshop. Here is how to use it.

Check connection

 

turn the dial to arrow/sound sign. Place the probe to the to end of the part where you want to check the electrical connection. If there are connection, it will beep.

Check Resistance

 

Turn the dial to ohm mark part. there are few numbers on the ohm part, start from the smallest, or if you know roughly how much it should be, start with closest one. If it is on the diral 200 ohm, it means it will measure the resistance maximum 200ohm. If the resistance is bigger than 200ohm, it shows 1. like in the picture. In this case, turn the dial to bigger maximum range (for example 2000, or 20k (20,000)) to see if you start to see a number.

 

 

Here is an example on how to read the measured resistance. The dial is set to 20M ohm (20,000,000 ohm), and you see 2.19 in the display. Where the period is shows the scale (if it is Mega or Kilo or without any scale). Since you are on Mega scale, this is 2.19 Mega Ohm (2,190,000 ohm). This is a bit confusing as if you are on 200k ohm dial and see 3.8, it is still 3.8 Kilo ohm (3,800 ohm). The number on your dial is not a multiplier. It just shows which scale you are in, and what is the maximum reading range.
