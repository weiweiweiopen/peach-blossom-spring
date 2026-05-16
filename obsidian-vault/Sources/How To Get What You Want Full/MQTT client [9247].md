---
source: How To Get What You Want / KOBAKANT DIY
title: "MQTT client"
url: "https://www.kobakant.at/DIY/?p=9247"
postId: 9247
date: "2021-10-28T11:46:11"
modified: "2021-10-28T12:28:47"
slug: "mqtt-client"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# MQTT client

Source: https://www.kobakant.at/DIY/?p=9247

## Excerpt

This post is a follow up to mqtt broker post. The devices that are connecting to MQTT broker (ESP, computer.. etc) is called “Client”, and on client side you will be running some kind of software that act as a MQTT client that publish/subscribe data to broker. For example, on ESPs, we used “espMQTTclient” library […]

## Content

This post is a follow up to  mqtt broker post.

The devices that are connecting to MQTT broker (ESP, computer.. etc) is called “Client”, and on client side you will be running some kind of software that act as a MQTT client that publish/subscribe data to broker.

For example, on ESPs, we used “espMQTTclient” library (on Arduino IDE, go to Sketch/Include Library/Library Manager and type in “espMQTT” on search bar on Library Manager window), based on the provided example SimpleMQTTClient to program ESP32-Dev kit board we used.

On computers, we used Pure Data software to sonify data published from ESPs, and for this we used  MQTT client external from njazz.

The binary of the externals were not available at the time we tried this (it may have changed now) and I had to compile it myself. For mac, it worked straightforward by using “make” on command line and compile.

For Windows, it was a bit tricky. It provides “cmake” file but it did not compile with visual studio with the file it created. I ended up installing minGW following this tutorial https://azrael.digipen.edu/~mmead/www/public/mingw/index.html

After some try+error, it did compile… but when I copied the compiled external to other windows computer, it did not work. It gave an error on PD that it can not find the MQTT-client library even though the correct mqtt_client.dll file is in the path. This is because it actually needs other standard windows library which it can not find the path. As a quick fix, I copied also “libgcc_s_seh-1.dll”,”libstdc++-6.dll” and “libwinpthread-1.dll” to the same folder as the mqtt_client.dll (because these .dll are needed from the mqtt_client.dll) and it works for now. (you can find these .dll on minGW folder) Ideally it should be compiled as static library within the mqtt_client.dll but I could not figure out how the cmake file should be changed for it.

Once you have your mqtt_client external on your computer, and add the path to the externals, you can use the object to subscribe/publish the data.
