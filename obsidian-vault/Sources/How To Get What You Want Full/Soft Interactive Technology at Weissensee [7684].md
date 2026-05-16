---
source: How To Get What You Want / KOBAKANT DIY
title: "Soft Interactive Technology at Weissensee"
url: "https://www.kobakant.at/DIY/?p=7684"
postId: 7684
date: "2019-05-23T10:24:25"
modified: "2019-05-29T15:48:29"
slug: "soft-interactive-technology-at-weissensee"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Soft Interactive Technology at Weissensee

Source: https://www.kobakant.at/DIY/?p=7684

## Excerpt

The second part of the course is about exploring the SMA (shape memory alloy) and textile. We will go over how to train the SMA, how to connect them and how you can trigger them with electricity. We will also connect the SMA samples to Arduino and control the activation with it. The first SMA […]

## Content

The second part of the course is about exploring the SMA (shape memory alloy) and textile.

We will go over how to train the SMA, how to connect them and how you can trigger them with electricity. We will also connect the SMA samples to Arduino and control the activation with it.

The first SMA smocking details are posted here >>  https://www.kobakant.at/DIY/?p=6687

To memorize a shape, SMA needs to be trained. Here is the details on how to train them.

 https://www.kobakant.at/DIY/?p=6682

and here is how to connect them to thread/ sewing connections

 https://www.kobakant.at/DIY/?p=6684

Capacitive Sensor Library

 https://playground.arduino.cc/Main/CapacitiveSensor/

Material resources

SMA/ Flexinol Wire 0.010″ LT  https://www.robotshop.com/en/dynalloy-flexinol-010-lt-actuator-wire.html

The first 2 days is about experimenting with embroidered speakers. You will learn how to make a basic embroidered speaker with copper thread, small introduction to Arduino and tone library, how to read analog sensors and control the sound with it. You will be also introduced to Sound board where you can trigger MP3 files with sensors and play back from the speaker. The second day is to try out your own design of speakers or to combine with sensors and Arduino code.

Here is the detailed tutorial on how to make embroidered speaker.

 https://www.kobakant.at/DIY/?p=5935

Electromagnets

An electromagnet is simply a coil of wire.  It is usually wound around an iron core.  However, it could be wound around an air core, in which case it is called a solenoid.  When connected to a DC voltage or current source, the electromagnet becomes energized, creating a magnetic field just like a permanent magnet.   The magnetic flux density is proportional to the magnitude of the current flowing in the wire of the electromagnet.  The polarity of the electromagnet is determined by the direction the current.  The north pole of the electromagnet is determined by using your right hand.  Wrap your fingers around the coil in the same direction as the current is flowing (conventional current flows from + to -).  The direction your thumb is pointing is the direction of the magnetic field, so north would come out of the electromagnet in the direction of your thumb.  DC electromagnets are principally used to pick up or hold objects.

(from  http://www.coolmagnetman.com/magelect.htm)

An electromagnet is a type of magnet in which the magnetic field is produced by an electric current. The magnetic field disappears when the current is turned off. Electromagnets usually consist of a large number of closely spaced turns of wire that create the magnetic field. The wire turns are often wound around a magnetic core made from a ferromagnetic or ferrimagnetic material such as iron; the magnetic core concentrates the magnetic flux and makes a more powerful magnet.

(from  https://en.wikipedia.org/wiki/Electromagnet)

Magnetic field produced by a solenoid (coil of wire). This drawing shows a cross section through the center of the coil. The crosses are wires in which current is moving into the page; the dots are wires in which current is moving up out of the page.

The magnetic field lines of a current-carrying loop of wire pass through the center of the loop, concentrating the field there

Simple coil experiment

Arduino

You can download the Arduino IDE software from here >>

 https://www.arduino.cc/en/Main/Software

After you install the Arduino, connect the Arduino to your computer and upload the blink example code from File/Examples/Basics/Blink

 https://www.arduino.cc/en/Tutorial/Blink

Here is the tone() tutorial on Arduino site

 https://www.arduino.cc/en/Tutorial/tonePitchFollower

The sound board module we used in the course is this one

Adafruit Audio FX Mini Sound Board – WAV/OGG Trigger 16MB Flash

 https://learn.adafruit.com/adafruit-audio-fx-sound-board/overview

You will need a library to use it with Arduino. you can download it from here, then use library manager/ open zip file from your Arduino.

 https://github.com/adafruit/Adafruit_Soundboard_library

If you want to get sound samples, you can find free sound samples from here.

free sound >>  https://freesound.org/

If you wanted to try more advanced synthesis on Arduino, you can try Mozzi library

 https://sensorium.github.io/Mozzi/

To connect analog sensors (resistive textile material as sensors) you need to create voltage divider circuit. here is the detials >> h ttps://www.kobakant.at/DIY/?p=6102

 

Material resources

Copper Thread :  Karl Grimmm Kupfer Blank 3981 7×1 fach verseilt

Copper Fabric:  Statex Copper Ripstop Fabric Shieldex Kassel

Neodymium Magnet:  neomagnete.de D15mm x 5mm

Arduino:  Arduino Uno

Amplifier:  Adafruit Mono 2.5W Class D Audio Amplifier – PAM8302 or at German distributor  exp-tech

MP3 sound board:  Adafruit Audio FX Mini Sound Board – WAV/OGG Trigger 16MB Flash or at German distributer  exp-tech
