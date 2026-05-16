---
source: How To Get What You Want / KOBAKANT DIY
title: "Interactive KnitBook"
url: "https://www.kobakant.at/DIY/?p=4855"
postId: 4855
date: "2013-11-28T11:51:32"
modified: "2017-10-25T20:24:48"
slug: "knitted-electronics-sample-book"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Interactive KnitBook

Source: https://www.kobakant.at/DIY/?p=4855

## Excerpt

The Interactive Knit Book demonstrates examples of knited electronic elements such as switches, sensors, speakers, and heaters that cause colour change. This book was compiled as the result of the EIT ICT Connected Textiles research done at the Design Research Lab at the UdK Berlin.

## Content

The Interactive Knit Book demonstrates examples of knited electronic elements such as switches, sensors, speakers, and heaters that cause colour change. This book was compiled as the result of the EIT ICT Connected Textiles research done at the  Design Research Lab at the  UdK Berlin.

Interactex >>  http://www.interactex.de/

The samples in the book were knit by Sara Diaz Rodriguez, the demo circuits designed by Hannah Perner-Wilson and the research supported by Katharina Bredies.

The samples in the book were knit by  Sara Diaz Rodriguez, the demo circuits designed by  Hannah Perner-Wilson and the research supported by  Katharina Bredies.

The Book

The book is made up of individual pages that demonstrate different samples of knit electronic elements. In order to demonstrate the knit samples each page contains a simple demo circuit to illustrate the capeability of each knit sample. The electrical traces of the circuits are made from copper tape that has been applied ot the inner side of the pages. Windows cut in the flap of each page show the various elements of each circuit, without showing the connections between them. This was done so as to draw the attention to the knit samples and not to the complexity of the circuitry used to demonstrate it. Each page can easyily be folded opened to reveal the behind the scenes circuitry. Additional electrical components such as ATtiny microcontrollers, LED lights, speakers and resistors are used to create the functioning demos.

Video

This video gives a quick overview of the pages in the sample book and how the power supply travels thorugh the pages.

Power Supply

The power supply is given by a 3.7V LiPo battery. The battery has been mounted on a wood platform that has magnets press-fit into holes cut out of the wood. The top point of the shape is the negative (-), and the bottom round of the shape is the positive (+) side. The magnets north and south poles are oriented opposingly so that the battery will only want to connect the right way around to the circuits on the pages. The spacing between the magnets is 27 mm. The battery has been covered in hot-glue to encapsule it, though this could be made prettier by casting it in resin.

The binding of the book contains a footprint for the magnetic battery connections with cable that can be connected to a LiPo charger for charging. The idea being that when the book is not used it can be charged, and when it is used the battery travels thorugh the book to supply power to the page currently being displayed/showcased.

The battery module consists of:

– 110mAh 3.7V LiPo battery >>  https://www.sparkfun.com/products/731

– two cylindrical neodym magnets for electrical connections >>  http://www.modulor.de/shop/oxid.php/sid/adebb00656c8c04c2b98a32ea5c0e318/cl/details/cnid/IJF/anid/203470

– Lasercut wood shape

– JST header without electrical functionailty, just for attaching to end of string so as not to loose >>  https://www.sparkfun.com/products/8612

– Hot glue

Battery charger (not included) >>  https://www.sparkfun.com/products/10401

Charging

To charge the battery module over the magnet connections, the battery is placed on top of the magnetic footprint on the binding of the book. Inside the binding these two magnets are wired to the red cable which terminates in a JST connector. This JST connector can be plugged in to the battery module to keep it physically (not electrically!) connected to the book. But the JST connector can be plugged to a LiPo charger to complete the circuit to the battery on the binding footprint for charging.

Hinge

Because the copper tape does not withstand repeat bending and breaks over time, short pieces of conductive thread have been soldered to either side of hinge to make this connection robust. For this a Karl-Grimm solderable copper conductive thread was used.

Materials and parts used throughout the book include:

– Copper tape

– Neodym magnets for battery contact and knit speaker >>  http://www.modulor.de/shop/oxid.php/sid/6419c3874e95fc856497d5edfaba6153/cl/details/cnid/IJF/anid/203489

– Karl-Grimm copper solderable copper thread >>  http://karl-grimm.de/navi.swf

