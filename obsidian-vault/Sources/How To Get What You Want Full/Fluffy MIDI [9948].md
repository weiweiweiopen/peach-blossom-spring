---
source: How To Get What You Want / KOBAKANT DIY
title: "Fluffy MIDI"
url: "https://www.kobakant.at/DIY/?p=9948"
postId: 9948
date: "2024-06-12T11:59:53"
modified: "2024-06-25T11:33:03"
slug: "fluffy-midi"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Fluffy MIDI

Source: https://www.kobakant.at/DIY/?p=9948

## Excerpt

Date: June 19/20 2024, 18:00- 21:00Location: RADIONA, Zagreb, Croatia In this two evening workshop, Mika will introduce how you can turn stuffed animals into digital musical instruments. Soft flexible familiar objects turn into MIDI interfaces which you can connect with your favorite synthesizers. The magic is made with e-textile materials: embroidery, needle felting, crochet… choose […]

## Content

Date: June 19/20 2024, 18:00- 21:00
Location:  RADIONA, Zagreb, Croatia

In this two evening workshop, Mika will introduce how you can turn stuffed animals into digital musical instruments. Soft flexible familiar objects turn into MIDI interfaces which you can connect with your favorite synthesizers. The magic is made with e-textile materials: embroidery, needle felting, crochet… choose your textile weapons. Our childhood teddy bear is as intelligent as artificial intelligence, when you name it! Technology is there for us to make things with, and not the other way around.

The technique we explore in this workshop is capacitive sensing with conductive textile materials. We will use preprogrammed Teensy microcontroller boards to turn our object as a USB MIDI interface that works for any MIDI synthesizers. If you are interested in the programming, the code will be open source and you can get an explanation of how the code works inside. You will get to bring your creation home so you can further experiment with it!

The workshop is intended for EVERYONE, from beginners to experts. If you have no idea how to stitch fabrics, or how to work with electronics… you are welcomed! 

Number of Participants: up to 10

What to bring:

Laptop (we can use free online synthesizer or MIDI musical software) or MIDI instruments (if you have)
Stuffed animal (if you have, we will also prepare some)
Any other textile materials you want to use for your project (we will also have some here)
Your favorite textile tools you want to use (scissors, needles, crochet hooks… so on, if you have)

Overview

In this workshop, we modify stuffed animals and other textile objects to our desired designs and shapes, then we add e-textiles (conductive thread and conductive wools) to add a capacitive sensor on it. The Teensy microcontroller board read these sensors and send MIDI signal over USB cable. When you connect this fluffy interface to MIDI software on computer (for example, garage band), it plays sound like MIDI keyboards!

Materials

e-Textile materials we use are:

Conductive Threads
Statex 235/36 dtex 4-ply – Nylon 6.6 filament yarn coated in 99% pure silver
 https://www.shieldex.de/
Kupfer Blank 3981 7×1 fach verseilt, Verseilung: 7×1, Lahnumspinnung: 1-fach
 http://karl-grimm.de/
25% Metal Egypto Color Gold Gimp 150 meter/cone
 https://www.bart-francis.be/

Conductive Wool
Bekinox W12/18, 20% stainless steel 80% wool
 http://bekaert.com/

Microcontroller
Teensy 4.0
 https://www.pjrc.com/store/teensy40.html

Alternatively, we used Adafruit Flora
 https://www.adafruit.com/product/659

We use Teensy microcontroller boards, because they can act as USB MIDI devices. Unfortunately Arduino use other kind of chip and can not do this function. With Adafruit Flora, you can use TeeOnArdu package to turn it as USB MIDI device. For this details, please read this post >>  https://learn.adafruit.com/midi-drum-glove/code

Capacitive Sensor

“capacitive sensing is a technology, based on capacitive coupling, that can detect and measure anything that is conductive or has a dielectric constant different from air.”  (from  Wikipedia)

To do this with Arduino, you can use capSence library. Here is a detailed explanation on how it works >>  https://playground.arduino.cc/Main/CapacitiveSensor/

In this workshop, we use  FastTouch library by Adrian Freed. I introduce this instead of usual capSence library because you do not need to use a resister between two pins… this makes it faster to build it. You just need to connect conductive material/ antenna to the pin you are using as a capacitive sensor.

Unfortunately, FastTouch library does not work with Flora (yet!). so if you are using Flora, please add extra resister (2M ohm) between two pins.

Designing the Interface

Now this is the fan part. Let’s get creative and design your music interface. You can take the parts from stuffed animals we prepared, or you can use the textile objects you brought in. I propose to make some remix/hack on the stuffed animals to see if you can get interesting shapes/images/symbols. Sometimes it can get quite strange. Play around and find your shape.

How to make a capacitive sensor

