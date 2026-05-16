---
source: How To Get What You Want / KOBAKANT DIY
title: "Chip-Man-Band"
url: "https://www.kobakant.at/DIY/?p=5044"
postId: 5044
date: "2014-05-11T08:32:15"
modified: "2017-05-10T16:00:57"
slug: "chip-man-band-workshop"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Chip-Man-Band

Source: https://www.kobakant.at/DIY/?p=5044

## Excerpt

May 15, 16 2014 at F-A-S-T in Dresden, Germany In this two-day workshop participants will build and perform Chip-Man-Band Costumes – combining wearable electronics with chiptune music and the idea of one-man-band instruments!

## Content

May 15, 16 2014 at  F-A-S-T in Dresden, Germany

In this two-day workshop participants will build and perform Chip-Man-Band Costumes – combining wearable electronics with chiptune music and the idea of one-man-band instruments! 

The workshop covers crash-course introductions to Arduino programming, chiptune music (also known as  8-bit or chip music), soft circuits and textile sensors all for the purpose of building wearable 8-bit instruments. Due to the 8-bit nature of the Arduino microcontroller, the scope for the instruments we will build is 8-bit sound.

Participants, please bring old/used/new clothing and accessories with you to the workshop that you don’t mind cutting up or modifying!

Documentation

Photos

Video

Schedule Day 1

Thursday May 15th 10am – 6pm

Introducing KOBAKANT

Mika Satomi and Hannah Perner-Wilson have been collaborating since 2006, and in 2008 formed the collective KOBAKANT. Together, through their work, they explore the use of textile crafts and electronics as a medium for commenting on technological aspects of today’s “high-tech” society. KOBAKANT believes in the spirit of humoring technology, often presenting their work as a twisted criticism of the stereotypes surrounding textile craftsmanship and electrical engineering. KOBAKANT believes that technology exists to be hacked, handmade and modified by everyone to better fit our personal needs and desires.

In 2009, as research fellows at the Distance Lab in Scotland, KOBAKANT published an online database for sharing their DIY wearable technology approach titled HOW TO GET WHAT YOU WANT.

Our first electronic textile project >>  http://massage-me.at/

Our website >>  http://www.kobakant.at/

Introducing Chip-Man-Band Idea

What was our motivation for planning a workshop on chip-tune music and one-man-band costumes?

Introducing Participants

We’d like to know who you are?

What is your background and what brings you to a workshop like this?

Introducing Arduino

– What is a microcontroller?

– Why Arduino? (access, cost, community…)

Set-up programming environment

>>  http://arduino.cc/en/Guide/HomePage

“Blink” example

– Open example: “Examples –> Basics –> Blink”

– LED is connected to pin 13 and there is an on-board LED already connected to that pin

– How to connect an external LED to pin 13? LED polarity (plus, minus)

– Play with the  delay() function to make the LED blink slower, faster…

Making sound from light?

– Set the LED blink with a delay of 1 microsecond:

digitalWrite(speakerPin,HIGH);

delayMicroseconds(1);

digitalWrite(speakerPin,LOW);

delayMicroseconds(1);

– Take off the LED and replace it with the leads of a speaker

– Why is it making sound?

What is sound?

Explain how a speaker works

In order to translate an electrical signal into an audible sound, speakers contain an electromagnet: a metal coil which creates a magnetic field when an electric current flows through it. This coil behaves much like a normal (permanent) magnet, with one particularly handy property: reversing the direction of the current in the coil flips the poles of the magnet.

Inside a speaker, an electromagnet is placed in front of a permanent magnet. The permanent magnet is fixed firmly into position whereas the electromagnet is mobile. As pulses of electricity pass through the coil of the electromagnet, the direction of its magnetic field is rapidly changed. This means that it is in turn attracted to and repelled from the permanent magnet, vibrating back and forth.

