---
source: How To Get What You Want / KOBAKANT DIY
title: "JoySlippers"
url: "https://www.kobakant.at/DIY/?p=567"
postId: 567
date: "2009-06-05T20:42:47"
modified: "2010-08-18T18:58:54"
slug: "joyslippers"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# JoySlippers

Source: https://www.kobakant.at/DIY/?p=567

## Excerpt

A pair of slippers for drawing, playing games and exploring alternative input. These slippers are designed with two pressure sensors embedded in each sole and can sense the weight being shifted between the toe and heel of each foot. This information is fed into a computer where a drawing application translates this analog input into […]

## Content

A pair of slippers for drawing, playing games and exploring alternative input. These slippers are designed with two pressure sensors embedded in each sole and can sense the weight being shifted between the toe and heel of each foot. This information is fed into a computer where a drawing application translates this analog input into drawing directions, so that the wearer of the Joy Slippers can draw with their feet in an etch-a-sketch fashion.

>>  www.joyslippers.plusea.at

>>  JoySlipper Instructable

>>  First JoySlipper Instructable

>>  Wireless JoySlippers

>>  Pattern on Burda Style

The Joy slippers make use of  conductive thread pressure sensors, which are basically homemade force sensing resistors (FSRs). They are made from layers of conductive thread and ex-static which are embedded in the slipper’s soles.

Via spiral telephone cord each foot is connected to an Arduino physical computing platform, which sends the analog pressure values to the computer’s serial port.

A Processing applet reads these values, thresholds them and translates them into drawing directions. The drawing application demonstrates how different motions make different patterns, visualizing their capability to track motion.

Video from San Mateo Maker Faire >>

Versions

JoySocks Version 2

JoySocks Version 1

Using machine snaps instead of the hand-sewn kind makes makes production less tedious, but also means that the snaps are bigger. Each heel is decorated with 3 male snaps, one for heel input, one for toe input and one for +5V current.

Because the wires inside the telephone cord are very fragile and super annoying to strip and attach to pretty much anything, the snap versions come with stretchy fabric connection cords. The cords are stretchy because the conductive traces are made from strips of stretch conductive fabric, isolated inside a stretch fabric tube. At either end of the stretchy cords there is a female snap, one to connect to the heel of the JoySlippers and one to the electronics box.

Using snaps for making electric connections is great because it was never their intended purpose, not up until many people started wanting to create soft and wearable electronics.

JoySlippers Version 3

In order to make the JoySlippers useful outside the input context this version makes it possible to detach the slippers from the telephone cord and their soles are now reinforced with rubber, so that they can be worn outside and for more regular use without wearing them out. Where previously the telephone cord was permanently attached o the heel, there is now a female telephone jack embedded in the neoprene and rubber fabric of the heel, allowing them to be plugged and unplugged from here. When unplugged, the telephone jack remains visible, giving the slippers a very unique look.

JoySlippers Version 2

The spiral telephone cord was introduced in this version to give the wearer more freedom to move. It also makes use of the stretchy-ness of the telephone cord as well as the sturdy standard phone jack plug that allows the slippers to be unplugged from the electronics box. The cables are permanently fixed to the heel of the slippers.

JoySlipper Inlays: Regular, High-heel and Flip-flop

These versions might not qualify as slippers, as they are really only the sole and need to be used in combination with existing shoes -slippers, sandals, socks or even ski boots.

The nice thing about the Inlays is that you can use them with different kinds of footwear. The reason these are not detachable at the sole, is because I didn’t want to attach anything hard so close to the foot. All of the detachable connection solutions I’ve implemented so far include hard materials such as snaps, perf-boards and phone jacks. I could imagine using conductive Velcro, but even this is not the softest of solutions.

JoySlippers Tab Version 1

This was the second soft JoySlipper version. I was looking for an alternative to sewing nine snaps per slipper -three on the slipper, and three on either side of the connection cable. So, although this version didn’t lead to easier connections, it was good for fast prototyping, using crocodile clips to quickly connect to the electronics. And in the end the conductive tabs turned out to be a great for making the permanent connections, that I use for the Inlay versions.

JoySlippers Snap Version 1

This was the very first soft version of the JoySlippers. Snaps are very useful for making electronic-to-fabric connections, but can get annoying when you have to sew too many.

JoySlippers First Prototype

The very first prototype for the JoySlippers was actually not soft at all but made from aluminium tape on cerial-box cut-outs in the shape of soles. The prototype proved to me that by shifting my weight from left to right and toe to heel I could nicely manipulate directional input: up, down, left, right. Actually the aluminium still makes sense when the slippers have a hard sole, and maybe when I start making JoyShoes, I’ll come back to it.

How to make a pair of JoySlippers

STEP 1) Materials and tools

There are many different ways to make a pair of JoySlippers, hence the range of different versions. The instructions here will shoe you how to make a pair of JoySlippers Version2. To get an idea of how to make more recent versions, please take a good look at the  JoySlippers Flickr set. You’ll find a lot of detailed pictures of the making-of of almost every pair of JoySlippers.