A capacitive sensor is basically an antenna, an electrically conductive material that is connected to the pin you are reading as a capacitive sensor. This can be even a crocodile cable, aluminum foil, or even a strawberry (as long as they are wet and conductive!). In this workshop, we use conductive thread and wool to make the sensors (and feel free to experiment with other materials). 

You can stitch conductive thread directly and make a line to touch, or you can needle felt conductive wool to make additional touch points. As the stuffed animal I used for this example was hairy, conductive thread got buried under the hair and I could not touch them. So, I used conductive wool and made connection between the wool and Teensy with conductive thread.

If you are not familiar with sewing, one of the hard part is to make a knot on the thread. Here is a tutorial video I found on internet (and there are a lot more, you can search the ones that suits you), you can watch and practice few times and you are ready to go.

and for tie off (end knot), you can do it like this. (Actually I do it like the above one but on fabric… I guess everyone does it differently)

Then for needle felting… it is just about poking many times and make sure not to poke your own fingers;) Again, you can find many tutorials. Here is one example.

Circuit Connection

Once you added all the sensor conductive thread/wool, then we can start connecting the end of the thread to Teensy (or Flora) pins. When you connect, make sure that you make a tight stitch around the pin holes and make sure that thread does not touch the neighboring holes or threads. make a end time few stitches away from the board. Cut off the extra thread so it does not touch the neighboring thread.

The pins used on the Teensy4.0 on the workshop codes are 4,6,8,10, 15,17,19,21

MIDI interface and Synthesizer

 MIDI (Musical Instrument Digital Interface) is a protocol that is used for communication between electrical musical instruments. It contains notes between 0-127, velocity 0-127.
Many software and digital instruments understands MIDI signals. In this workshop we used the below online synthesizer that can also accept MIDI signal.

Cardboard synth (online synthesizer, only works on Chrome browser)
 https://www.gsn-lib.org/apps/cardboardsynth/index.html

and here is how to enable USB MIDI interface on Chrome
 https://www.audiotool.com/product/function/midi/

There are also a lot of (free) midi synthesizer software, like Garage Band on Mac, or  Firebird2 on windows. If you have synthesizer app on tablets/ipad, you can get a USB adapter and play it from there as well.

At the moment, the sensors are assigned to musical note 60 (C3),62,64,65,67, 69,71,72. If you like, you can change it from the code and upload to your microcontroller.

CODE

To upload codes on Teensy, you need Teensyduino. You can get it from here >>  https://www.pjrc.com/teensy/td_download.html
(Scroll down the page and Use Teensyduino from the link Arduino 1.8.x Software Development, follow the instruction guide for Windows/Mac/Linux)

To use FastTouch library,  you need to download it from here >>  https://github.com/adrianfreed/FastTouch/

The details of how to install it is described on  this post under “microcontroller”. 

Example code used in the workshop is posted here
 https://github.com/KOBAKANT/TeensyTouch
The examples used in this workshop are “touchMidi_teensy” and “touchMidi_flora”

You can download/open the code and change the note number, pin number, threshold of the sensor.. so on. You can check this post, CODE part to see the details of where to change >>  https://www.kobakant.at/DIY/?p=9812

instead of MIDI note on/off (which is equivalent to pressing MIDI piano keys)  , you can send control parameters (which is equivalent to turning knobs on MIDI controllers). 

Instead of usbMIDI.sendNoteOn(); and sbMIDI.sendNoteOff(); use usbMIDI.sendControlChange(control, value, channel); function.

For example, your sensor reading is 34 (as an example), and you want to send this as control number 2 for channel 1 then you can add in your code 

usbMIDI.sendControlChange(2, 34, 1);

The control number is between 1-128, and the value is 0 – 127, channel 1-8 range. Make sure that your value stays within the range. For this, you can use map() function and constrain() function to make sure your sensor reading data stays within the range when you convert it.

// read sensor value of pin4 to val1 variable. this is already included in the example code at the start of the loop
val1 = fastTouchRead(4);

// make new variable value1, reading on pin4 ranges from 0-200 (for example) and is converted into the scale 0-127
int value1 = map(val1, 0, 200, 0, 127);

// make sure that the value1 stays within the range of 0-127
value1 = constrain(value1, 0, 127);

// send the value1 as control number2 on channel1
usbMIDI.sendControlChange(2, value1, 1);

Inspiration

There are commercial products that does similar things as we did in the workshop. You may find it easier to work with them in classrooms as they are made to be educational purpose friendly.
 https://shop.playtronica.com/
 https://makeymakey.com/

Playtronica especially posts a lot of nice examples, tutorials on how you can connect USB MIDI device with various kind of music softwares on computers and also on iPads.
 https://shop.playtronica.com/pages/tutorials#/collection/4449

They also share information about online MIDI software. We found the cardboard synth that we used in the workshop from this list . 
 https://shop.playtronica.com/pages/for-playtron

from the workshop
