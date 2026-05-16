---
source: How To Get What You Want / KOBAKANT DIY
title: "Silent Pillow Speaker"
url: "https://www.kobakant.at/DIY/?p=4008"
postId: 4008
date: "2013-02-20T21:43:06"
modified: "2013-03-08T15:47:42"
slug: "silent-pillow"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Silent Pillow Speaker

Source: https://www.kobakant.at/DIY/?p=4008

## Excerpt

This example uses an ATtiny microcontroller (programmed using Arduino!) to playback a melody every time a head is laid on the pillow. The speaker is embroidered with conductive directly onto the surface of the pillow. A magnet is mounted directly behind the coil, inside the pillow is a knit pressure sensor that detects when a […]

## Content

This example uses an ATtiny microcontroller (programmed using Arduino!) to playback a melody every time a head is laid on the pillow. The speaker is embroidered with conductive directly onto the surface of the pillow. A magnet is mounted directly behind the coil, inside the pillow is a knit pressure sensor that detects when a head is resting on it, and on the back of the pillow the microcontroller and 3V coin cell battery are attached.

The circuit in this example does not use any form of amplification, so the speaker is very silent and can only be heard by the person whose ear is resting on the pillow.

Front and back of pillow:

Video

The audio in this video is pre-recorded from another speaker and overlaid over the video, as the embroidered speaker on this pillow is so quiet that only somebody with their ear on the pillow can hear it.

Step-by-Step Instructions

>>  Download booklet PDF (single-sided for screen viewing)

>>  Download booklet PDF (double-sided for print)

Materials

– Attiny microcontroller

– 3V Coin-cell battery

–  Magnet(s)

–  Highly conductive thread for speaker coil

– Knit stretch/pressure sensor

– Fabric and thread (silk, cotton, neoprene, fusible interfacing, thread)

–  Stuffing

Tools

Programming:

– Laptops (participants please bring your own)

– Arduino software

– Arduino boards for programming

– USB cables

– Breadboards

– Jumper wires

– 10uF capacitor

– External power (coin-cell battery holders)

– Speaker

Sewing:

– Sewing needles

– Sewing machine

– Iron and board or surface

– Scissors

– Pinking shears

Soldering:

– Soldering iron

– Solder

– Tweezers

– Wire clippers

– Hot glue gun

Programming

Setting up an Arduino to program an ATtiny chip

For detailed instruction on how to turn your Arduino board into an ISP programmer to program your ATtiny please see the following post:

>>  http://www.kobakant.at/DIY/?p=3742

What you will need:

– Laptop with the Arduino software version 1.0.1 or 0022 installed

– Arduino Uno or Duemilanove (with an ATmega328, not an older board with an ATmega168!)

– USB cable

– ATtiny45 or ATtiny85 (Sparkfun, DigiKey, RS)

– 10 uF capacitor

– Breadboard

– Jumper wires

How a breadboard is internally connected:

How to connect the Arduino and the ATtiny using the breadboard, jumper wires and one 10uF capacitor:

The Code

The code for the ATtiny can be found here:

>>  https://github.com/plusea/CODE/tree/master/WORKSHOP%20CODE/SOFTandTINYpillowSPEAKER

The Circuit Schematic

Looking at the code you should notice that certain variables correspond to pins on the ATtiny microcontroller. To find out which pins are what number, and what they can do (input, output, analog input, PWM…) you can Google the datasheet which will have a diagram of the ATtiny pin out. The following is an illustration of the ATtiny pin outs:

Following is a schematic of the Pillow Speaker circuit. Whereas the schematic is a representation of the circuit, showing how the various components connect, further down in this post you will find the “circuit pattern”, the same circuit sketched as it is sewn onto the pillow.

The Circuit Pattern

>>  Download Pillow Speaker Pattern PDF

Here is the circuit pattern for the Silent Pillow:

 

Close-up of pillow circuit:

Understanding How the Knit Sensor Works

>>  Knit Stretch (and Pressure) Sensor

Video:

Understanding How a Speaker Works

>>  Fabric Speaker

