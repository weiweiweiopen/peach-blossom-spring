---
source: How To Get What You Want / KOBAKANT DIY
title: "Tie-Poly Leggings and Dataglove"
url: "https://www.kobakant.at/DIY/?p=7823"
postId: 7823
date: "2019-09-14T14:21:27"
modified: "2022-01-27T14:41:19"
slug: "tie-poly-leggings"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Tie-Poly Leggings and Dataglove

Source: https://www.kobakant.at/DIY/?p=7823

## Excerpt

A pair of leggings and a glove made conductive (with piezoresistive properties) via a technique of polypyrrole polymerization, using tie-dye technique to create areas of non-conductivity.

## Content

A pair of leggings and a glove made conductive (with piezoresistive properties) via a technique of polypyrrole polymerization, using tie-dye technique to create areas of non-conductivity.

This work was done in collaboration with Cedric and Paul at the University of Saarbrücken in August 2019. And would not have been possible without the recipe from Anna.

CREDITS:  The Counter Chemists, Ana C Baptista, Cedric @ datapaulette, Hannah Perner-Wilson, Paul Strohmeier

DOCUMENTATION:

Counter Chemists

>>  https://counterchemists.github.io/

PolySense: Augmenting Materials with Electrical Functionality (using In-Situ Polymerization).

>>  https://counterchemists.github.io/files/PolySense.pdf

CCC Camp video

>>  https://media.ccc.de/v/Camp2019-10375-make_your_tech_and_wear_it_too

Micro – Polymerization >>  https://www.flickr.com/photos/plusea/albums/72157710884689521

Polymerization >>  https://www.flickr.com/photos/plusea/albums/72157710354823622

Tie-Poly Leggings >>   https://www.flickr.com/photos/plusea/albums/72157710685191162

Tie-Poly Datagloves >>  https://www.flickr.com/photos/plusea/albums/72157710838047002/with/48731152298/

Tie-Poly Leggings

“hippie slide-control”

Making-of:

These tie-poly leggings were made for the purpose of demonstrating the in-situ tie-die style polymerization of the monomer pyrrol with the polymerization agent XXX on a pair of leggings.

In their most basic setup, the leggings have force sensitive resistance areas at the knees. this information is sent over wifi to a computer running an application that translates knee bend into forward and backward arrow key presses.

These functional leggings are actually made up of 4 layers:

+ under-leggings with sensor circuit traces and snap connections to skirt

+ over-leggings with sensor areas

+ skirt with snap connections from skirt to i/o board and pouch for battery

+ i/o board with snap connections to sensor circuit traces via skirt

 

 

KNEE BEND TEST

streight knee/relaxed sensor: 442 K Ohm

 

bent knee/strained sensor: 310 K Ohm

 

The decision to polymerzie leggings came for these reasons:

– on the size-scale of fabrics we were polymerizing, leggins represent a medium-to-large piece of fabric which provided us with an interesting challenge/test of scaling up our process.

– leggings are an iconic item of clothing associated with the tie-dye technique and hippie fashion, allowing us to make a visual reference to one of the (hi)stories behind what we are doing.

– for some time i’ve been thinking I need to make myself a piece of use(less) wearable technology to wear when i present my work to help me demonstrate my idea of “make your tech and wear it too” – and a pair of leggings that allow me to control my presentation by bending my knees seemed perfect.

The decisions I made of how to apply the tie resist technique to create separated polymerized regions on different parts of the leggings were made amid a myriad of influences (possibilities, requirements, constraints) that  I have tried to organize into the following categories of influence:

– electrical functionality: capturing bend of the knees, touch to the thighs, stretch of the crotch

– aesthetics: appealing distribution of black and white, large and small surface areas, quality of lines. elegance of functional solution as all-in-one, robustness

– use of resources, elegance/efficiency of process: to save poly material by tying off any regions that would not be needed for sensing and combining this decision with the aesthetic decisions.

– opportunities (not constraints) of the technique: binding always has to take place around the material, lending itself to create lines and circular shapes.

 

From many possibilities to actual implementation

