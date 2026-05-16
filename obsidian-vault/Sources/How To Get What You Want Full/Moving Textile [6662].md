---
source: How To Get What You Want / KOBAKANT DIY
title: "Moving Textile"
url: "https://www.kobakant.at/DIY/?p=6662"
postId: 6662
date: "2017-04-26T11:51:01"
modified: "2017-05-01T12:28:22"
slug: "moving-textile"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Moving Textile

Source: https://www.kobakant.at/DIY/?p=6662

## Excerpt

Time: April 27,28 2017 10:00- 17:00 as a part of Weissensee Art Academy Berlin, Soft Interactive Technology 2 course Location: eLab, Weissensee Art Academy Berlin In this 2 days workshop, we will explore methods to move textiles with electricity using SMA (Shape Memory Alloy) and electromagnetism. On the first day, we will explore materials, techniques, […]

## Content

Time: April 27,28 2017 10:00- 17:00

as a part of Weissensee Art Academy Berlin, Soft Interactive Technology 2 course

Location: eLab, Weissensee Art Academy Berlin

In this 2 days workshop, we will explore methods to move textiles with electricity using SMA (Shape Memory Alloy) and electromagnetism. On the first day, we will explore materials, techniques, structures and how it can be embedded in textile to actually move them effectively. On the second day, we will connect the result of our exploration with Arduino to control them with sensors.

The workshop is a part of Textile and Surface Design course at the Weissensee Art Academy Berlin. There are no requirements for previous knowledge on electronics or programming, but you will need to be registered at the Weissensee Art Academy to take the course.

Here are 3 examples of moving textiles we will work on in this workshop.

SMA smocking

SMA smocking >>  http://www.kobakant.at/DIY/?p=6687

Electromagnetic Flapping Wing

Flapping Wing fabric >>  http://www.kobakant.at/DIY/?p=5900

Fabric Speaker

Embroidered Speaker >>  http://www.kobakant.at/DIY/?p=5935

SMA Shape Memory Alloy

“A shape-memory alloy (SMA, smart metal, memory metal, memory alloy, muscle wire, smart alloy) is an alloy that “remembers” its original shape and that when deformed returns to its pre-deformed shape when heated. “

from  wikipedia

Here is a very nice tutorial on how to use SMA

 http://makingfurnitureinteractive.wordpress.com/category/course-materials/page/2/

or this very nice tutorial by Jie Qi

 http://fab.cba.mit.edu/classes/MIT/863.10/people/jie.qi/flexinol_intro.html

For this workshop, we have Flexinol LT 0.01 from robotshop

 http://www.robotshop.com/en/dynalloy-flexinol-010-lt-actuator-wire.html

When you heat up this SMA to 70 degrees, it will change it’s shape to the memorized shape. (Please see this post for how to memorize the shape on SMA >>) You can use hot water or hair drier or candle, anything that reach 70 degrees to change the shape of SMA. When you use candle or open frame to change the shape, be careful to not to heat it up too much. You can retrain the SMA when you heat up too high, and it will forget the shape it was memorized before.

SMA is also conducive. In the datasheet of this SMA, it states 18.5 ohm/m. When you apply electricity and let the current go through the SMA, it will also heat up. See the next section for why.

A small intro to electricity

(the below explanation comes from “ Getting Started in Electronics” by Forrest M. Mims III)

Electricity, Potential and Current

 

This is a Lithium atom. Lithium atoms have 3 electrons that encircle a nucleus of 3 protons and 4 neutrons.

– Electrons have a Negative electrical charge

– Protons have a positive electrical charge

– Neutrons have no electrical charge

   

Normally an atom has an equal number of electrons and protons. The charges cancel to give the atom no net electrical charge. It is possible to dislodge one or more electrons from most atoms. This causes the atom to have a net positive charge. It is then called a positive ion. If a stray electron combines with a normal atom, the atom has a net negative cahrge and is called a negative ion.

Free electrons can move at high speed through metals, cases and a vacuum. Or they can rest on a surface.

A stream of moving electrons is called an electrical current. 

Ohm’s Law

 

conductor

 

Here, there are two important laws to remember.

V = I x R and P = V x I

When you apply electricity to a circuit, lets say 5V power to a circuit that has 100 ohm resistance. Then how much current will flow?

5V = ?I x 100 ohm –> I = 5V/100 ohm

so, 0.05 Ampere or 50mA will flow through this circuit.

Now, if we had 10cm SMA (18.5 ohm/m -> 1.8 ohm theoretically), and if we connect 9V battery, what happens?

9V = ?I x 1.8 ohm –> 5A will flow through.

But wait a second, the spec sheet said the maximum current recommended is 1050mA. So this is way too much. In this case, we can add extra resistance in the circuit to limit the flowing current to 1050mA.

9V =1.05A x ?ohm –> 8,57 ohm

The SMA is only 1.8ohm, so we need to add extra 6.7 ohm.

To be on the safe side, we can add a bit more (or limit the current a bit more) and say 8ohm to add. Now, quite a lot of current will go through this resister so we can not use normal resister we have a the lab. we will need big 3W or 5W resisters.

Actually Watt is representing the power it consumes. Heat is also a power. If you want to know how much it heats up, we can calculate Watt/Power. (ok, it is quite complicated to calculate actual temperature change from watt, but we can see if it is going to heat up quick or not, roughly).

W(P) = I x V –> W = 9V x 1.05A –> 9,45 watt

Ok, so much of a calculation. but the important thing is to know how much voltage you can apply to your SMA so it does not exceed the maximum current (otherwise it will burn!). and in the case you are using fixed power source (i.e. 9V battery), you need to calculate which resister you need to add so you can limit the current flow in your circuit.

SMA smocking example 

For the details of how to construct the SMA smocking swatch example, see the below link

 http://www.kobakant.at/DIY/?p=6687

I have also tried with pleated fabric.. the result is not very beautiful, but one can try in this direction as well.

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

Electromagnetic Flapping Wing

We can move pieces of fabric by using electromagnetism and a permanent magnet.

For the detailed instruction, please go to the below link

Flapping Wing fabric >>  http://www.kobakant.at/DIY/?p=5900

Speakers

Speakers also work with electromagnetism. Here is a diagram of a speaker.

or read this article >>   http://www.explainthatstuff.com/loudspeakers.html

You can use coil wire (isolated) or conductive thread (not isolated) or even conductive fabric to create your own coil on fabric can make a fabric speaker. You will need to place a strong magnet near the coil so that the coil repels from the magnet as it receives the sound signal.

 

 

Controlling with Arduino

Transistor Switch

IRB8743 mosFET transistor (N channel) pin configulation

Details of the Transistor switch >>  http://www.kobakant.at/DIY/?p=6118

Breadboard view of the Transistor Switch. SMA or Coil is connected to the Battery*. If you are using 9V battery, make sure to use resistor (3W or 5W) between battery and SMA/coil so you do not exceed maximum current.

Breadboard view of the Transistor Switch with a push button. Do not forget to add pull-up resistor to the button. The size of the  pull-up resistor should be 10K ohm or bigger.

Breadboard view of the Fabric Speaker (top speaker connected directly to the battery*) with transistor, which is amplifying the direct output from Arduino’s pin. The second speaker (not connected in this diagram) is the monitoring speaker when debugging. If you want to debug your code, connect it to your output pin directly. We used a photocell (light sensor) in the tutorial as an analog sensor. Resistive sensors ( stretch sensor,  pressure sensor) are all connected the same way as the light sensor ( voltage divider) with one fixed resistor.

*In the course, we used 9V batteries.
