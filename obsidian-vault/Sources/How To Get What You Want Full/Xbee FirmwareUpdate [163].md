---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee FirmwareUpdate"
url: "https://www.kobakant.at/DIY/?p=163"
postId: 163
date: "2009-03-30T15:10:54"
modified: "2009-06-23T18:12:17"
slug: "xbee-firmwareupdate"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee FirmwareUpdate

Source: https://www.kobakant.at/DIY/?p=163

## Excerpt

How to upload firmwares on Xbee using Arduino board.

## Content

To enable the direct Xbee communication, you need firmware version 10A1 or later (I used 10A5) for Xbee  Series 1 802.15.4, or for Xbee Seriese 2, ZNET 2.5 CORDINATOR API or  ZNET 2.5 ROUTER/END DEVICE API firmware. If your Xbee does not have these firmware by default, you can update the firmware by using X-CTU software (only PC) from digi.

In this post, I am explaining how I did the firmware update, including how I restored my bricked Xbee Series 1 802.15.4 and Series 2. (I can not guarantee that it works for every case, but at least it worked for me)

Step 1: Connect the Xbee to your computer(PC).

You can use Xbee USB dongle or make your own Xbee-USB connection using Arduino USB board.

For detail, please see  Xbee dongle post.

Step 2: Open X-CTU

 X-CTU is a software from digi (the company which produces Xbee) that let you update the firmware. You can download it from here ( http://www.digi.com/support/productdetl.jsp?pid=3352&osvid=57&tp=4&s=316)

When X-CTU is installed, open the software and go to “PC settings” tab. 

Choose the USB port that Xbee is connected.

Set the baudrate to the Baudrate of the Xbee (default 9600), Flow Control = NONE, Data Bits = 8, Parity = NONE, StopBits=1.

Click “Test / Query” to see if software can recognize your Xbee.

If you have a bricked Xbee series 2, then you can set it as following.

Baudrate of the Xbee (default 9600), Flow Control = HARDWARE, Data Bits = 8, Parity = NONE, StopBits=1.

Step 3: Go to “Modem Configuration” tab.

Click “Read” to get your Xbee setting to X-CTU. (if your Xbee is not bricked)

It is good to get the newest version by clicking “Download new versions” and choose from the web (make sure you are connected to network)

For Series 1 802.15.4:

Choose “modem= XB24”, “XBEE 802.15.4” “10A5” (the latest one did not work for mine)

Choose “Always update firmware” under “Read” button.

For Bricked Series 2: 

Choose “modem= XB24-B”, “ZNET 2.5 CORDINATOR AT ” “1047” or “modem= XB24-B”, “ZNET 2.5 ROUTER/END DEVICE AT” “1247”

Choose “Always update firmware” under “Read” button.

For Series 2: 

Choose “modem= XB24-B”, “ZNET 2.5 CORDINATOR API ” “1147” or “modem= XB24-B”, “ZNET 2.5 ROUTER/END DEVICE API ” “1347”

Choose “Always update firmware” under “Read” button.

Step 4: Click “Write”

Then you should see blue progress bar on the bottom.

Step 5: X-CTR will ask to reset the Xbee. 

Press reset push switch that you made between reset (pin5) and GND.

Then the message box should disappear. 

Then you should see “firmware update completed” message on the bottom.

When reset message window does not disappear after pressing the push switch, (it happened to me when it was trying to write AT command after programming sequence), you can click “cancel”. 

Step 6: Quite X-CTU, restart it and see if you can connect to Xbee from X-CTU

Go to “Modem Configuration” tab, set baudrate to the Baudrate of the Xbee (default 9600), Flow Control = NONE, Data Bits = 8, Parity = NONE, StopBits=1.

If you have made Series 2 Xbee to API firmware, make sure to check “Enable API” in Host Setup tab 

Click “Test / Query” to see if software can recognize your Xbee.

If you had the bricked Series 2, now you can go back to step 5 and update it to API firmware.

Now you should be able to setup pin configuration, PAN ID and all the setting needed for Direct Xbee communication using X-CTU or simple serial port communication software using AT command.