After a late-night attempt at trying to solve the entire circuitry within the polymerized leggings – accounting for traces from sensor regions to a central point where a connector could be mounted and integrating voltage dividing resistors as well – I decided to only solve for the sensing regions (squeeze, pressure, stretch) in the tie-poly leggings and to solve the traces and resistors separately. Thus the Tie-Poly Leggings are only the outer-layer of a two-legging layering system. The under-leggings [] solve for the conductive traces that lead to the sensor regions, and a break-out pouch [] connects these to the xOSC wireless i/o module or a wired TeensyLC. Metal snap connectors make for a removeable connection between the under-leggings and the pouch.

Techniques:

In-Situ Polymerization >>  http://www.kobakant.at/DIY/?p=7826

Tie-Poly Resist Technique >>  http://www.kobakant.at/DIY/?p=7825

4 LAYERS:

Polymerized Over-Leggings

These leggings were tie-polymerized in order to achieve both visually and electrically seperated areas of black polymerization and conductivity.

the original intention was the sense bending of the knees via stretch of a polymerized circle on knit4 fabric over the front of knee. initial tests showed this fabric to work well for the purpose, but in the final version the fact that the marble object inside the knee region used to achieve the polymerized circle interfered with the thorough polymerization of the fabric, rendering it sufficiently useless for this purpose, while in comparison the back region of the knee was well polymerized and could be used to sense bend of the knee via compression of the fabric behind the knee.

made of:

1- bamboo & elastan (Karstadt)

2- viscose & elastan (Karstadt)

materials were selected because:

– in the initial tests they showed to polymerize well (meaning the black polypyrrol appeared to adhere to the fibers since very little black rubbed off after only a single rinse (1min under cold running water with light mechanical rubbing of the material against itself).

– the resistance range (after 1hour polymerization) was ca. < 500K Ohm / sq. (to be bellow range of body/skin resistance).

– 1’s compression sensing characteristics yielded a range of 100 K Ohm (light press) – 20 K Ohm (hard press) with 5mm wide electrode strips spaced 2mm apart running parallel on same side of the material (see FIG).

– 2’s stretch sensing characteristics yielded a range of 100 K Ohm (relaxed state) – 20 K Ohm (stretched) when measured between 2cm long electrodes spaced 2cm apart (see FIG).

OVER LEGGINGS (front and back)

  

Electrode Under-Leggings

4 electrodes sewn as strips of stretch conductive fabric travel from along the front waistband in pairs to the backs of the knees. the spacing between the paired electrodes is smallest in two areas that i wanted to sense compression of the fabric from bend at the knee and hip. unfortunately, in my first tie-dye attempt i forgot to to leave the hip region free for polymerization and this the sensor function in this region is not working. But next time!

made of:

– cotton and elastan (pink) – selected for it’s 2-way stretch, thinness (not to produce extra bulk) and comfort (soft to touch and natural fiber blend).

– Shieldex® Technik-tex P130, silverized lycra, 78% Polyamide + 22% Elastomer, 99% pure Silver – selected for it’s 2-way stretch and high conductivity (< 2 Ohms/square).

UNDER LEGGINGS (front and back):

  

Mini-Circuit Skirt

sewn from a woven black cotton fabric. short so that the leggings remain as visible as possible. with pockets to contain the 5V power-bank and additional presentation props. and 4 pairs of metal snap connectors. Each pair of snaps is electrically connected with a short strip of Technik-tex P130, and one snap connects to the electrode terminals on the under-leggings, the other connects to a removable i/o board broken out into a soft circuit made by sewing copper thread (Karl-Grimm) into leather to make connections between an xOSC mounted via low-profile headers on a protoboard [see FIG].

SKIRT:

 

i/o Wireless Board

an xOSC mounted via low-profile headers on a protoboard. The xOSC streams the readings from the analog input pins connected to the two knee sensors via OSC to a nearby computer. The computer runs a Processing sketch that uses simple threshold detection to determine knee bend when the sensor reading passes the threshold (this can be solved much more reliably using absolute change as the sensor values drift over time!). The Robot library is used to trigger the RIGHT and LEFT_ARROW key presses so that the leggings control the the slides in a slide-show.

WIRELESS i/o (x-OSC, front and back):

  

connecting:

 

WIRED option

 

connecting:

 

CONNECTIONS BETWEEN UNDER- and OVER LEGGINS and SKIRT:

 

 

 

EARLY SKETCHES

 

 

Tie-Poly Dataglove

“hippie gesture-recognition”