The materials that you will need are simple, but it’s probably not all stuff you have lying around your house. It comes cheap if you plan on using the materials for future projects, especially if you are interested in wearable technology or soft circuits.

MATERIALS for the Joy Slippers

– Conductive thread – 117/17 2ply (17USD from  www.sparkfun.com)

– Ex-static – plastic from the black bags used to package sensitive electronic components

– 6 mm thick neoprene with jersey on both sides (ask at a local surf shop for leftovers, or if you live in Europe and plan to use neoprene for other things, get a sheet from  www.sedochemicals.com)

– Stretchy fabric (you can also use a pair of old socks if you don’t feel like sewing so much)

– Regular thread

– Perfboard with copper line pattern (7×3 holes 6.25USD from  www.allelectronics.com)

– 50ft Spiral telephone wire (1.99USD at 99cent store)

MATERIALS to make Arduino connection

– 4 x 10K Ohm resistor

– Perfboard with copper line pattern (6×6 holes)

– 15cm of rainbow wire with 6 cables

– 2 telephone jack outlets (5 for 1.50USD at 99cent store)

– Tupperware box or similar

– Solder

– Superglue

– Arduino Serial USB Board (35USD from  www.sparkfun.com)

– USB cable (4USD from  www.sparkfun.com)

– Laptop or computer (hopefully you have one, or can borrow one)

– Processing installed on your computer (download free from  www.processing.org)

– Arduino software installed on your computer (download free from  www.arduino.cc)

TOOLS you will need

– Sewing needle

– Scissors

– Cutter

– Ruler

– Pen and paper or cardboard

– Your feet

– Multimeter for checking your work

– Soldering iron

– Third hand

– Pliers or some kind of wire cutter

(- Bread-board)

SKILLS required

You will need to be able to solder. Soldering is not hard and there is a nice Instructable right here >>

 http://www.instructables.com/id/How-to-solder/

You will need to know how to use the Arduino software environment, in order to upload following code to your microcontroller. It will read the first 4 analog inputs and receive them via USB >>

 www.plusea.at/downloads/_080201_Read_4AnalogIN.zip

Following Processing application will read the incoming values from the Arduino’s inputs and use the information to draw a line.

Input will be read as follows:

Analog INPUT [0] = Right foot TOES

Analog INPUT [1] = Right foot HEEL

Analog INPUT [2] = Left foot TOES

Analog INPUT [3] = Left foot HEEL

STEP 2) Pattern making and tracing

The following pattern is for a female European size 39 (US size 8 ½) foot!

You can download the pattern PDF for exact measurements here >>

 www.plusea.at/downloads/080229_JS-Pattern.pdf

Stencil for sole

These instructions will only cover the steps for creating the right slipper. The left slipper is exactly the same, except you will have to turn the stencils upsidedown.

To customize the slippers you will have to modify the pattern. I’m not sure how to scale it for different size feet. So you can trace your right foot onto a piece of thin cardboard or thick paper. Before cutting out the tracing draw a tongue-shaped tab that sticks out from the heel about 5cm (see pictures). We will call this the tongue and it will be where we attach the slippers to the electronics later on.

Now cut out the tracing with the tabs. Put your foot back on the tracing and find the areas where:

1) your heel presses

2) the balm of your toes press

In these areas you will want to draw a strips of 1.5cm wide and at the toes: 6cm long and at the heel: 4cm long. Make sure these strips do not come within at least 1cm of the edge. Cut out the insides of these strips and make markings every 1cm along the lengths. In the next step these strips will make sense.

Tracing onto neoprene

Trace these stencils on to the neoprene twice for one foot. And mark everything as shown in pictures.

Tracing onto ex-static

You do not need to make a separate stencil for the ex-static, unless you plan on making more than one pair of slippers. Trace the foot stencil onto the ex-static and cut it out about 5mm smaller all-round. Do not include the tongue.

Pattern for the top of the slippers

Trace the pattern for the above of the slippers to the stretch material. You can take it double along the centerfold or only use one layer of fabric.

STEP 3) Sewing inputs and Vcc

Vcc:

Thread a needle with enough conductive thread. Take one of the pieces of neoprene, this is going to be the Vcc, the power supply for the sensor where the 5V from the Arduino will run to. Tie a knot in the end of the thread; do not take the thread double. From the back (in my case black side) poke the needle through the neoprene at one of the end dots of the toe strip marked from the stencil. Stitch back and forth in a diagonal zigzag manor until you reach the other end of the strip. From here go bring the conductive thread back to the back side of the neoprene and make small stitches on the back towards the tongue. When you reach the tongue you can stop sewing and without cutting the thread remove the needle and continue with the following.

Inputs: Toes and Heel

Take the other piece of neoprene. Essentially you will do the same here with one exception: You will sew the zigzag pattern opposite to the way you sewed the Vcc strips! This way, when you lay the pieces of neoprene on top of each other, conductive thread zigzags facing inwards, they will crisscross each other and make for a good connection. Take a good look at the pictures.

First multimeter test