– Statex silverized nylon conductive thread >>  http://www.statex.de/

– Elektrisola insulated solderable copper wire >>  http://www.elektrisola.com/

– Nm10/3 resistive yarn from Plug and Wear >>  http://www.plugandwear.com/default.asp?mod=product&cat_id=105&product_id=213

– Thermochromic pigment mixed with medium similar to this one >>  http://www.paintwithpearl.com/temperature_change.htm

– ATtiny microcontrollers >>  http://www.atmel.com/images/atmel-2586-avr-8-bit-microcontroller-attiny25-attiny45-attiny85_datasheet.pdf

– TIP 122 transistors >>  http://www.adafruit.com/datasheets/TIP120.pdf

– LilyPad SMD LED >>  http://lilypadarduino.org/?p=465

– LilyPad SMD RGB LED >>  http://lilypadarduino.org/?p=519

– LilyPad buzzer >>  http://lilypadarduino.org/?p=436

– SMD LED >>  http://www.highlight-led.de/smd_leds_c20.htm

Pages:

In the following each page is introduced and the knit samples as well as the demo circuits are explained in detail. 

Capacitive Touch Example

This example demonstrates how a knitting pattern with isolated conductive areas can be used to do capacitive sensing. Contact, and even proximity, of the hand or body to these seperate areas can be sensed by a microcontroller. In this example one of the conductive areas is programmed to sense contact and slowly decreate the brightness of the LED light and the other conductive area senses contact and increases the brightness of the LED light. If both areas are contacted at once, the LED light turns off and stays off until either the power to the circuit is reset or the increase “button” is activated through contact.

Materials and Parts

– Statex conductive thread

– Non-conductive yarn

– ATtiny 45 microcontroller

– two 220 K Ohm resistors

– SMD LED

Code

By Jussi Mikonen >>  https://github.com/plusea/CODE/tree/master/PROJECT%20CODE/UdK%20DRL%20EIT/Arduino/Swatch%20Book%20Examples

Schematic

Photos

Capacitive Swipe Example

This example demonstrates how a knitting pattern with two isolated but interlocked conductive areas can be used to capacitively sense the position of the hand or body in relationship to the two areas. In this example 6 LED lights mounted above the area indicate the position of the hand over the surface of the area. Becuase capacitive sensing does not reply on skin contact, but rather proximity of the body to the conductor, the conductive threads and pattern that do the sensing in this example are covered by an additional layer of soft and fuzzy knit fabric which invites to be touched and stroked.

Pins 3 and 4 on the ATtiny are used for capacitive sensing, and the remaining 3 i/o pins (0, 1 and 2) are used to control 6 LED lights via the method of charlieplexing (n*(n-1)).

Materials and Parts

– Shieldex conductive thread

– Non-conductive yarn

– Copper tape

– ATtiny 45 microcontroller

– two 470 K Ohm resistors

– 6 red SMD LEDs

Links and References

Charlieplexing >>  http://en.wikipedia.org/wiki/Charlieplexing

Code

By Jussi Mikonen >>  https://github.com/plusea/CODE/tree/master/PROJECT%20CODE/UdK%20DRL%20EIT/Arduino/Swatch%20Book%20Examples

Schematic

Photos

Heating Thermochromic Example

This example show how stainless steel thread can be applied in a shape shape in the back of a knit fabric and used as a heating element to trigger colour change in thermochromic pigment that is applied to the front of a knit fabric. The demo circuit used in this example is a simple circuit with a switch that shorts the battery power through the resistive stainless steel thread. The switch is made from paper, simply by interrupting the power line and closing it when the copper tape on the back of the switch is pressed down on the loose ends of the interrupted circuit. An LED light is mounted in paralell to the heating circuit to give indication that the switch has been closed correctly, as it takes some time for the thread to heat up and cause visible effect.

Materials and Parts

– Stainless steel thread

– Non-conductive yarn

– Thermochromic paint

– LilyPad SMD LED with resistor module

Schematic

Photos

Knit Speaker Example

