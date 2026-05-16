---
source: How To Get What You Want / KOBAKANT DIY
title: "Breathing Belt"
url: "https://www.kobakant.at/DIY/?p=8171"
postId: 8171
date: "2020-04-14T16:07:40"
modified: "2020-05-02T10:55:57"
slug: "breathing-sensor-corsete"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Breathing Belt

Source: https://www.kobakant.at/DIY/?p=8171

## Excerpt

Very simple solution for capturing the movement of the chest or stomach breathing using a stretch sensor knit from a stainless-steel & polyester yarn “sensor yarn”. Photos >> https://www.flickr.com/photos/plusea/albums/72157713915361228 HOW THE SENSOR WORKS The stainless steel fibers in the yarn are short, and the electrical resistance between them is high (when relaxed <1M Ohm). And […]

## Content

Very simple solution for capturing the movement of the chest or stomach breathing using a stretch sensor knit from a stainless-steel & polyester yarn “sensor yarn”.

Photos >>  https://www.flickr.com/photos/plusea/albums/72157713915361228

HOW THE SENSOR WORKS

The stainless steel fibers in the yarn are short, and the electrical resistance between them is high (when relaxed <1M Ohm). And when you stretch the yarn the resistance goes down bellow 1K Ohm (depending on the length of yarn you are measuring across).

MATERIALS AND TOOLS

steel + polyester blend yarn from bekaert

>> bekaert.com/

silver thread from karl-grimm:

>> karl-grimm.de/

strong elastic

It is important that the elastic you use is strong so that it will contract when you breathe out, even though there is the friction of the band against your skin or clothing.

a band or belt

In these photos I use a simple cotton strap and small buckle but you can also use a much thicker & sturdier strap. Even cut up an old belt.

(a buckle)

regular sewing thread

sewing needle

knitting needles or spool knitter

scissors

 

CUT

the elasic shorter than the length of your sensor folded in half. you fold it in half only to have both ends on the same side to make it more convenient to connect to later on.

 

INSERT

the elastic into the band.

 

SEW

with conductive thread to attach the sensor to the band but also to make an electrical connection between one end of the sensor and a pad further along the band.

Repeat for the other end of sensor.

Then sew the mid-way point down on the other side of the elastic with some regular thread. Make sure the sensor is taught (slightly stretched) even in the relaxed position. This will give you more stable sensor readings because when the thread is completely relaxed (in it’s resting state) the fibers wiggle around making contacts and changes in resistance.

 

 

 

FINISHED

after adding on some buckles or you can also simply tie the ends of the band together, you are done! And should have something that looks like this:

 

TEST

use a multimeter to measure the resistance-range of your sensor.

Write down:

R(min): resistiance in resting state: ______________

R(max): resistiance in stretched state: ______________

Choose a value for building the  VOLTAGE DIVIDER. You will need to build this to translate change in resistance into change in voltage, because the Arduino can only read a change in voltage!

R(voltage divider): pick a value mid-way between your min and max!

CONNECT

to the pads with gator clips and wire them to an arduino. If you have a 10K, 50K or 1MOhm potentiometer, use this to build your voltage divider. This way you can tweak Otherwise you can

 

CODE

use this Arduino code example to analogRead(); the values of the sensor:

>>  https://www.arduino.cc/en/tutorial/AnalogInput

BREATHE

and see what values you get.

 

RELATED WORK

Made for Boris’s Trombone Breathing Vest:

>>  https://www.kobakant.at/KOBA/trombone-breathing/

>>  https://www.flickr.com/photos/plusea/41226413250
