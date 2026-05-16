---
source: How To Get What You Want / KOBAKANT DIY
title: "Shape and Memorize"
url: "https://www.kobakant.at/DIY/?p=7981"
postId: 7981
date: "2019-12-06T18:20:01"
modified: "2022-05-05T18:00:38"
slug: "shape-and-memorize"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Shape and Memorize

Source: https://www.kobakant.at/DIY/?p=7981

## Excerpt

This is a 4 days workshop at the Weissensee Art Academy Berlin as a part of the Textile and Surface design course. The workshop will take place from December 9th to 13th. In this workshop, we will look into using Shape Memory Alloy (SMA), understanding the basics of SMA, how to set/memorize the shape, how […]

## Content

This is a 4 days workshop at the Weissensee Art Academy Berlin as a part of the Textile and Surface design course. The workshop will take place from December 9th to 13th.

In this workshop, we will look into using Shape Memory Alloy (SMA), understanding the basics of SMA, how to set/memorize the shape, how to activate the shape using electricity, how one can control the sequence with Arudino microcontroller and how it can be used in design projects.

Shape Memory Alloy (SMA)

A shape-memory alloy is an alloy that can be deformed when cold but returns to its pre-deformed (“remembered”) shape when heated. …. The two most prevalent shape-memory alloys are copper-aluminium-nickel and nickel-titanium (NiTi), but SMAs can also be created by alloying zinc, copper, gold and iron. …. The shape memory effect (SME) occurs because a temperature-induced phase transformation reverses deformation, as shown in the previous hysteresis curve. Typically the martensitic phase is monoclinic or orthorhombic (B19′ or B19). Since these crystal structures do not have enough slip systems for easy dislocation motion, they deform by twinning—or rather, detwinning. (from  Wikipedia)

Here is a very nice explanation of how SMA works.

Example Projects

So, what can you do with this material?

Here are some examples of Shape memory alloy used in design/art projects.

Animated Vines by Jie Qi

 http://technolojie.com/animated-vines/

video:  https://www.youtube.com/embed/rOrlMOtq3-A

HYLOZOIC SOIL By Philip BEESLEY

 http://www.philipbeesleyarchitect.com/sculptures/0913Medialab_Enschede/index.php

video:  http://www.philipbeesleyarchitect.com/sculptures/0935mexicocity_hylozoicsoil/video.php

Responsive Surfaces by Paula van Brummelen

video: https://www.youtube.com/watch?v=oof544m2X7k

Embedded Movement by Paula van Brummelen

 https://cargocollective.com/paulavanbrummelen

video:  https://www.youtube.com/watch?v=VfP8JmCRRYw

The Culture by Afroditi Psarra and Dafni Papadopoulou

 http://www.afroditipsarra.com/index.php?/on-going/the-culture-series/

video:  https://vimeo.com/123312352

Bacterial Motility by Erdem Kiziltoprak

video:  https://vimeo.com/25375900

Lotus by Daan Roosegaarde

 http://www.studioroosegaarde.net/project/lotus-dome/

video:  https://vimeo.com/18002972

Not SMA, but also interesting moving surface projects

Techno Naturology by Elaine Ng Yan Ling

video:  https://vimeo.com/14522270

Playtime by Ying Gao

 http://yinggao.ca/interactifs/playtime/

video:  https://vimeo.com/33251948

Responsive Knit by Jane Scott

 https://responsiveknit.com/programmable-knitting/

Video:  https://vimeo.com/108646924

Programmable Materials by Self-Assembly Lab

 https://selfassemblylab.mit.edu/programmable-materials/

ShapeShift by Manuel Kretzer

 http://materiability.com/portfolio/shapeshift/

Video:  https://www.youtube.com/watch?time_continue=1&v=4XGVMXCxBNA&feature=emb_logo

Emotional Dialogue by Svenja Keune

video:  https://vimeo.com/108126805

Materials

The materials we have in this workshops are:

Nitinol Wire 0.1mm 60 degrees activation

Nitinol Wire 0.25mm 60 degrees activation

Nitinol Wire 0.25mm 20 degrees activation

Nitinol Wire 0.7mm 60 degrees activation

 Nitinol Foil 0.3mm 50 degrees activation

 Nitinol wires come from here >>

Memorizing

People have different way to memorize, or perform “shape setting”. Some people use open fire (candle light, blow torch…), some uses Kiln oven. You will need to heat it up over 500 degrees and cool down rapidly afterwards to set the shape. I use this method with heat gun to set the shape.

 https://www.kobakant.at/DIY/?p=6682

You can make them into any shape… but if you plan to move surface, some works better than the other. Here are some examples.

Petal Shape:  https://www.kobakant.at/DIY/?p=3396

Jie’s Tutorial >>  http://highlowtech.org/?p=1448

Coil Shape:  https://www.kobakant.at/DIY/?p=5276

Afroditi and Paula’s projects are using coil shape-set SMA

two way effect

The shape setting is only one-way movement. So one needs to think of the combination of materials to create the counter movement to pull the wire back. There is also a way to set two shapes, but we do not have the facility to set two shapes. Here is a video that shows different possibilities of SMA uses.

SMA vs. Gravity/weight :  Animated Vines by Jie Qi

SMA vs. Material tension :  The Culture by Afroditi Psarra and Dafni Papadopoulou

SMA vs. SMA:  Embedded Movement by Paula van Brummelen

Pulley system:  HYLOZOIC SOIL By Philip BEESLEY

connecting with Arduino

To control the activation of the SMA, we have to switch 1-2A current. The output current of the Arudino’s pins is 40mA (0.04A) max so it is far from what the SMA needs for heating up. To switch high current, you can use  transistor switch with low internal resistance mosFET (so the mosFET component does not get hot instead of wire).

N-channel mosFET IRLR8743 Pinout

Transistor switch for SMA using N-channel mosFET IRLR8743

Here is the example of breadboard use with the above circuit. The open red and black cables on the right side is connected to Power bench, red to the + cable of the bench, black to the – cable of the bench.
