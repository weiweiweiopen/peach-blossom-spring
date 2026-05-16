---
source: How To Get What You Want / KOBAKANT DIY
title: "Puppeteer Costume"
url: "https://www.kobakant.at/DIY/?p=539"
postId: 539
date: "2009-06-05T19:58:43"
modified: "2009-06-30T12:39:32"
slug: "puppeteer-costume"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Puppeteer Costume

Source: https://www.kobakant.at/DIY/?p=539

## Excerpt

Exploring the use of affordable, off-the-shelf materials and basic techniques to create wireless motion capture wearables.

## Content

Exploring the use of affordable, off-the-shelf materials and basic techniques to create wireless motion capture wearables.

>>  Puppeteer Instructable

The idea behind Puppeteer is to create accessible wearable technology for motion-capture. Using off the shelf materials, aiming to create as much of the technology from scratch, collecting and sharing knowledge and DIY instructions. The name Puppeteer comes from the concept of being able to puppeteer or control. In this case, the motion of the performer’s body controls whatever data is relevant to the performance.

So far there have been three completed version of Puppeteer motion-capture costumes that have been used in the following performances:

 Perfect Human,  Language Game at Lemur and  Ein Kleines Puppenspiel.

The fabric pressure sensors integrated in the version of the Puppeteer costume were made from two layers of conductive fabric with a layer of ex-static in between (see  Flexible-fabric-touchpad Instructable). These layers are sandwiched between two layers of neoprene to offer a certain amount of stability and thus more regular data. The patches of conductive fabric are “ironed-on” to the neoprene using fusing. The layer of ex-static, which is taken from the black bags used to package or store sensitive electronic parts, lies between the layers of conductive fabric, preventing direct contact. The neoprene is sewn together around the edges keeping everything in place.

The sensors work such that a current of 5 volt runs from the microcontroller (we are using  Arduinos) into one of the conductive patches of the sensor. When pressure is applied to the touchpad, by pushing the layers together or by bending the sensor, the ex-static layer lowers its resistance. The lower the resistance of the ex-static, the more current can flow to the other side, reaching the other patch of conductive fabric which leads back to an input in the microcontroller. Thus the current reaching the microcontroller input varies with the pressure applied to the sensor. This change in pressure can be mapped to an angle between two bones of a virtual puppet.

Depending on which bones the sensor is addressing, the software running on the computer (we are using  Processing) that receives this data needs to know the minimum and maximum angle for this sensor, and also the direction or the segment of the sin circle. 

For example, the sensor under the armpit offers maximum current (minimum resistance of the ex-static) when the arm is at the body’s side. When the arm is stretched up then the sensor will not be bent and the current flow at a minimum (the resistance of the ex-static at its max).

In this first version of Puppeteer each side of the fabric touchpads is connected via a wire to the main plug, which is situated at the lower back of the body. From the main plug a 3 meter cable leads away from the body to the microcontroller which interprets the electric signal before sending it to a laptop via USB.

In all twelve sensors were integrated in the suit at the joints, six on either side of the body.

Following joint movements were captured:

– Knees

– Hips

– Shoulders

– Underarms

– Elbows

– Wrists

The sensors were sewn into place underneath the tight stretchy fabric of the suit. Depending on what worked best for each joint the sensor was placed either on the inside or the outside of the joint’s bending angle. The wires from the sensors protrude thought the suit and are covered in bright orange fabric to hide the delicate feeling that exposed wires give, they also to emphasize the connections to the joints and are a kind of visual metaphor for the “strings” of a puppet.

The plug at the back of the suit is stable enough to stay attached despite rigorous movement but also allows for the dancer to disconnect herself and walk away. Disconnecting kills the data transfer and reconnecting works without restarting the software.

Perfect Human >>

Language Game at Lemur >>

Puppenspiel >>
