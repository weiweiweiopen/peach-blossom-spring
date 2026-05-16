---
source: How To Get What You Want / KOBAKANT DIY
title: "Resistive Sensors Overview"
url: "https://www.kobakant.at/DIY/?p=5689"
postId: 5689
date: "2015-06-16T15:33:12"
modified: "2020-05-26T21:57:43"
slug: "eeonyx-sensors"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Resistive Sensors Overview

Source: https://www.kobakant.at/DIY/?p=5689

## Excerpt

This post documents a series of experiments using Eeonyx coated fabrics (called Eeontex) to create various fabric sensors. Eeontex fabrics are electrically conductive and can be coated to produce different resistances. Applications for Eeontex fabrics include electrostatic dissipation (ESD), microwave/radar absorption, resistive and microwave heating, but they can also be used to do a variety […]

## Content

This post documents a series of experiments using Eeonyx coated fabrics (called Eeontex) to create various fabric sensors. Eeontex fabrics are electrically conductive and can be coated to produce different resistances. Applications for Eeontex fabrics include electrostatic dissipation (ESD), microwave/radar absorption, resistive and microwave heating, but they can also be used to do a variety of resistive/piezoresistive sensing. THe electrical resistance of Eeontex fabrics changes both across distance and when strain is applied to the material in the form of pressure of stretch.

Links:

EEonyx >>  http://eeonyx.com/

Code for examples on GitHub >>  https://github.com/plusea/CODE/tree/master/EXAMPLE%20CODE/Resistive%20Sensors

We have examined the following Eeontex fabrics:

Non-woven, non-stretch fabrics:

NW170-SLPA-2K

NW170SQ-SLPA-50K

NW170SQ-SLPA-100K

Stretch fabrics:

LTT-SLPA-2K

LTT-SLPA-20K

LTT-SLPA-60K

LTT-SLPA-100K

LG-SLPA-100K

For later:

Non-woven, non-stretch: NW170-PI-20 (heater)

Twill: TMD-PI-36 (heater)

To construct the following types of sensors:

– Contact switch

– Location/Position (1D – along a line, 2D – across a surface)

– Pressure

– Stretch

– Bend (through pressure, through stretch)

 

To combine the above constructions to build combination sensors for:

– Location & Pressure

– Stretch & Pressure

– Stretch & Location

 

Eeontex coated fabrics

“EeonTex conductive textiles are unique materials made using a proprietary coating technology* developed by a leading textile company.  Individual fibers within a fabric or yarn are completely and uniformly coated with doped polypyrrole (PPY), an inherently conducting polymer.  Almost all fabrics – woven, knitted, and nonwoven – and textured and spun yarns – synthetic or natural – can be coated using the aqueous process. Typical substrates include polyester, nylon, glass, and Kevlar.  While imparting electrical conductivity and a dark color to the substrates, the coating process barely affects the strength, drape, flexibility, and porosity of the starting substrates.  Fabrics are tailor – made for desired resistance, thickness , porosity, surface area, flame – resistance, etc…” (taken from this PDF >>  http://www.marktek-inc.com/doc/EeonTexTDSF1.pdf)

OVERVIEW CHART

 

Contact switch

Location/Position

1D – Along a Line

2D – Across a Surface

Pressure

Through the Material

 

 

Across the Material

 

 

Bend

 

 

 

 

Stretchy Pressure Sensors

 

 

Stretch

Before looking at the resistive properties of the knit Eeontex fabrics, lets look at the knit structure of fabric to better understand how changes in electrical resistance and repeatability of stretch might also be affected by the fabric properties.

Front and back of knit fabric:

  

Knit fabric is produced by pulling a single thread through loops. When knit by hand this is generally done with two knitting needles and a row of loops on one needle is transferred to the other needle one by one and each time a further loop of yarn/thread is pulled through the loop being transferred. When knit by machine this is generally done on a bed of needles where each loop has it’s own needle and every time the carriage passed over the bed of needles it adds one loop to the loop on each needle. For much better explanations, see here:

Hand-knitting >>

Flat-bed machine knitting >>

Due to this knitting process the resulting fabric has different properties in it’s two directions:

– The course direction

– The wale direction

  

The Eeontex knit fabrics are very finely knit fabrics and it can be very hard to see the directions by looking at it closely. The following images show a non-conductive white knit fabric up close to better see the texture/structure of the from and back of a knit fabric.

   

For repeatability of stretch and to better maintain the structure of the fabric, I find it best to design the sensor such that stretch happens in the COURSE direction of the fabric. Stretching the fabric in the WALE direction causes the yarn/thread to stretch and change the size of the loops from which it does not recover as easily.

Stretch in COURSE direction:

 

Stretch in WALE direction:

 

Stretch in COURSE direction (LTT-SLPA-20K): 600K – 150K Ohm [350K Ohm]

  

Stretch in WALE direction (LTT-SLPA-20K): 1.2M – 500K Ohm [700K Ohm]

  

Even though the range of resistance change is bigger in the wale direction, the fabric “stretches-out” over time with repeat stretching.

Single Direction

Multiple Directions

Bend

Via Pressure

Via Stretch