Embroidering the speaker coil can take quite a while, so it is nice to get it done first. But before you start you should understand how a speaker works. A good way to do this is to take apart a commercial speaker. You can find very cheap ones inside sound toys or airplane headphones. When you look inside the speaker you will see that it is made up of a plastic membrane, a very tightly wound coil of very thin wire (magnet wire/enameled wire) and a magnet. The speaker has two contacts, and each of these is connected to one end of the wire coil. The wire may look like it is all touching but intact it is insulated, forcing the electricity to flow through the whole coil to reach the other end. In doing so the flow of electricity through the coil creates a magnetic field around the coil. This magnetic field fluctuates with the frequency of the audio signal. Every time the signal is low the coil looses it’s magnetic field and is not attracted to the permanent magnet, every time the audio signal is high, the coil is attracted to the permanent magnet. Thus the coil and the magnet are repelling and attracting each other very quickly. And because the coil is connected to the plastic membrane every time it moves (repel/attract), it moves the membrane and the membrane moves air creating sound waves that our ears can hear.

The strength of your speaker depends on a few things. The strength of your electromagnet (conductivity of your coil, how many turns the coil has…), the material of your membrane (stiff vs. soft) and the strength of your permanent magnet, as well as the amount of power you run though it.

Video:

Video:

Sewing and Embroidering

Pillow Patterns for front and back side of pillow:

>>  Download Pillow Speaker Pattern PDF

  

Here is a version of the pillow pattern with both sides overlaid:

 

Optional: add fabric backing to reinforce speaker membrane

To improve the quality and volume of your embroidered speaker it can help to stiffen the fabric. Stiffening the fabric also helps keep the turns of the coil apart when you sew them very closely together. But stiffening the fabric also makes it harder to sew. It is a trade-off and up to you if you want to add some fusible interfacing (fabric heat glue) to make your fabric stiffer. The best way to decide is to try both options.

Trace and cut out the 7cm diameter circle from fabric with fusible backing:

Peel away the paper backing before fusing:

Mark the 7cm diameter center circle on the back of the top piece of pillow fabric:

Embroider the Speaker Coil

Thread a needle with the conductive thread:

From front to back, poke the needle with the conductive thread through the center of the top pillow fabric, and pull through to the back:

Thread a smaller needle with regular thread and begin to sew the speaker coil by holding the conductive thread in place using a couching stitch:

Continue to sew around in a tight spiral to fill the center 5cm diameter area. This is there the magnetic field of the permanent magnet will have the most effect. When you have finished sewing the tight spiral, slowly widen out into an expanding spiral and end close to one of the corners of the top pillow fabric:

Video of sewing the speaker coil using a couching stitch:

To finish the speaker coil stitch the end of conductive thread you have been working with through to the back side and with the big needle stitch the center end of conductive thread underneath the backside coil threads towards an opposite corner:

The back of your pillow should look something like this:

Magnet Pouch

Trace and cut out the 5cm diameter circle for the magnet pouch:

Test Your Speaker!

Sew First Pillow Seam

Video of sewing the first pillow seam:

Sketch and Sew Circuit

Coin-Cell Battery Pouch

Because the gap between positive and negative sides of a coin-cell battery is so small, it can easily happen that this gap is bridged by the same piece of conductive thread, causing a short circuit of the battery. To avoid short circuiting the battery, the contact that goes to the negative side of the battery should be isolated where it passes by the “gap” so that it will not touch the positive side of the battery. The following illustrations show what is meant:

Trace and cut stencil for coin-cell battery pouch to neoprene:

Tie knot in the end of a piece of conductive thread and stitch from center of neoprene circle to edge, letting the conductive thread run inside the neoprene where it is isolated:

Should look something like this:

Then attach leads to the pillow:

Sew down the battery pouch by stitching around the edges. Make sure to leave a wide enough opening so that the battery can be inserted and removed but does not fall out:

Attach Knit Pressure Sensor

Stitch conductive leads to the back of the fabric and then simply tie knots between the conductive thread and the resistive yarn of the sensor:

Front and back of circuit:

Back of embroidered circuit:

Illustration of front of circuit:

 

Sew Together Pillow

Lay the two pillow fabrics together with the right sides facing in. Sew around the edges, but leave about a 10cm opening to turn the pillow right-side out:

Turn inside out:

Front and back of pillow:

Soldering

Soldering the ATtiny onto your Embroidered Circuit

Program your final code to the ATtiny and then gently bend out legs of microcontroler to a right angle. Apply solder to the legs of the microcontroller that you want to connect to the thread traces:

Apply solder to the tips of the conductive thread and use tweezers to keep the thread ends under control:

Use wire cutters to cut away stray strands:

Solder together any threads that should be connected:

And solder the microcontroller to the circuit:

Finishing Touches

Stuff and Close

Finished Pillow