Before going onto the next step, now would be a good time to check your connections using a multimeter. Measuring from the loose ends of conductive thread, check for a connection between any of the three ends. There should be NO connections. If there are, then you probably accidentally crossed conductive threads somewhere along the way. You can quite easily pull out the conductive thread and start over again.

STEP 4) Finishing slipper

Sewing sole of slipper

Now you will want to layer you pieces as follows so that the conductive traces are facing inwards:

TOP

– Vcc or Inputs

– Ex-static

– Inputs or Vcc

BOTTOM

Hold everything in place and stitch around the edges of the neoprene. Sewing both layers of neoprene together, not including the ex-static in your stitches. Take a good look at the pictures to see how to best to stitch. Do not sew the tongues together (yet), instead stitch back and forth at the foot of the tongue, giving it a bit of a dent and making it easier to bend later on.

Another multimeter test

You can now make another multimeter test to make sure none of your inputs and/or Vcc are touching each other. You should have some resistance between the inputs and the Vcc. And this resistance should become less when you apply pressure to the top of the layers. What you don’t want is a permanent connection. Or no connection at all between an input and Vcc. Or any kind of connection between the inputs.

Decide left or right

NOW you really decide if this is going to be the sole of a left or a right slipper.

Take a cutter and cut just a very very small slit into one of the tongues. The tongue you cut the hole in will make it the outside layer of neoprene, the one the touches the ground, not your foot.

Cutting cord

Take the 50ft spiral telephone cord and cut it in half. We will use one half for each slipper. So we only need one at the moment. From the cut end, strip away about 2cm of the thick insulation.

Soldering

To bring the conductive thread and wire together we need to solder three of the four wires to a small piece of perfboard. 4×7 holes with 7 strips of conductive copper pattern. I double-spaced the wires to make double sure I don’t get any connections between the conductive threads. Please see illustration image bellow for how to solder and sew. Also see the illustration for which three of four wires you should pick to solder.

Sewing up

Now that the conductive threads are connected to the wires of the telephone cord you can stitch around the tongue, enclosing it all between the two layers of neoprene.

Attaching jersey

To follow the pattern shown in the pictures, take the pieces of stretch material and sew them right-sides-together to the edges of the sole (upsidedown). Follow the images to get an idea of how to sew the pattern together. Attach the tongue to the heel so that it sticks up and stays in place.

STEP 5) Making connection to Arduino

This step shows how to make the connection to the Arduino. For this you will need an Arduino, which is a physical computing platform that has a USB connection to your laptop, contains a microcontroller that we can program to read the variable resistance of the Joy Slippers from its analog inputs.

Of course, if you know what you are doing, you can hook the slippers up to any other circuit or device you have for making use of their variable resistance. So if you don’t intend to hook the Joy Slippers up to the Arduino, then you can skip this step.

The connection from the slipper consists of:

– Two male telephone jacks coming from the slippers

– Two female telephone jacks that will be attached to the Tupperware box

– Inside the Tupperware box the Arduino inputs will connect to the backside of the female telephone plug socket and there will be a small circuit that puts a 10K Ohm resistor between each input and the ground.

Dismantle

We need two female telephone jacks. You can dismantle a telephone jack adapter for this. You might want to clip the wires sticking out at the back to about 5mm length so that they don’t come so close to each other.

Cut holes

You need to cut three holes in the Tupperware box, two for the female telephone jacks and one for the USB Arduino cable. Use a cutter or a drill and be careful.

Solder

1) Follow semantic and solder rainbow wire from headers to perfboard with resistors, to more rainbow wire.

2) Poke the ends of the telephone wire out through the hole of the box and solder them to the female telephone jacks according to the semantic.

Superglue

Once the female jacks have been soldered you can superglue the jacks to the box to make them sturdy and relieve all strain from the wires.

Decorate

Now the box is finished and you should decorate it if you can.

STEP 6) Hooking up to your computer and running the drawing application

Make sure everything is soldered together correctly and all the plugs are in place.

Arduino

Plug the USB cable from the Arduino into your computer and upload following code to your microcontroller. It will read the first 4 analog inputs and receive them via USB >>

 http://www.plusea.at/downloads/_080926_Graph_4AnIN.zip

Processing

Run Processing and open following applet >> http://www.plusea.at/downloads/_081116_JSV4.zip

You will have to set following line of code to match your device >>

String portname1 =”insert your serial connection here”;

If you run the program once, then it will print a list of the available serial ports and the Arduino is usually the first one and called something like this >>

/dev/tty.usbserial-0000101D

Thresholding

Because each slipper is individual and depending on all the exact materials that you use and the way you sew them together, the range of variable resistance will be different for each sensor (right toe, right heel, left toe, left heel). This is why there is a threshold function in the processing applet, that allows you to set the MIN and MAX values of your sensor. These will be between 0 and 1000.

To find out what these thresholds are and to switch to the drawing function you will need to read the instructions in the code (very beginning) and follow them.

MIN threshold should be slightly above resting state and MAX threshold should be maximum value obtained when pushing as hard as possible on the Joy Slippers.
