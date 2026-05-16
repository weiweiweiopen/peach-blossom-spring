---
source: How To Get What You Want / KOBAKANT DIY
title: "Communicating Bodies"
url: "https://www.kobakant.at/DIY/?p=9133"
postId: 9133
date: "2021-10-13T10:52:00"
modified: "2022-05-18T10:51:02"
slug: "communicating-bodies"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Communicating Bodies

Source: https://www.kobakant.at/DIY/?p=9133

## Excerpt

This two-week (5day) workshop brings together textile, costume and product design students from Weissensee University, and students from the MA program S&&O of the performing arts university berlin. Together we want to play with body language, textile sensors and sound. Given a new medium such as wearable technology, what new ways of communicating emerge? Screen […]

## Content

This two-week (5day) workshop brings together textile, costume and product design students from  Weissensee University, and students from the  MA program S&&O of the performing arts university berlin. Together we want to play with body language, textile sensors and sound. Given a new medium such as wearable technology, what new ways of communicating emerge? Screen and text-based communications gave rise to emoticons and GIFs that we use to express what we can’t capture with words. What would be the emoticon equivalent of a sound gesture be?

We will use textile sensors and wearable technology to capture body movements and gestures, sending the sensor data wirelessly via an ESP32 to a computer running a Pure Data patch which processes the sensor data and triggers/outputs sounds.

Students will work in groups of 4, building at least two copies of a wearable that allows group members to communicate with one another using a shared language.

On the last day of the workshop groups will interact with one another and we will see if/how/what happens when these different languages meet. We will end with a closing discussion where we hope to reflect upon questions like:

— When do we know that we’ve understood what another is communicating?

— What kinds of things does this medium allow us to communicate?

— What is it like to use your body to communicate?

— How easy or hard is it to learn a new body language?

workshop photos >>  https://www.flickr.com/photos/plusea/albums/72157720076544221

WORKSHOP BACKGROUND

this joint workshop/course is motivated by our experiences in teaching technology in creative contexts, and our desire to encourage students to:

play first, make later

make things that are not useful

be the user, make things for yourself

Schedule Overview

WEDNESDAY 20.10.21, 10-15:00

THURSDAY 20.10.21, 11-19:00

MONDAY 20.10.21, 11-18:00

TUESDAY 20.10.21, 11-18:00

WEDNESDAY 20.10.21, 10-15:00

Links

Mosquitto local MQTT broker >>  https://www.kobakant.at/DIY/?p=9140

spaghetti monster >>  https://www.kobakant.at/DIY/?p=9137

textile sensors >>  http://www.howtogetwhatyouwant.at/?cat=26

spaghetti monster photos >>  https://www.flickr.com/photos/plusea/albums/72157719958295195

slides >>  https://docs.google.com/presentation/d/e/2PACX-1vRKwm7oxvIf9mphi5qEejk7vHk-o-uecrp-1FVBXKPZ0E9sp2qnAa-g-I9BIvdDOP5R8rU2ECXolxDy/pub?start=false&loop=false&delayms=3000

Technology

TEXTILE SENSORS

sensing pressure and bend using Eeonyx piezoresistive stretch fabric between two electrodes made of stretch conductive silverized lycra.

ESP32 DEVBOARD V1 38pin

ARDUINO CODE for ESP32

…coming soon…

SPAGHETTI MONSTER and SPAGHETTI BABIES

MONSTER: a breakout board for the ESP

order from Aisler >>  https://aisler.net/plusea/sandbox/esp_aux_breakout

BABIES: breakout boards for 3.5mm aux sockets

order from Aisler >>  https://aisler.net/p/WKZMEUTC

POWERBANK : LIPO BATTERY

AUDIO CABLES

SPAGHETTI MONSTER BELT

holds the ESP and lipo battery

RASBERRY PI & MQTT BROKER

WIRELESS connection using WIFI + MQTT

Here is the diagram of how our local area network (LAN) between ESPs and MQTT broker and your computer is connected.

Each ESP32 connects with the router (could be connected to internet, but not necessary) with router’s SSID and PASSWORD. Each of your ESP will get unique local IP address from the router when connected. This is the same as you connect your laptop to the router. Your computer also receives a unique IP address from the router, which often starts with 192.168.xx.xx the x part is usually unique. These addresses are local and not accessible from outside of the network. If you want to connect over the internet, then you need a service (i.e shiftr.io) that runs MQTT broker that has a public IP address.

