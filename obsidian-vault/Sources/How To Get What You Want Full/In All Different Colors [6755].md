---
source: How To Get What You Want / KOBAKANT DIY
title: "In All Different Colors"
url: "https://www.kobakant.at/DIY/?p=6755"
postId: 6755
date: "2017-05-16T00:52:31"
modified: "2017-05-18T16:02:58"
slug: "in-all-different-colors"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# In All Different Colors

Source: https://www.kobakant.at/DIY/?p=6755

## Excerpt

Time: May 19,20 2017 10:00- 17:00 as a part of Weissensee Art Academy Berlin, Soft Interactive Technology 2 course Location: Print Lab and eLab, Weissensee Art Academy Berlin In this second part of the Soft Interactive Technology 2 course, we will have 2 days of experimenting with thermochromic screen printing on textile and designing the […]

## Content

Time: May 19,20 2017 10:00- 17:00

as a part of Weissensee Art Academy Berlin, Soft Interactive Technology 2 course

Location: Print Lab and eLab, Weissensee Art Academy Berlin

In this second part of the Soft Interactive Technology 2 course, we will have 2 days of experimenting with thermochromic screen printing on textile and designing the color change sequences. 

On the first day of the workshop, we start with screen printing experiments at the print lab. For this workshop, we have thermochromic Leuco dyes from B&G color change. For the material resources, please see this post >>  http://www.kobakant.at/DIY/?p=3183

Thermochromic inks change color from color to colorless when it reaches certain temperature. The color changing temperature differs depending on kinds of ink. For example, if you have black 37°C ink printed on white fabric, then in room temperature, your fabric is black. And when you heat it up over 37°C, it changes to white fabric as the black pigment turns colorless.

You can read more about Thermochromism here >>  https://en.wikipedia.org/wiki/Thermochromism

Printing Thermochromic 

When working with thermochromic ink, it is important to understand how the color change works and learn how to plan the color mixing.

For example:

Blue(T) + Yellow —- Green >> Yellow

Yellow(T) + Blue —- Green >> Blue

Blue(T) + Yellow(T)– Green >> transparent

*(T) is thermochromic ink

Here is an assignment for the workshop.

Color match 1:

Make exactly same color Thermochromic ink and Normal pigment

Color match 2:

Make 2 kinds of thermochromic ink + normal pigment mixture that are same color.

Linda Worbin from Swedish School of Textiles have made an extensive design research on Dynamic textile design with thermochromic ink prints as her PhD study. You can download her PhD thesis “Designing dynamic textile patterns” to read about her research from here

 http://bada.hb.se/handle/2320/5459

(PDF link on the top right)

Activating Thermochromic color change

You can use iron and hair driers, or even body heat to change the color of thermochromic prints. But also, you can use electricity to heat up certain parts of the fabric to achieve dynamic pattern on fabric.

Like what we experienced with the SMA, when large current goes through low resistance conductive material, it emits heat. We can use this method to heat up conductive threads to change colors of the prints. 

I recommend to use Bekinox stainless steel thread from Bekaert for this purposes. Stainless steel fibers can take a lot of heat, and it has good amount of resistance (about 2ohm/ 10cm) to control from mosFET circuit. Alternatively you can use copper thread from KarlGrimm as it is also made of metal(copper) fiber. If you use copper thread, please make sure your heating thread has few ohm resistance across, or it will be difficult to control from mosFETs. Silver plated threads such as Shieldex thread or Elitex is not suitable for this use as it can not take the heat.

You can simply sew the pattern you want to heat up with the stainless steel thread using needle, or make  couching stitch on the fabric.

Alternatively you can weave the conductive thread in the fabric to create heat-able textile surface.

Now, cover the embroidery with thermochromic print. If you connect the both end of the stitch to lab power bench supply and apply electricity, it will heat up and you can see the color changing where the thread is.

 

Please check how much voltage and current you are providing with the lab power bench supply to your heating thread. you will probably like to keep the current going through the thread around 1-1.5A. Otherwise it will get hot very quick and too hot. Make sure not to overheat your thermochromic prints. It can lose its ability to change the color when exposed to very high temperature. 

Now, instead of us switching on/off the power supply to our heating thread, we would like to control this from Arduino pins. For this we do similar things to what we did with SMA in workshop 1.

For this workshop, we have IRLB8743 mosFETs. You can use other types of mosFETS as well, but make sure it is N-channel mosFET and it has small internal resistance between Drain and Source. If the internal resistance of the mosFET is bigger than the resistance of the thread, mosFET will get hot instead of the thread. You can check the datasheet to check its internal resistance and other specifications.

Here is the diagram of how you can connect transistor (mosFET) switch with Arduino.

the resister between gate pin and GND is 100k ohm. This is to prevent heating up the thread unwillingly in the case your Arduino is off and your power supply is on.

In future, if you want to include your thermochromic prints in wearable project, you do not want to carry the big heavy power supply. Or if it is a furniture, you do not want to include this expensive device.

Once you know how much voltage and current you need to apply to heat up your thermochromic prints, you can use other types of power supply as long as it can provide same amount of voltage and current.

For example, if you have furniture or stationary project, you can use ACDC power plug to provide voltage. Make sure your power plug can supply enough current as you need. ACDC power plug looks something like this..

If you have wearable project and you want it to be portable, you can use Lipo battery (3.7V) or 9V battery. Both of them can supply more than 1A and it should be enough for most of the project.

As these power supply’s voltage is fixed, you will need to calculate how much current will go through and if it is too much, you will need to limit it with 3W or 5W resisters. Do you remember V = I x R and P = V x I ?