This page demonstrates how one can knit the electromagnetic part of a speaker into a piece of fabric. The electromagnetic coil in this case is knit as a pouch surrounding a permanent magnet. The conductive thread used to knit the pouch is an isolated copper wire. The audio signal is forced to flow thorugh the loops of the knit structure, creating and magnifying the electromagnetic field around itself. In this example the speaker’s electromagnet is the backing of the pouch, and the same isolated conductive thread used in the patterned front side of the knit is not electrically connected.

To demonstrate the speaker’s ability to make sound a simple paper piano has been constructed on the page. The piano has 5 keys which can be pressed to play 5 different sounds. because there were not as many i/o pins left on the microcontroller to read 5 seperate keys, the different key presses are detected as different value ranges of an analog input. This was achieved by placing fixed resistors inbeween the contacts of each key. So that if the first key is pressed the resistance between GND and analog input pin is 1K Ohm, if the second key is pressed the resistance is 2K Ohm, and so on. A RGB (red, green, blue) LED light is also included for visual feedback and lights up in different colours depending on what key was pressed.

Both the speaker and the paper piano keys are wired to an ATtiny microcontroller. The code running on the microcontrolelr determines which key has been pressed depending on the analog value coming in on pin PB4 (ADC2). To make different sounds, different frequencies are played out through pin PB2 which is connected to the base of a TIP122 transistor. The emiter of the transistor is connected to GND and the collector goes to one of the speaker leads. The other end of the speaker connects directly to the 3.7V of the LiPo battery. In this way the transisotr works to amplify the current of the audio signal going to the fabric speaker, as the pin of the ATtiny can only provide 20mAmpere.

Materials and Parts

– Elektrisola isolated conductive thread/wire

– Strong neodym magnet

– ATtiny microcontroller

– TIP122 transistor

– SMD LED

Links and References

Knit speakers >>  http://www.kobakant.at/DIY/?p=4465

Code

>>  https://github.com/plusea/CODE/tree/master/PROJECT%20CODE/UdK%20DRL%20EIT/Arduino/Swatch%20Book%20Examples

Schematic

Photos

Knit Flip-Switch Example

This page demos the very simple but elegant example of a knit flip siwtch. The switch is knit to have two condutive stripes on either side of a protruding conductive flap. The demo circuit connects the conductive strips to the positive sides of two LED lights, one red, one green. The conductive flab is connected to the positive lead of the battery so that when the flap is open the battery power does not reach the LEDs, but when the flap makes contact with either stripe, power flows and the coressponding LED lights up. If the flap is pressed to be wide and flat and make contact with both stripes at once, then both LED lights light up.

Materials and Parts

– Karl-Grimm thick silver conductive thread

– Non-conducitve yarn

– SMD LEDs

Schematic

Photos

Structural Knit Buttons Example

This page features a piece of structured knitting made using a resistive yarn that becomes more conductive when the individual conductive fibers in the yarn are compressed thorugh pressure. On the back side of the structured knit, conductive threads were insereted in such a way that they canbe used to detect pressure at certain points of the knit structure. The conductive threads are wired to input pins of an ATtiny microcontroller which can sense where pressure is being applied. To indicate this interaction a speaker plays back different notes through a buzzer mounted on the same page.

Materials and Parts

– Nm10/3 resistive yarn from Plug and Wear

– Karl-Grimm copper thread

– ATtiny microcontroller

– LilyPad buzzer module

– TIP122 transistor for amplification of frequency (although this is not necessairy)

Code

>>  https://github.com/plusea/CODE/tree/master/PROJECT%20CODE/UdK%20DRL%20EIT/Arduino/Swatch%20Book%20Examples

Schematic

Photos

Knit Push and Pressure Sensor Examples

The two examples on this page demonstrate a knit on/off switch and a knit pressure sensitive dimmer switch. The on/off switch is a knit-weave with conductive thread interlaced with a thick non-conductive conductive yarn. When relaxed (untouched) the knit structure keeps the individual conductors appart, and when pressed the conductors make contact, turning on an LED light for demonstration purposes. The pressure sensitive dimmer switch uses the same technique, except that instead of the conductive thread, a piezoresistive yarn is knit alongside a thick non-conductive yarn. When pressed/pressured the piezoresistive yarn becomes more conductive, causing and LED light to fade on.

Materials and Parts

– Nm10/3 resistive yarn from Plug and Wear

– Statex conductive thread

– Non-conductive yarn

– SMD LEDs

Schematic

Photos
