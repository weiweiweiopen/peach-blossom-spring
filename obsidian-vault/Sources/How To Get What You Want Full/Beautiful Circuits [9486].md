---
source: How To Get What You Want / KOBAKANT DIY
title: "Beautiful Circuits"
url: "https://www.kobakant.at/DIY/?p=9486"
postId: 9486
date: "2022-02-17T09:30:33"
modified: "2022-03-11T07:14:59"
slug: "beautiful-circuits"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Beautiful Circuits

Source: https://www.kobakant.at/DIY/?p=9486

## Excerpt

a very short KiCAD workshop 9+10.3.22, 10-15:00 (it is possible to join only for the first day) Spiel und Objekt Ladenlokal Hochschule für Schauspielkunst Ernst Busch Zinnowitzer Str. 11 10115 Berlin This very short intro workshop to the free and open source Printed Circuit Board (PCB) design software KiCAD (Version6) focuses on how to design […]

## Content

a very short KiCAD workshop

9+10.3.22, 10-15:00

(it is possible to join only for the first day)

Spiel und Objekt Ladenlokal

Hochschule für Schauspielkunst Ernst Busch

Zinnowitzer Str. 11

10115 Berlin

This very short intro workshop to the free and open source Printed Circuit Board (PCB) design software KiCAD (Version6) focuses on how to design beautiful PCBs. Beautiful in the aesthetic sense, paying attention to composition, layout, shape…. incorporating drawing tools and work-arounds to create shapes and layouts that have aesthetic as well as functional aspirations. Beautiful in the caring sense, paying attention to how PCBs are produced and what materials and human resources your PCB will consume.

On the first day of the workshop you will be introduced to the world of PCB manufacturing, the KiCAD software and the PCB design process. On the second day you have time to design your own simple circuit in order to learn the details of the workflow/process.

In this workshop I hope to cover:

—what is a PCB and how are they made?

—basic workflows in KiCAD (from circuit schematic to circuit layout to ordering a PCB)

—importing graphics from other software

—making your own component footprints

For this workshop you will need a laptop/computer with KiCAD 6 installed:  https://www.kicad.org/download/

A mouse + mousepad might also be helpful, but not necessary.

This workshop is intended for university students and invited guests, but if you come across this post and are in Berlin and interested, do send me an email: hannah at plusea dot at

Depending on participant’s language this workshop may be held in English or German.

// At the end of the second day, those who want can spend some time generating ideas for the HfS University Spendengala. The Spendengala is a 5hour event with 80 people on 22.5.22, which is an opportunity to design and produce a batch of PCBs as part of a storytelling/game/narrative.

what is a printed circuit board (PCB)?

“A printed circuit board (PCB) is a laminated sandwich structure of conductive and insulating layers.

PCBs have two complementary functions:

– to affix electronic components in designated locations on the outer layers by means of soldering. – to provide reliable electrical connections between the component’s terminals

