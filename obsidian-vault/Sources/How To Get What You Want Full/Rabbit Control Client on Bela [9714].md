---
source: How To Get What You Want / KOBAKANT DIY
title: "Rabbit Control Client on Bela"
url: "https://www.kobakant.at/DIY/?p=9714"
postId: 9714
date: "2022-10-28T10:20:08"
modified: "2022-10-29T11:37:50"
slug: "rabbit-control-on-bela"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Rabbit Control Client on Bela

Source: https://www.kobakant.at/DIY/?p=9714

## Excerpt

Since the Rabbit Control Client is hosted on the web, if you are offline (for example in network that is not connected to internet) you can not access the client. In this case, you can host the client directly on the Bela board. Download Rabbit Control client from here http://client.rabbitcontrol.cc/client.zip Connect Bela to your computer […]

## Content

Since the Rabbit Control Client is hosted on the web, if you are offline (for example in network that is not connected to internet) you can not access the client. In this case, you can host the client directly on the Bela board.

Download Rabbit Control client from here  http://client.rabbitcontrol.cc/client.zip

Connect Bela to your computer with USB cable (this will mount the Bela on 192.168.7.2 on mac, the address maybe different on windows)

Open Terminal window (yes, the computer hacker looking one!). Connect to your Bela via ssh. 

$ ssh  root@192.168.7.2

Then you get into Bela system. your terminal window should look like this

now, open another terminal window.  In this new terminal window, type cd (change directly), space, then drag the folder that contains the downloaded rabbit control zip file. In my case it is placed in the Downloads folder, so I drag the “Downloads” folder icon to the terminal window.

This turns into path of my Downloads folder. Hit “return” and now you are in the “Downloads” folder. You can tell this by the first part of the command line including your directory name. mikst is my user name, and it now says mikst:Downloads >> this means you are on this folder now.

now, copy the zip file to the Bela. Type in

$ scp client.zip  root@192.168.7.2:/root/

now move to Bela side of the terminal window. unzip the copied zipfile. Type in

# unzip client.zip 

this creates the folder “build”. Now we move this build folder to Bela’s webserver folder (Bela/IDE/public) and call it “client” Type in

# mv build Bela/IDE/public/client

That’s it!

Now, go to your browser (Firefox, or chrome… whatever you use to browse internet). If you type in “bela.local/client” or “192.168.7.2/client” you will see the Rabbit Control window. Type in your Host (the rabbit control server address), in the case your Bela is connected with USB cable, it is 192.168.7.2, and specify the port that you specified in the rabbit control server, then you will be connected to Rabbit Control 

Run a PD patch on Bela that runs Rabbit Control Server… then connect to this server from your computer from the browser. you will see the exposed values.
