---
source: How To Get What You Want / KOBAKANT DIY
title: "All your segments are belong to me"
url: "https://www.kobakant.at/DIY/?p=5227"
postId: 5227
date: "2014-10-09T15:57:11"
modified: "2014-11-07T12:52:38"
slug: "all-your-segments-are-belong-to-me"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# All your segments are belong to me

Source: https://www.kobakant.at/DIY/?p=5227

## Excerpt

Saturday October 11th 2014, 9:30-17:00 as part of the Wear It Festival in Berlin, Germany In this workshop we will build our own segment displays and attach them to our bodies, turning ourselves into platforms for personal signage. What text would you like to display on yourself?

## Content

Saturday October 11th 2014, 9:30-17:00 as part of the  Wear It Festival in Berlin, Germany

In this workshop we will build our own segment displays and attach them to our bodies, turning ourselves into platforms for personal signage. What text would you like to display on yourself?

Segment Displays are made to display alpha-numeric characters, such as the 7-segment display which can depict the numbers 0-9, and the 14- and 16-segment displays which can also show all letters of the alphabet. When designing our own segment displays we do not need to stick to the shapes and arrangements of the industry. Individual segments can be any shape, size and colour we want. We can create and design new segmented fonts for displaying text on our own segment displays.

In order to build our own wearable segment displays we’ll use an ATtiny microcontroller and the  Charlieplexing (n*(n-1)) technique to control up to 20 individual LED lights from it’s 5 i/o (in, out) pins. We will make a little breakout board for the ATtiny microcontroller so that we can sew the LED connections into fabric and then solder the surface mount (SMD) LEDs directly to the conductive thread.

This workshop covers a variety of skills including: reading datasheets, understanding charlieplexing, soldering, sewing, programming, designing and building wearable technology.

This workshop was inspired by the  DressCode Workshop approach of celebrating LEDs, rather than shunning them as kitsch or light pollution, and by  Trafopop‘s work in making wearable LED displays for animated

graphic designs.

Workshop Details:

Date & Time: Saturday October 11th 2014, 9:30-17:00

Location: Betahaus, Berlin

Participants: 10 max.

Cost: 60 Euro

Sign up for this workshop  here!

Video:

Workshop Documentation

Links:

Download PDF of handout >>  www.plusea.at/downloads/print/AllMySegment-handout.pdf

Photos >>  https://www.flickr.com/photos/plusea/sets/72157648348822379/

Code >>  https://github.com/plusea/CODE/tree/master/WORKSHOP%20CODE/All%20my%20segments%20are%20belong%20to%20you/a_tiny14Segments

Charlieplexing >>  http://en.wikipedia.org/wiki/Charlieplexing

ATtiny programming using an Arduino >>  http://www.kobakant.at/DIY/?p=3742

ATtiny 7-segment display (another example) >>  http://www.kobakant.at/DIY/?p=3800

Examples of industry 7-, 14- and 16-segment displays:

Workshop Handout

Download PDF of handout >>  www.plusea.at/downloads/print/AllMySegment-handout.pdf

Charlieplexing

Charlieplexing >>  http://en.wikipedia.org/wiki/Charlieplexing

This is the circuit schematic that shows how all the LEDs are connected to the microcontroller pins.

Charlieplexing Chart

Based on the 5 pins of the microcontrolelr that we use this chart maps all their possible combinations to segment numbers.

Colour-coded ATtiny pins and Breakout Circuitboard

Charlieplexed Segments

The Alphabet in Segments

Custom Flex PCB

Plotted Flex PCB >>  http://www.kobakant.at/DIY/?p=5371

Make sure you place the ATtiny into the socket on the flexible circuitboard the right away around. The + pin of the chip should line up with + pin of the socket. The following illustrations show the various layers that the flexible circuitboard is made up of.

Front and back of custom flex PCB made for workshop:

Code

