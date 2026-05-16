---
source: How To Get What You Want / KOBAKANT DIY
title: "Stitching Electronics | Woolly Noise"
url: "https://www.kobakant.at/DIY/?p=9540"
postId: 9540
date: "2022-03-17T13:00:58"
modified: "2022-03-24T10:21:42"
slug: "stitching-electronics-wooly-noise"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Stitching Electronics | Woolly Noise

Source: https://www.kobakant.at/DIY/?p=9540

## Excerpt

SVITAVA transmedia art lab, Brno, Czech, March 26/27, 2022 Meet the Material In this workshop, we use two resistive materials as our main materials. Both of them contains 20% of stainless steel fibers which are conductive, and 80% of non conductive fibers (wool or polyester). As the contain only 20% of conductive fiber, it has […]

## Content

SVITAVA transmedia art lab, Brno, Czech, March 26/27, 2022

Meet the Material

In this workshop, we use two resistive materials as our main materials. Both of them contains 20% of stainless steel fibers which are conductive, and 80% of non conductive fibers (wool or polyester).  As the contain only 20% of conductive fiber, it has high electrical resistance, but as you pressure or stretch the material, the overall fibers gets compressed resulting the conductive fibers to create better connection with each other and the electrical resistance gets lower. (in another word, it conducts better). You can find more details in this post >>  https://www.kobakant.at/DIY/?p=8012

Bekinox 50/2 conductive yarn
Company:  Bekeart
Characteristics: Nm50/2 conductive yarn, 80% polyester 20% stainless steel, light grey

conductive wool
Company: Bekaert
Characteristic: Wool fiber mixed with stainless steel fiber, Suitable for felting

We also have some conductive threads to make connections from the thread to other part of the circuit. These threads are coated with silver or made of copper filaments and they are very conductive even when they are pressured or not pressured. You can think of them as wires on conventional electrical circuits.

High Flex 3981 7X1 Silver 14/000
company:  Karl Grimm
Characteristic: Very conductive, Solder-able

Elitex Fadenmaterial Art Nr. 235/34 PA/Ag
company:  Imbut GmbH
Characteristic: silver conductive thread (100% polyamid beschichtet mit silber

Textile sensors: Analog

We will now make textile sensors with resistive textile materials. These sensors will change its electrical resistance as you pressure, stretch and bend them as your action changes the placement of the conductive fibers within the materials. 

Needle Felted pressure/bend sensor

>> https://www.kobakant.at/DIY/?p=7795

Wet Felt pressure/bend sensor

>>   https://www.kobakant.at/DIY/?p=2862 

Circular Knit Stretch Sensors 

>>   https://www.kobakant.at/DIY/?p=2108 

Crochet pressure sensor

>>   https://www.kobakant.at/DIY/?p=1993 

when you finish making sensors, read the resistance across the sensors with multimeters. write down which resistance you read.

Here is an example on how to read the measured resistance. The dial is set to 20M ohm (20,000,000 ohm), and you see 2.19 in the display. Where the period is shows the scale (if it is Mega or Kilo or without any scale). Since you are on Mega scale, this is 2.19 Mega Ohm (2,190,000 ohm). This is a bit confusing as if you are on 200k ohm dial and see 3.8, it is still 3.8 Kilo ohm (3,800 ohm). The number on your dial is not a multiplier. It just shows which scale you are in, and what is the maximum reading range.

Arduino / Teensy

In this workshop, we use  Teensy LC as our  Arduino microcontroller board. Microcontrollers are like small computers, except it does not run operating systems (like windows or macOS). Instead it runs only one program you upload in loop as long as it is powered.

To program Teensy, you will need Teensyduino. Please download from the producer’s webiste >>  https://www.pjrc.com/teensy/td_download.html

In this part, we walk through the following steps:

installing Teensyduino
blink example to test if your computer can upload programs to Teensy
simple code manipulation with  blink example

How to connect textile sensors

To read analog sensors, you need to read them from Analog Input pins. you can see them marked as A0-A9 (14-23) on Teensy LC. Analog Input pins are reading voltage (0v -3.3v) that comes into the pins and converts to digital information (0 – 4095), 12bits information.

The resistive sensors we’ve built changes its resistance when it is pressured/stretched/bent, but it does not produce voltage. We will need to make a small circuit that changes the voltage when you change resistance. This circuit is called  voltage divider. 

The above is a voltage divider made with 2x 1k ohm (1000 ohm) resistors. where the two resisters meet goes to the Analog Input pin to read the voltage. In this case, as the ratio between the two resisters are the same (1:1), it should receive half of the supply voltage (3.3V), which is 1.65V, and the reading should be 2045. Open File/examples/Basics/AnalogReadSerial and see what your A0 pin is reading.

AnalogReadSerial example sketch reads A0 pin >> analogRead(A0);
Then it communicate the value it just read to your computer over Serial communication >> Serial.println(sensorValue);

Upload this example code and see if you can read them. Select Tools/SerialMonitor and it opens a new window where you see the Serial.print from your Teensy.

When you successfully half the voltage and read the AnalogRead as 2045, change one of your resister and see if you can change the voltage coming into your Analog Input pin. What happens when you replace 1K ohm to 10k ohm?

Now, notice your sensors are also resisters. You can use one of the resister as your sensor, and see what your Analog Input pin reads. if you successfully see the numbers on your serial monitor, try pressuring/stretching your sensor. what happens?

here is the detail example of voltage divider with Arduino >>  https://www.kobakant.at/DIY/?p=8649

There is also a nice tool on Arduino/Teensyduino called Serial Plotter. When you select Tools/Serial Plotter, it opens a graph window and your sensor inputs are shown as graph line. This is very useful when you are monitoring your sensor behavior over time, or when you have multiple analog sensors.

One problem of Serial Plotter is that it has auto range function and the range of the graph visualization keeps changing. To avoid this, you can add the following line on the Serial.print lines. This will add one line on 0 (minimum) and another line on 4095 (maximum). space (” “) is printed in between to indicate that they are separate numbers.

 Serial.print(0);
  Serial.print(" ");
  Serial.print(4095);
  Serial.print(" ");
  Serial.println(sensorValue);

Making Woolly Noise

Let’s make some sound with our sensors. but first, we make small experiment to see how the speaker works with Arduino/Teensy.

we add a small speaker connected to pin 11 and GND. Speakers has no polarity. 

Now, we go back to Blink example, change the output pin to 11 (where the speaker is connected) and change the delay between the digitalWrite(led, HIGH); and digitalWrite(led, LOW); really small. This means pin11 will switch output 3.3V and 0V really quickly. What happens? do you hear anything?

This is the principle of how the speakers and sound works. the faster you turn on/off, the sound gets higher. Though it will be very difficult to keep the timing of on/off with delay() function as you start to do more in your program. So instead of doing it manually with delay, there is a function called  tone(); that does exactly what we need.

Now we can use the input from your textile sensor to change how the tone. you can also check  map() function to adjust the frequency you want from the sensor interaction.

Designing your own music interface

how to play it? which body parts?
what material it is made?

You have time until 14:00 to experiment and build your own music interface. at 14:00, we will make show and tell and play music together as one big noise jam!

Extra TIP:

Teensy can act as  usbMIDI device to act as MIDI interface for your computer when you are using music software (i.e. Ableton, Garage band…) or to connect wiht MIDI instruments that works with MIDI keyboards. Choose Tools/USB type/MIDI to use it as MIDI device.

Here are some MIDI function you can use on Teensy.
usbMIDI.sendNoteOn(note, velocity, channel);
usbMIDI.sendNoteOff(note, velocity, channel);
