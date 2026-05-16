---
source: How To Get What You Want / KOBAKANT DIY
title: "Bend Sensor Glove"
url: "https://www.kobakant.at/DIY/?p=9331"
postId: 9331
date: "2021-12-15T20:36:37"
modified: "2021-12-15T22:52:52"
slug: "bend-sensor-glove"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Bend Sensor Glove

Source: https://www.kobakant.at/DIY/?p=9331

## Excerpt

This is a quick way to make bend sensor embedded gloves. In this example, I embedded 4 sensors on finger joints, on Thumb, Index finger, Middle finger, Ring finger. I skipped pinky as it is hard to move it alone… (at least for me..) Materials: 2 sheets of 2 way stretch jersey/lycra about 20cmx20cm 1 […]

## Content

This is a quick way to make bend sensor embedded gloves. In this example, I embedded 4 sensors on finger joints, on Thumb, Index finger, Middle finger, Ring finger.  I skipped pinky as it is hard to move it alone… (at least for me..)

Materials:

2 sheets of  2 way stretch jersey/lycra about 20cmx20cm 

1 sheet of 2 way stretch power mesh or similar, about 20cmx 20cm 

stretch silver conductive fabric, fusible interface added on the back, cut in 3-5mm wide stripes

eeonyx resistive stretch fabric, 2.5cm x 6cm

small piece of fusible interfacing (~ about 4cm x 5cm)

small amount of conductive thread (any kind)

5 pole rainbow cable

5 pole header pins

Tool: sewing machine, iron, scissors, pen, A4 paper

  

Trace your hand on the paper.  It is good if you would spread the finger wider. Here, I am tracing my left hand, but the outcome will be a right hand glove.

Draw outline of the glove 5-8mm bigger than your hand trace. This will be the line you stitch.

   

Place your hand back on the paper and mark where your joints are. Cut out the pattern.

Mark where the sensor will be (draw 2 electrodes of the bend sensor). Mark which one will be connected to Analog Input pins (i.e. A0, A1…) and which one is connected to Vcc (i.e. 5V, +..) Then draw the connection to the bottom of the glove. Notice all the + is going to be connected to the same pin. Mark the point where the traces cross. Bottom traces needs to be covered/isolated so you do not make short circuit when placing conductive fabric.

You will need 3 sheets of fabric. 2 of 2 way stretch jersey, and 1 of translucent 2 way stretch powermesh fabric that can fit your glove pattern. Place your paper pattern on one of the jersey fabric, trace the shape using thick felt pen. This line will not be visible at the end. Make sure to mark the finger all the way to the bottom. Mark where the sensor will be placed.

Mark exactly where the sensor is, and how the conductive traces are placed. 

Use window (or some kind of back light) to trace the outline of the glove on the other side. This is very useful when you stitch the fabric at the end.

Cut up the silver stretch conductive fabric. I have prepared the fabric with fusible interfacing on the back before cutting into thin stripe. 3-5mm thickness is enough for the traces.

Cut the stripes into the length of the traces, then peel off the backing paper. You see the fusible interfacing (heat glue, shiny) attached to the conductive fabric. this glue side should be facing the jersey fabric.

Silver stretch conductive fabric is not strong against heat. For domestic irons, setting 2 works good. Place the conductive stripes to where you marked as conductive traces. DO NOT place the lines that crosses other lines yet. After the lines are in place, cover the fabric with ironing fabric and press it well with iron.  Apply pressure and keep pressing for 1-2min. Alternatively you can use heat press to fix the fusible interfacing. I use 130 degrees for 2min with heat press.

Now we need to make a small isolation cover piece so the crossing line does not make short circuit. place a small piece of fusible interfacing on the corner of your jersey, where it is not in use and press it with iron, with the glue side (rubbery shiny side) down, facing the jersey.  Then cut of the piece, peel the backing paper out.

Cut off a small piece that covers your crossing section.

Press this small piece with iron. Now your conductive trace has a little covering. Place the crossing conductive trace on top of the covered section.

It should look like this now.

Cut off Eeonyx resistive stretch fabric in 2.5cm wide stripe. place thin stripe of fusible interfacing on both edges. Peel off the backing paper

Cut out 1.5cm wide pieces (or as wide as your traces at the sensor point). Make sure the fusible interface side is facing the jersey. Press it with iron. 

Pin 3 layers of fabrics together. The traces side (side with conductive fabric fabric and eeonyx) should be facing inward. 

Stitch it together with sewing machine. Use plain stitch (not zigzag or other fancy stitch) with stitch size setting 2.5 -3. Add reverse stitch at the beginning so the stitch does not come out afterwards. Stitch slowly and follow the marking on the jersey fabric. Add reverse stitch when you end the stitching and cut the threads.

Stitch around the hand/glove shape. It does not have to be in one continuous stitch. You can stop and start again 1-2cm before where you stopped. 

At this point, you can put your hand in and see if it fits. If it is too big or too small, you can re-do the stitch.

When you are happy with the size, cut off the extra fabric, leaving 3-5mm outside your stitch line. Between the finger could be quite narrow and tricky to cut off and separate the finger. Be careful when you cut it so you do not cut the stitches. If necessary you can add additional stitch line slightly inner side of the pattern mark so when you cut it off it does not open the stitches.

Now Turn the inside out. The conductive traces are covered with the mesh layer so it does not face directly outside.

Try it on and test if it fits. This time, I noticed one of the finger was too long and too fat at the end. I turned the finger inside out again and went back to sewing machine to stitch it so that the finger becomes a bit shorter and narrower. Make the final adjustment until you are happy.

This is how the glove looks like so far. And all the conductive traces are on the wrist.

At this point, you can connect multimer to the line for + and the line for one of the reading pins using 2 crocodile cables. Check the resistance between the two lines. You can see it changes when you bend your finger.

Crocodile cables are great for testing, but it is too finicky when you have 5 of them on your wrist and you try to move your hand. So for more rigid prototype we can add permanently connected rainbow cable like this one in the picture. Strip the end of the wire for ~1cm and twist it around and make a ring like this.

Thread silver conductive thread to a sewing needle and stitch down each of the wire loops to the conductive fabric ends. This needs a bit of patients. I was in a hurry and did not do a very good job on this one.

If you like, you can use the left over from the isolation cover (jersey with fusible) and cover the wire connection part. This will protect this part to accidentally touching each other when you move. Also it will protect the stitching from getting undone or fraying, especially if you did a bad sewing job like mine:)

Now add a header pin on the other side of the rainbow cable. This will make it easy to stick it onto a breadboard. strip off each wire for about 2mm and apply a bit of solder tin on the wire using soldering iron. Stick the header pin on the breadboard and apply small amount of solder tin on each header pin. Then hold each of the cable’s end where the solder bit is next to the header you want to attach it to and heat them together with a soldering iron. The solder tin on both side should melt and stick together. Repeat this process for all 5 cables.

Now your bend sensor glove is done! Ready to be connected to an Arduino!