Code >>  https://github.com/plusea/CODE/tree/master/WORKSHOP%20CODE/All%20my%20segments%20are%20belong%20to%20you/a_tiny14Segments

 case #:  //case # = segment #

    // set the pins NOT connected to the LED in the segment to INPUTS:

    pinMode(2, INPUT);

    pinMode(3, INPUT);

    pinMode(4, INPUT);

    // set the pins connected to the LED in the segment to OUTPUTS:

    pinMode(0, OUTPUT);

    pinMode(1, OUTPUT);

    // set the pin connected to the LED’s GND pin to LOW:

    digitalWrite(0, LOW);

    // set the pin connected to the LED’s (+) pin to HIGH:

    digitalWrite(1, HIGH);

    break;

Neoprene 3 x AAA Battery Pouch

Instructions for similar pouch >>  http://www.kobakant.at/DIY/?p=52

Materials and Tools

Materials:

– ATtiny microcontroller:

>>  http://www.segor.de/#Q%3DATtiny85-20PU%26M%3D1

>>  http://www.conrad.com/ce/en/product/154219/Atmel-ATTINY45-20PU-Microcontroller-256Byte-DIL-8?queryFromSuggest=true

– 8-pin chip socket:

>>  http://www.conrad.com/ce/en/product/189502/8-Pin-IC-Socket-762mm-Pitch/?ref=detview1&rt=detview1&rb=2

– Custom flexible PCB:

>>  http://www.kobakant.at/DIY/?p=5371

– Wire

– Conductive thread (Karl-Grimm):

>>  http://karl-grimm.com/

>>  https://www.etsy.com/listing/114198338/solderable-conductive-thread-thinner?ref=shop_home_feat_4

– Red 1206 SMD LEDs (3.2 mm × 1.6 mm):

>>  http://www.highlight-led.de/bauelemente/leuchtdioden/smd_leds/smd_1206/10x_smd_led_1206_rot_klar_typ_wtn-1206-100r_i1102_3787_0.htm

datasheet >>  http://www.media.highlight-led.de/products/documents/pdf/26006020.pdf

– 3 x AAA batteries

– 3 x AAA holder:

>>  http://www.kobakant.at/DIY/?p=52

For battery pouch:

– Neoprene

– Conductive fabric

– Fusible interfacing (iron-on glue9

– Metal snaps

Tools:

–  USBtinyISP programmer for ATtiny

– Soldering irons

– Scissors

– Paper, pencils, coloured pencils, erasers

(- Sewing machines)

Inspirations…

Dominic Wilcox’s Personal Subtitles:

>>  http://variationsonnormal.com/2009/08/19/personal-subtitles/

Jenny Holzer’s Word Art:

>>  http://projects.jennyholzer.com/

7-Segment RGB-LED:

>>  http://www.jave.de/blog2/?p=7

7-Segment Display Matrix Visualizes More Than Numbers:

>>  http://hackaday.com/2013/11/21/7-segment-display-matrix-visualizes-more-than-numbers/

Links

7-segment displays:

>>  https://www.sparkfun.com/products/11406

datasheet >>  http://dlnmh9ip6v2uc.cloudfront.net/datasheets/Components/LED/1LEDYELCC.pdf

single 16-segment displays:

>>  http://de.rs-online.com/web/p/led-displays/7192478/

>>  http://www.segor.de/#Q%3D16Seg57GKsrt%26M%3D1

datasheet PSC 23-11 EWA >>  http://www.digchip.com/datasheets/parts/datasheet/250/PSC23-11EWA-pdf.php

>>  http://www.segor.de/#Q%3D16Seg13GKrt%26M%3D1

datasheet LTP 537 HR >>  http://www.datasheetarchive.com/LTP537HR-datasheet.html

double 16-segment display:

datasheet >>  http://img1.cdn.tradevv.com/Y201201M1186283T1G1340786/NFD-5421ABx-21.pdf

>>  http://www.led-display-manufacturers.com/Dual+Digits+Alphanumeric+Display/

dot-matrix displays:

>>  http://www.segor.de/#Q%3DELM-2881SURWA%25252FS530-A2%26M%3D1