The electromagnet is attached to a cone made of a flexible material such as paper or plastic which amplifies these vibrations, pumping sound waves into the surrounding air and towards your ears. (taken from >>  http://www.physics.org/article-questions.asp?id=54)

Inside a speaker:

Explain sound waves:

Sensors – Analog Input

– Open example: “Examples –> Basics –> AnalogSerialRead”

– Connect a potentiometer (pot) to the analog input pin (see code)

Analog to Digital Conversion (ADC) and the Serial Monitor:

– Lets look at the incoming sensor values using the  Serial monitor

– How can we map these values to a new range?  map()

– How can we constrain these values to a select range?  constrain()

Using a multimeter to measure resistance

Potentiometer (pot):

Voltage divider:

 

“Tone” example

– Open example: “Examples –> Digital –> tonePitchFollower”

– Connect speaker to correct pin or change pin number in code

– Connect  photoresistor (LDR) to analog input pin (see code)

– Connect pull-up or pull-down resistor

>>  http://arduino.cc/en/Tutorial/Tone2

Auduino Synth example

Auduino Synth code >>  http://code.google.com/p/tinkerit/downloads/detail?name=auduino_v5.pde&can=2&q=

– Explain synth code with a potentiometer

– Synth code can only be used with 16MHz microcontroller (UNO, not LilyPad)

What is a breadboard, and how is it internally connected?

How to replace the LDR or the potentiometer with a sensor of our own?

– Crocodile clips!

– – – – – – – – Lunch? – – – – – – – –

Textile Sensors

– How to make your own textile sensors to replace pot

– Hook up ready-made textile sensors to create sounds

– Map incoming range of textile sensors using  map() and  constrain() functions

Activity: make your own textile sensor and map values to sounds

>> Make use of the  How To Get What You Want sensor database!

Materials for making textile sensors

>>  http://www.kobakant.at/DIY/?cat=24

Soft Circuits

– Introduction to making soft circuits

– How to make a hard/soft connector going from the Arduino UNO to conductive thread or conductive fabric

LilyPad Arduino:

LilyPad Simple:

Materials for making soft circuits

>>  http://www.kobakant.at/DIY/?cat=24

Techniques for making hard/soft connections

>>  http://www.kobakant.at/DIY/?p=1272

Claim a body part!

Activity: team-up in pairs and claim a body part to design a sensor for

– Think about all the different movements and gestures you can make with the body part you have selected

– How might you capture these gestures with a textile sensor?

Schedule Day 2

Friday May 16th 10am – 6pm

Activity: work on chip-man-band costumes all day

– Design your textile sensor and decide how you will mount it on the body

– Consider where should the Arduino UNO and 9V battery go?

– How will you connect your sensor to the Arduino UNO?

– Once your sensor is connected, read in the analog values and print them to the serial monitor

– Map your sensor’s range to a good range for the synth sound

– Practice your “instrument”

– 4pm wrap up and tidy up!

– 5pm performance and documentation

Resources

Materials:

– Second hand cloths (local shop)

– Fabrics (local shop)

– Threads (local shop)

– Conductive fabrics (lessEMF)

– Conductive threads (lessEMF)

– Resistive sensor yarn (plug and wear)

– Neoprene (sedochemicals)

– Speakers (local shop)

– TIP122 transistors

– 9V batteries for UNO

– 9V battery connectors

– Power connectors for UNO

– LiPo batteries

Tools:

– Arduinos (UNOs and maybe some LilyPads)

– USB cables

– Computers with Arduino software (participants please bring your own?)

– Aligator clips

– Sewing machine

– Soldering iron

Links

F-A-S-T:

>>  http://f-a-s-t.io/

>>  http://www.hfbk-dresden.de/studium/f-a-s-t/

>>  http://f-a-s-t.io/project/events/kobakant-workshop-arduino-wearables/

Chiptune/Chip Music/8-Bit Music >>  http://en.wikipedia.org/wiki/Chiptune

One-Man-Band >>  http://en.wikipedia.org/wiki/One-man_band

Arduino >> arduino.cc

>>  http://en.wikipedia.org/wiki/Arduino

>>  http://playground.arduino.cc/Main/ArduinoSynth

>>  http://highlowtech.org/?p=1963

Octosynth:

>>  http://www.cs.nott.ac.uk/~jqm/?p=605

>>  https://www.youtube.com/watch?v=GmDzXLHIA9Y

>>  http://www.instructables.com/id/The-Arduino-Synthesizer/

Only on 16MHz board, so not on lilypad:

>>  https://code.google.com/p/tinkerit/source/browse/wiki/Auduino.wiki?r=151

>>  https://www.youtube.com/watch?v=I0CMw6PWIss