MQTT is a lightweight, publish-subscribe network protocol that transports messages between devices. In your network, there is one MQTT broker runnign in the middle. Everyone in the network publishes their data to the broker with a topic name. The broker works a bit like a news agency. Each members of the network can tell the broker which topic they are interested. Let’s say you subscribed to the topic “flower” as you are interested in flowers. Anyone in the group can publish the news about “flower” to the broker. When the broker receives the “flower” topic news, he distributes it to all the subscribers of the “flower” topic. Multiple people/devices can subscribe to a same topic. In this case all of the “flower” subscribers will get the same news. You can subscribe to more than one topic.

You can also nest the topic. For example you can publish a news about “daisy” as a sub category of “flower” >> flower/daisy. If you subscribed to “flower/#” as anything that is the category of flower, then you will receive news about flower/daisy, and flower/rose.. so on. This can be useful when your data starts to get nested.

To use this protocol, each member needs to know the IP address of the broker so they can connect, but no need to know the IP address of publishers (where the data comes from) or subscribers (where the data goes to)

SONIFICATION/PURE DATA

To give “sound” to your movement data, we use visual programming software called Pure Data (https://puredata.info/). It is an open source program that let you synthesize sound by connecting modules with cable (visual programming), like modular synthesizer, but on a screen.

To use MQTT, we will need an externals/library for MQTT (https://github.com/njazz/mqtt-client-object). When you download source code from the github, you have to compile it on your computer to use it, which can be a bit tricky. For the workshop, already compiled externals are provided on the example folder. This version is still buggy, but will work for what we do in the workshop.

On your windows machine, there is already Pure Data installed and the workshop file copied. It is located on your Document/workshop/PDexample folder, or you will find a shortcut on the desktop. Open the folder and you should find the above structure. Please open the RECIEVER_P1.pd patch (double click and it will open the PureData software)

It will open the PD window, which shows error and print messages, and your patch window. sound on/off can be also switched from PD window right top DSP radio button.

on the RECEIVER patch, click your group number, and it will connect to the MQTT broker running on the raspberry pi in the room.

In case you need to change the IP address, click the “MQTT_connection” object, which will open a MQTT_connection window. Inside, you find the object with IP address. press ctl+E (command+E on mac), which will let you enter editing mode (you see the cursor turning into a hand), then click the object with IP address on it that will retype the address.

Once you click the group name and if it successfully connect and subscribe to your group name topic, it shows two X on the box.

If your group’s person1 ESP is already powered and running, you will start to see the sensor data sent to your PD. Turn on your ESP and see if you receive the sensor data. Find out which plug corresponds to which sensor.

Now, let’s get the sound out. First, connect a speaker to your computer. The NUC we are using in this workshop does not have internal speaker, so make sure to connect some kind of speaker or headphone.

Open Audio settings and choose the output as your speaker. make sure that output is checked and there are 2 channels. Apply and say OK to close this window.

Let’s try few Players.

“PLAYER_trigger_short” triggers short sound files each time your sensor moves. Assign your sensor to one of the block by selecting from radio box under P1_sensor. the default position is 0 (no sensor). You notice every time you move, it triggers short sound starting with “k” , but each time it is slightly different. This is because there are actually 10 sound files of “k” and it is randomly choosing the playback file out of these 10 files. You can connect 4 sensors and see what you can do with the combination of “k”, “s”, “h” and “p”. “PLAYER_trigger_medium” works similar, except it is picking file out of 3 files.

The sound files for trigger_short is organized in the above way. place similar sounding soundfile of your choice to each folder with same name conventions (sample0.wav, sample1.wav…) and it will play your sound.

PLAYER_trigger plays out sound file depending on two sensor combinations. The second sensor selects which file (words) to play and the first sensor triggers to play.  It has mute box, that is mute by default. Make sure to click and see X to get the sound out.

The sound file for this patch is located inside the sounds/long_voice folder. Left side block plays sample1-1.wav to sample1-4.wav, and the right side plays sample2-1.wav to 2-4. You can replace the sound file with your own sample (make sure to name it the same way).

“PLAYER_granular” controls granular synthesis parameter. the left sensor controls the playback speed of the grain, and the left sensor controls position of play head. This one has a mute box, make sure it is cricked and see X in the box to get the sound out.

The sound file for this patch is located inside the sounds folder named sample_granular.wav. You can replace the sound file with your own sample (make sure to name it the same way).

After you tried out the examples, you can experiment with different sound to change the content. all the sound files are located in “sounds” folder.

To create a sound samples, you can record sound with your phone, send it to computer and use sound software like Audacity (https://www.audacityteam.org/) to edit the file and export to .wav files.

LINK to Pechakucha file upload folder >>  https://next.kh-berlin.de/s/A37dDTGmtdCjH5z

please upload PDF with 10 images by thursday oct 21st midday.

please name the PDF with your name.
