---
source: How To Get What You Want / KOBAKANT DIY
title: "Playing with electronic textiles"
url: "https://www.kobakant.at/DIY/?p=9812"
postId: 9812
date: "2023-01-11T22:30:33"
modified: "2023-04-18T19:46:07"
slug: "playing-with-electronic-textiles"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Playing with electronic textiles

Source: https://www.kobakant.at/DIY/?p=9812

## Excerpt

14+15.4.2023 at the Art and Work Education Conferences Tirol “material matters” This two-day workshop provides an in-depth introduction to the materials as well as design and didactic possibilities of electronic textiles. Participants will develop object-, body- and space-oriented projects involving textile sensors, circuits and sound, which will serve as examples for later use in schools. […]

## Content

14+15.4.2023 at the  Art and Work Education Conferences Tirol “material matters”

This two-day workshop provides an in-depth introduction to the materials as well as design and didactic possibilities of electronic textiles. Participants will develop object-, body- and space-oriented projects involving textile sensors, circuits and sound, which will serve as examples for later use in schools. The workshop will end with a collective discussion of the experiences and what role electronic textiles can – and should – play in the teaching of technology and design.

Hannah Perner-Wilson and Mika Satomi are designers and artists who combine electronics with craft techniques. They develop interactive technologies and objects that emphasize material and process. They have been working together since 2006 and form the art collective KOBAKANT, which develops artistic projects in the field of e-textiles and wearable technology art.

SCHEDULE

Freitag 10:00-17:00

10-11:00 Introductions
11-13:00 Introduction to e-Textiles/exercises
13-14:00 Lunch
14:00-17:00 Group project time

Samstag 10:00-16:00

10-11:00 Intro to Arduino code and programming Teensy 4.0
11-13:00 Group project time
13-14:00 Lunch
14-15:00 Playtime/ Presentations
15-16:00 Discussion
16:00- Cleaning up

 Introduction slide PDF is here>>

overview

We make conductive embroidery and conductive felt touch sensitive interface to play synthesizer on computers. These conductive materials act as  capacitive sensors to detect the touch, and Teensy  microcontroller act as a  MIDI USB interface to send interaction information to your computer over USB cable.

Materials

 

Conductive Threads

Statex 235/36 dtex 4-ply – Nylon 6.6 filament yarn coated in 99% pure silver

 https://www.shieldex.de/

Kupfer Blank 3981 7×1 fach verseilt, Verseilung: 7×1, Lahnumspinnung: 1-fach 

 http://karl-grimm.de/

Conductive Wool

Bekinox W12/18, 20% stainless steel 80% wool

 http://bekaert.com/

More information about various materials >>  Meet the Material

microcontroller

Teensy 4.0

For this workshop, we use Teensy4.0 from  https://www.pjrc.com because they are reasonably priced, and using fast microcontrollers that allows it to act as USB MIDI device or HID (Human Interface Device, like mouse and keyboard). To use Teensy, you will need to use Teensyduino instead of Arduino IDE or add Teensy add-on on your existing Arduino IDE.

Teensyduino  https://www.pjrc.com/teensy/td_download.html

(Scroll down the page and Use Teensyduino from the link Arduino 1.8.x Software Development, follow the instruction guide for Windows/Mac/Linux)

When you finish downloading the Teensyduino, move it to your “Application” folder from your “Download” folder. Then double click the icon in the Application to open the software. For newer Mac, it will ask to authorize the security issue. Open “system preference” and go to “Security and privacy” setting to allow opening the software from third party.
Once you success opening the Teensyduino first time, you will see a blank new sketch (canvas to write a new program).