Another manufacturing process adds vias, plated-through holes that allow interconnections between layers. ” (https://en.wikipedia.org/wiki/Printed_circuit_board)

a bit of history

A very nice article on the Wikipedia PCB page >>  https://en.wikipedia.org/wiki/Printed_circuit_board#History

“Before the development of printed circuit boards, electrical and electronic circuits were wired point-to-point on a chassis.”

“Development of the methods used in modern printed circuit boards started early in the 20th century. In 1903, a German inventor, Albert Hanson, described flat foil conductors laminated to an insulating board, in multiple layers. Thomas Edison experimented with chemical methods of plating conductors onto linen paper in 1904.”

“Printed circuits did not become commonplace in consumer electronics until the mid-1950s, after the Auto-Sembly process was developed by the United States Army.”

“From the 1980s onward, small surface mount parts have been used increasingly instead of through-hole components; this has led to smaller boards for a given functionality and lower production costs, but with some additional difficulty in servicing faulty boards.”

vintange circuits:

how is a PCB manufactured?

How PCB is Made in China – PCBWay – Factory Tour

PCB manufacturers

check for:

– RoHS (Restriction of Hazardous Substances) regulation restricts the use of hazardous materials in a final product.

– REACH (Registration, Evaluation, Authorization, and Restriction of Chemicals) initiative controls chemicals used during the manufacturing processes for printed circuit boards, electrical components, and electronic components. Those chemicals are on the list of Substances of Very High Concern (SHVC).

PCB manufacturers:

Aisler (Netherlands)*

>>  https://aisler.net/ can work directly from KiCad project file!

sustainability info:   https://aisler.community/t/rohs-reach-compliance/85

– can upload KiCad project file!

– min. order of 3 🙁

– only green soldermask

– only one board thickness

Euro Circuits (EU)

>>  https://www.eurocircuits.de/

sustainability info:  https://www.eurocircuits.de/blog/eurocircuits-umwelt-und-reach-vorschriften/

multi-circuit-boards (EU?)

>>  https://portal.multi-circuit-boards.eu/?Sprache=en

sustainability info:  https://www.multi-circuit-boards.eu/en/quality/official-directives.html

Seeed Studio (China)*

>>  https://www.seeedstudio.com/fusion.html

sustainability info:  https://support.seeedstudio.com/knowledgebase/articles/1924864-seeed-fusion-s-commitment-to-environmental-safety

– min. order of 3 🙁

– all colours of soldermask

– many different board thicknesses

OSHpark (USA)*

>>  https://oshpark.com/

sustainability info: waiting for answer

– can upload KiCad project file or zipped GERBERS

– also has flexpcb

design rules:  https://docs.oshpark.com/services/

PCB way (China)*

>>  https://www.pcbway.com/

sustainability info:  https://www.pcbway.com/blog/News/PCBWay_get_UL_certificate.html

Well PCB (China)

>>  https://www.wellpcb.com/

sustainability info: “All our products pass the IPC or UL standards and REACH & ROHS standards“

sustainability issues

“Jeder Deutsche produziert 20 Kilo Elektroschrott pro Jahr.”

>>  https://de.statista.com/infografik/12272/die-zehn-laender-mit-dem-groessen-elektroschrott-aufkommen/

PCB production

>>  https://resources.pcb.cadence.com/blog/2020-eco-friendly-printed-circuit-boards-present-and-future-manufacturability

>>  https://resources.ema-eda.com/blog/2021-how-pcbs-are-manufactured-sustainably

Check PCB manufacturers for compliance with:

– the Restriction of Hazardous Substances (RoHS) regulations restricts the use of hazardous materials in a final product.

– the Registration, Evaluation, Authorization, and Restriction of Chemicals (REACH) initiative controls chemicals used during the manufacturing processes for printed circuit boards, electrical components, and electronic components. Those chemicals are on the list of Substances of Very High Concern (SHVC). REACH has prompted PCB manufacturers to:

— abandon the use of toxic chemicals

— check supply chains for ethical practices

— discover environment-friendly alternatives for board components

Alternatives, future work:

– paper PCBs (in contrast to non-biodegradable glass fiber and epoxy boards)

– additive manufacturing

Design decisions:

– reuse components

– reduce board size

– use “break-away tabs” / “mouse bites” to connect separate PCBs so that you can nest them and waste less material.

“guidelines suggest, for a low-stress break-away, 5 holes per tab, 0.8mm diameter unplated, spaced 1.25mm apart, every 75mm along an edge with 1.2mm radius routed outlines.”(https://electronics.stackexchange.com/questions/473037/how-to-design-a-snap-breakable-pcb-module)

“some PCB manufacturers will do v-scoring, which makes for a clean break, but does not support traces running across the v-score.”

what (other) ways are there of making circuit boards?

breadboard

protoboard (perfboard, stripboard…)

self etching with heat transfer of resist from inkjet printer or drawing by hand with sharpie marker

(PCB manufacturing)

laying out copper tape by hand (jie qi)

barebones

vinylcut (CNC) or cutting by hand: copper sheets with adhesive backing or conductive fabric with fusible backing

lasercutting conductive fabric with fusible backing

CNC milling from hardboard with copper

3D printing with conductive filament or silver ink/paint

DIY inkjet printing silver ink on paper / services that do this for you

TYPES OF PCBs

hard/rigid PCBs

flex PCBs

hybrid PCBs (hard & flex)

fabric PCBs

paper PCBs

beautiful? circuits

collections:

>>  https://llllllll.co/t/pcb-art-artfully-shaped-copper-traces/22027/11

>>  https://www.pinterest.de/search/pins/?q=pcb%20art&rs=typed&term_meta[]=pcb%7Ctyped&term_meta[]=art%7Ctyped

>>  https://makezine.com/2017/06/21/high-tech-fashion-low-riders-everything-maker-faire-kansas-city/

>>  https://yurisuzuki.com/artist/tube-map-radi

(non functional) circuit art:

Theo Kamecke’s sculptures >>  http://www.theokamecke.com/

leonardoulian >>  https://www.leonardoulian.com/works/

barebones >>  https://www.bhoite.com/sculptures/555-blinker/

circuit design process

 

 

“beautiful” circuit design process:

KiCAD work-flow

A very good beginner tutorial, similar to what we will do in this workshop >>  https://docs.kicad.org/6.0/en/getting_started_in_kicad/getting_started_in_kicad.html#creating_new_footprints

exporting files for manufacturing

the Gerber format – is an open ASCII vector format for printed circuit board (PCB) designs. It is the de facto standard used by PCB industry software to describe the printed circuit board images: copper layers, solder mask, legend, drill data, etc. you can find many online viewers that allow you to see them >>  https://www.gerber-viewer.com/

How to export GERBERS from KiCAD:

>>  https://www.youtube.com/watch?v=ENmDnoKs2hM

>>  https://docs.oshpark.com/design-tools/kicad/generating-kicad-gerbers/

glossary of useful words

these defiitions are mostly all taken from wikipedia.org

PCB – Printed Circuit Board

schematic – a simple two-dimensional circuit design showing the functionality and connectivity between different components.

protoboard (laborkarte) – a board, having a matrix of small holes to which components may be attached without solder, used for the temporary construction and testing of electrical and electronic circuits.

punktrasta / perfboard (DOT PCB) – a thin, rigid sheet with holes pre-drilled at standard intervals across a grid, usually a square grid of 0.1 inches (2.54 mm) spacing. These holes are ringed by round or square copper pads, though bare boards are also available.

streifenrasta / stripboard – the generic name for a widely used type of electronics prototyping board characterized by a 0.1 inches (2.54 mm) regular (rectangular) grid of holes, with wide parallel strips of copper cladding running in one direction all the way across one side of the board.

FR4 board – FR stands for Flame Retardant. FR4 is a glass fiber epoxy laminate. Among all the materials that designers use while manufacturing printed circuit boards, FR4 is the most popular one.

kapton – is a polyimide film used in flexible printed circuits (flexible electronics) because it remains stable across a wide range of temperatures, from −269 to +400 °C

via (latin for path or way) or plated through hole – is an electrical connection between copper layers in a printed circuit board. Essentially a via is a small drilled hole that goes through two or more adjacent layers; the hole is plated with copper that forms electrical connection through the insulation that separates the copper layers.

castellations – or castellated edges, plated holes on the board’s edge, plated half-holes. Their main advantage is that they allow an electrical connection to another board through the side edges of the board, without additional components.

trace – a signal trace or circuit trace on a printed circuit board (PCB) or integrated circuit (IC) is the equivalent of a wire for conducting signals. Each trace consists of a flat, narrow part of the copper foil that remains after etching.

pad – is the exposed region of metal on a circuit board that the component lead is soldered to. Multiple pads in conjunction are used to generate the component footprint on the PCB.

through-hole technology – also spelled “thru-hole”, refers to the mounting scheme used for electronic components that involves the use of leads on the components that are inserted into holes drilled in PCBs and soldered to pads on the opposite side either by manual assembly.

surface-mount technology (SMT) – is a method in which the electrical components are mounted directly onto the surface of a PCB. An electrical component mounted in this manner is referred to as a surface-mount device (SMD).

footprint – or land pattern is the arrangement of pads (in surface-mount technology)[1] or through-holes (in through-hole technology) used to physically attach and electrically connect a component to a PCB. The land pattern on a circuit board matches the arrangement of leads on a component.

populate – to populate a PCB means you are installing the components that make up the circuits the board was designed to do.

pick-and-place – robotic machines which are used to place surface-mount devices (SMDs) onto a printed circuit board (PCB). They are used for high speed, high precision placing of a broad range of electronic components, like capacitors, resistors, integrated circuits onto the PCBs

solder mask, solder stop mask or solder resist – a thin lacquer-like layer of polymer that is usually applied to the copper traces of a printed circuit board for protection against oxidation and to prevent solder bridges from forming between closely spaced solder pads.

reflow soldering – a process in which a solder paste (a sticky mixture of powdered solder and flux) is used to temporarily attach one or thousands of tiny electrical components to their contact pads, after which the entire assembly is subjected to controlled heat. The solder paste reflows in a molten state, creating permanent solder joints. Heating may be accomplished by passing the assembly through a reflow oven, under an infrared lamp, or (unconventionally) by soldering individual joints with a desoldering hot air pencil.

silkscreen – is a layer of ink trace used to identify the PCB components, marks, logos, symbols, and so on.

the Gerber format – is an open ASCII vector format for printed circuit board (PCB) designs. It is the de facto standard used by PCB industry software to describe the printed circuit board images: copper layers, solder mask, legend, drill data, etc. you can find many online viewers that allow you to see them >>  https://www.gerber-viewer.com/

KiCad (/ˈkiːˌkæd/ KEE-kad[7]) – is a free software suite for electronic design automation (EDA). It facilitates the design and simulation of electronic hardware. It features an integrated environment for schematic capture, PCB layout, manufacturing file viewing, SPICE simulation, and engineering calculation. Tools exist within the package to create bill of materials, artwork, Gerber files, and 3D models of the PCB and its components.

PCB layers

F.Cu

B.Cu

F.Silkscreen

B.Silkscreen

F.Mask

B.Mask

User.Drawings

Edge.cuts

useful links, references

 https://www.kicad.org/

Very good getting started tutorial:

 https://docs.kicad.org/6.0/en/getting_started_in_kicad/getting_started_in_kicad.html

KiCAD Community

Chats:  https://www.kicad.org/community/chat/

Forums:  https://www.kicad.org/community/forums/

KiCad Cheat sheets – search online

PCB layout software:

KiCad >>  https://www.kicad.org/

Fritzing >>  https://fritzing.org/

Eagle >>  https://www.autodesk.com/products/eagle/overview

PCBmode

>>  https://www.evilmadscientist.com/2013/pcbmode-make-your-pcb-a-work-of-art/

>>  https://boldport.com/pcbmode

>>  https://pcbmode.com/

Footprints >>  https://www.snapeda.com
