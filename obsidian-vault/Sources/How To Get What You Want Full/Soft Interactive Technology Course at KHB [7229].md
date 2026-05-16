---
source: How To Get What You Want / KOBAKANT DIY
title: "Soft Interactive Technology Course at KHB"
url: "https://www.kobakant.at/DIY/?p=7229"
postId: 7229
date: "2018-05-15T19:05:13"
modified: "2018-05-29T16:56:00"
slug: "soft-interactive-technology-course-at-khb"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Soft Interactive Technology Course at KHB

Source: https://www.kobakant.at/DIY/?p=7229

## Excerpt

Time: May 16,18 2018 10:00- 17:00 (15:00 on 16th) Time: May 30, June 1 2018 10:00- 17:00 Location: eLab, Weissensee Art Academy Berlin This workshop is only open to KHB students This is a series of 4 workshops to learn how one can move textile surface with electricity. In the first workshop, participants will learn […]

## Content

Time: May 16,18 2018 10:00- 17:00 (15:00 on 16th)

Time: May 30, June 1 2018 10:00- 17:00

Location: eLab, Weissensee Art Academy Berlin

This workshop is only open to KHB students

This is a series of 4 workshops to learn how one can move textile surface with electricity. In the first workshop, participants will learn how to build flap wings and flip dots that moves with electromagnets. The second workshop is about experimenting with Shape memory alloy and smocking and pleating of fabric surface. The third and the fourth workshop is to learn how to connect them with microcontrollers (Arduino) and control them with sensors or simple animation sequences.

Controlling with Arduino

Transistor Switch

 

IRB8743 mosFET transistor (N channel) pin configulation

Details of the Transistor switch >>  http://www.kobakant.at/DIY/?p=6118

Breadboard view of the Transistor Switch. SMA or Coil is connected to the Battery*. If you are using 9V battery, make sure to use resistor (3W or 5W) between battery and SMA/coil so you do not exceed maximum current.

Now you can upload the “Blink” example code from File/Examples/Basics/Blink and see if it works. Make sure to adjust the on/off timing of the code so you do not activate the coil/SMA too long.

Breadboard view of the Transistor Switch with a push button. Do not forget to add pull-up resistor to the button. The size of the  pull-up resistor should be 10K ohm or bigger.

Day2

The second workshop is about learning how to train and activate the Shape memory alloy and experimenting with various textile techniques to embed them so they move the textile surface. 

Here is an explanation on what is Shape Memory Alloy:

“A shape-memory alloy (SMA, smart metal, memory metal, memory alloy, muscle wire, smart alloy) is an alloy that “remembers” its original shape and that when deformed returns to its pre-deformed shape when heated. “

from  wikipedia

SMA example project

Animated Vines by Jie Qi >>  http://technolojie.com/animated-vines/

Bacterial Motility by Erdem Kiziltoprak

 Bacterial Motility from  Arden Lev on  Vimeo.

Hylozoic Ground by Philip Beesley

The Culture Dress by Afroditi Psarra and Dafni Papadopoulou

 SMA tutorials

There are several nice tutorial on how to use SMA

 http://makingfurnitureinteractive.wordpress.com/category/course-materials/page/2/

tutorial by Jie Qi

 http://fab.cba.mit.edu/classes/MIT/863.10/people/jie.qi/flexinol_intro.html

For this workshop, we have Flexinol LT 0.01 from robotshop

 http://www.robotshop.com/en/dynalloy-flexinol-010-lt-actuator-wire.html

When you heat up this SMA to 70 degrees, it will change it’s shape to the memorized shape. (Please see this post for how to memorize the shape on SMA >>) You can use hot water or hair drier or candle, anything that reach 70 degrees to change the shape of SMA. When you use candle or open frame to change the shape, be careful to not to heat it up too much. You can retrain the SMA when you heat up too high, and it will forget the shape it was memorized before.

SMA is also conducive. In the datasheet of this SMA, it states 18.5 ohm/m. When you apply electricity and let the current go through the SMA, it will also heat up. See the next section for why.

SMA preparation

SMA remembers 1 shape by training it. Note that it does not remember 2 shapes. When heated over certain temperature, it goes to the shape that is trained, but it will not go to another shape when it is under that temperature. So, when you want to move surface with SMA, you need to plan how it returns to original position from heated state position.

Tutorial on how to train SMA >>  http://www.kobakant.at/DIY/?p=6682

Tutorials on how to connect SMA >>  http://www.kobakant.at/DIY/?p=6684

SMA smocking example 

For the details of how to construct the SMA smocking swatch example, see the below link

 http://www.kobakant.at/DIY/?p=6687

I have also tried with pleated fabric.. the result is not very beautiful, but one can try in this direction as well.

One can also use non trained SMA. In this case one side of the SMA shrinks when heated and creates “U” shape.

Tutorial on moving fabric petals >>  http://www.kobakant.at/DIY/?p=3396

Day1

On the first day of this 4 days workshop series, we investigate on movements we can make with electromagnets. Participants will learn to make the following two swatch samples to learn how electromagnetism works, and how one can apply on textile to move them.

Electromagnetic Flapping Wing

Flapping Wing fabric >>  http://www.kobakant.at/DIY/?p=5900

For the detailed instruction, please go to the below link

Flapping Wing fabric >>  http://www.kobakant.at/DIY/?p=5900

Flip-Dots

Flip-dot fabric >>  http://www.kobakant.at/DIY/?p=5915

 

This sample is inspired by the 1bit textile by Irene Posch and Ebru Kurbak

 http://www.stitchingworlds.net/experimentation/pearl-embroidery-display/

 http://www.stitchingworlds.net/experimentation/1-bit-textile-for-the-swatch-exchange-2015/

Small intro to Electromagnetism 

An electromagnet is simply a coil of wire.  It is usually wound around an iron core.  However, it could be wound around an air core, in which case it is called a solenoid.  When connected to a DC voltage or current source, the electromagnet becomes energized, creating a magnetic field just like a permanent magnet.   The magnetic flux density is proportional to the magnitude of the current flowing in the wire of the electromagnet.  The polarity of the electromagnet is determined by the direction the current.  The north pole of the electromagnet is determined by using your right hand.  Wrap your fingers around the coil in the same direction as the current is flowing (conventional current flows from + to -).  The direction your thumb is pointing is the direction of the magnetic field, so north would come out of the electromagnet in the direction of your thumb.  DC electromagnets are principally used to pick up or hold objects.

(from  http://www.coolmagnetman.com/magelect.htm)

An electromagnet is a type of magnet in which the magnetic field is produced by an electric current. The magnetic field disappears when the current is turned off. Electromagnets usually consist of a large number of closely spaced turns of wire that create the magnetic field. The wire turns are often wound around a magnetic core made from a ferromagnetic or ferrimagnetic material such as iron; the magnetic core concentrates the magnetic flux and makes a more powerful magnet.

(from  https://en.wikipedia.org/wiki/Electromagnet)

Magnetic field produced by a solenoid (coil of wire). This drawing shows a cross section through the center of the coil. The crosses are wires in which current is moving into the page; the dots are wires in which current is moving up out of the page.

The magnetic field lines of a current-carrying loop of wire pass through the center of the loop, concentrating the field there

Simple coil experiment

Electric Motors also work with coil and electromagnetism. Here is a link to a good explanation of the inside mechanism of motors >>  http://www.explainthatstuff.com/electricmotors.html

 

There are small DC motors and flat vibration motors which maybe interesting to embed in textile projects.
