---
source: How To Get What You Want / KOBAKANT DIY
title: "Fish Scale Sensor"
url: "https://www.kobakant.at/DIY/?p=6135"
postId: 6135
date: "2016-07-07T17:12:59"
modified: "2016-07-07T18:49:11"
slug: "fish-scale-sensor"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Fish Scale Sensor

Source: https://www.kobakant.at/DIY/?p=6135

## Excerpt

This sensor is inspired by the “design” of fish scales and bird feathers: how single elements are repeated, and how it allows the main body to bend smoothly by sliding over the others. The scale in this sensor is made with Eeonyx non-woven conductive textile. The carbon is infused on non woven textile in order […]

## Content

This sensor is inspired by the “design” of fish scales and bird feathers: how single elements are repeated, and how it allows the main body to bend smoothly by sliding over the others.

 

The scale in this sensor is made with Eeonyx non-woven conductive textile. The carbon is infused on non woven textile in order to maintain 20k ohmm per sq. The size of the scale can vary. I made them around 3cm by 4cm, measuring aprox. 10k ohm from one end to the other.

When laying flat, electricity flows through series of scales from one end of the sensor to the other, adding the resistance of each scale. This is similar to potentiometer or slider. When bent inward, the scale touches each other in shorter distance resulting the resistance across to become lower. When bent outward, the scale touches further away, or dose not touch at all, resulting higher resistance or discontinuity.

The reading of this sensor is not smooth, but it gives a unique combination of analog sensor (slider) and digital sensor (contact switch) affect.

 

Example Project

I developed this sensor to use as a part of motion capture costume for performers. The sensor does not give smooth data, but instead gives a big interrupt when the surface angle becomes too big. The combination of range of value and switch like behavior can be actively used for some applications.

  

Making of the Sensor

materials

-Eeonyx non-woven resistive fabric 20K ohm/sq

-Conductive fabric

-Conductive thread

-Fusible interfacing

-non conductive base fabric

-non conductive thread

Step by step

Prepare the each scale. Cut out the Eeonyx non-woven into 3cmx 4cm square (or any size you like) Trim the top into round shape and add 2.5-3cm slit from the bottom side.

 

Alternatively, you can use vinyl cutter to cut out the shape from Eeonyx, especially if you need to make a lot of scales.

 

Here is my cut settings of Eeonyx non-woven for Silhouette Portrait.

Cur out a small triangle fusible interfacing. Place it next to the slit on the Eeonyx scale and press it with an iron. Peal off the backing paper.

 

 

Fold one of the flap over the fusible interfacing. It will make the scale to curve into 3D shape. Press with iron to fix the fold.

 

Cut away the folded end to make a smooth curve. It will look like this.

 

Place two small pieces of conductive fabric on the base fabric. This will become a contact post for the sensor. The shape and placement can vary depending on your design.

 

Fix the scales onto base fabric. Balance the placement so it forms the fish scale like structure. Use normal thread (i.e. cotton) on the sewing machine. Here, I am using normal running stitch.

 

 

Now, time to make the electrical connection. Wind a bit of conductive thread on a bobbin and set it as bottom bobbin thread. The top thread can stay as normal cotton thread.

 

Flip the fabric with scales, so that the scales are now facing down. Stitch the first scale’s connecting point and continue to one of the conductive fabric you’ve placed earlier. Do the same to the last of the row scale as well. Now you have electrical connection to the first and the last scale so you can measure the resistance between the scales.

 

 

When reading with multimeter, it is a bit tricky as multimeters are quite slow (at least the one I have) and it seems to move all the time. It is the best if you hook this up with  “Graph” example of Arduino/processing. You can observe the nice carve and jump as you move the textile.