The sensor techinque we are using is called “Capacitive Sensing” ( https://en.wikipedia.org/wiki/Capacitive_sensing). There are few ways to perform Capacitive sensing on Arduino boards, and this time we are using Fast Touch library by Adrian Freed. To install this library, you can go to the following github link and click “<>code” to show drop down menu and choose “download ZIP”. This will download the zip file of this library to your computer. Then go to open your Teensyduino, and navigate the top menu to Sketch/include Library/add .zip library and navigate to choose the .zip file you have just downloaded. 

Go to  https://github.com/adrianfreed/FastTouch/ and click “<>code” and “download ZIP” to get the library zip file. 

Then open your Teensyduino, navigate to Sketch/Include Library/Add ZIP library, and choose the zip file you have just downloaded.

Now if you go to File/Examples you will see the fastTouch listed in the examples. This means you have successfully installed the library.

For details please see the below documentation from Arduino about how to install libraries. (same for Teensyduino)

 https://docs.arduino.cc/software/ide-v1/tutorials/installing-libraries

Online Synthesizer
 MIDI(Musical Instrument Digital Interface) is a protocol that is used for communication between electrical musical instruments. It contains notes between 0-127, velocity 0-127.

Many software and digital instruments understands MIDI signals. In this workshop we used the below online synthesizer that can also accept MIDI signal.

Cardboard synth (online synthesizer, only works on Chrome browser)

 https://www.gsn-lib.org/apps/cardboardsynth/index.html

and here is how to enable USB MIDI interface on Chrome

 https://www.audiotool.com/product/function/midi/

The keys are now programmed to play midi note 60,62,64, 65,67,69,71,72 an octave from C3. 

Teensy pins 5,7,9,11,14,16,18,20 are used for the touch sensors.

Fabric Breakout board
You can make a fabric breakout by placing the Teensy on a base fabric (i.e. felt) and stitch down the holes with conductive thread and extend the connection to the edge of the fabric. You can go through the Teensy’s pin holes like sewing down button holes. Make sure to make tight and clean stitches for good connection. It is recommended to make knots at the edge of the fabric so it does not touch other pins/connections by mistake.

CODE

example code used in the workshop is posted here

 https://github.com/KOBAKANT/TeensyTouch

For Teensy 4.0, we used teensy40_fastTouch_midi.ino example sketch.

If you want to change the MIDI notes that it plays, change the note number here

The MIDI notes are sent at this part of the code. If you want to change the strength of the note, you can change the second argument (99) of “usbMIDI.sendNoteOn(note1, 99, channel);” to another number (0-127). 

You can use touch sensor value to create note number or velocity so how you touch also changes the pitch and velocity of the sound.

To upload the code, you need to choose correct board, USB type and port from the tools menu.

Inspiration

There are commercial products that does similar things as we did in the workshop. You may find it easier to work with them in classrooms as they are made to be educational purpose friendly.

 https://shop.playtronica.com/

 https://makeymakey.com/

Playtronica especially posts a lot of nice examples, tutorials on how you can connect USB MIDI device with various kind of music softwares on computers and also on iPads.

 https://shop.playtronica.com/pages/tutorials#/collection/4449

They also share information about online MIDI software. We found the cardboard synth that we used in the workshop from this list as well. Perhaps you can find better suiting software for your class.

 https://shop.playtronica.com/pages/for-playtron

German:

Spielen mit elektronischen Textilien

Dieser zweitägige Workshop gibt eine vertiefte Einführung in die Materialien sowie gestalterischen und didaktischen Möglichkeiten elektronischer Textilien. Die Teilnehmer:innen entwickeln objekt-, körper- und raumorientierte Projekte die textile Sensoren, Schaltkreise und Sound beinhalten, die als beispielhaft für den späteren Einsatz in der Schule dienen sollen.

Der Workshop endet mit einer kollektiven Diskussion der Erfahrungen und welche Rolle elektronische Textilien im Unterricht im Fach Technik und Design einnehmen können – und sollen.

Hannah Perner-Wilson und Mika Satomi sind Designerinnen und Künstlerinnen, die Elektronik mit handwerklichen Techniken kombinieren. So werden interaktive Technologien und Objekte entwickelt, die Material und Prozess betonen. Seit 2006 arbeiten sie zusammen und bilden das Kunstkollektiv KOBAKANT, das künstlerische Projekte im Bereich E-Textilien und Wearable Technology Art entwickelt.
