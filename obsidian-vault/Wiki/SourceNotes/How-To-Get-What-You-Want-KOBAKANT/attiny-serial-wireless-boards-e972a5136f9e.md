---
id: "source-note-htgwyw-htgwywe972a5136f9e"
title: "ATtiny Serial & Wireless Boards!"
type: source
status: compiled-source-note
summary: "Compiled source note for ATtiny Serial & Wireless Boards! from How To Get What You Want / KOBAKANT. Key terms: pins, board, serial, sensor, arduino, attiny, code, data."
sourceRefs:
  - obsidian-vault/Sources/How To Get What You Want Full/ATtiny Serial & Wireless Boards! [4445].md
evidence:
  - "For projects with few i/o pins, using an ATtiny is a great alternative to Arduino boards. Using software serial allows you to send and receive data over the serial port via an FTDI board, and connecting to one of Sparkfun’s Bluetooth mate boards makes for a pretty streightforward wireless option. (You could also connect it […]"
  - "For projects with few i/o pins, using an ATtiny is a great alternative to Arduino boards. Using software serial allows you to send and receive data over the serial port via an FTDI board, and connecting to one of Sparkfun’s Bluetooth mate boards makes for a pretty streightforward wireless option. (You could also connect it to xBee.) The following ATtiny board design incorporates a 6-pin header that can be used both for programming (ISP) and serial communication (FTDI, Bluetooth)."
  - "ATtiny45/85 have 5 programmable i/o pins. Depending on your project, you might only need to send or receive data so you could only use one of these pins as either rx (receive) or tx (transmit) and have 4 i/o pins left to either read analog or digital input or write digital or PWM output. If you need to both send and receive data (rx, tx) then you still have 3 i/o pins left for in/output."
  - "ATtiny44/84 have 11 programmable i/o pins!!! And 8 of them can read analog input!"
  - "The following examples show various uses of ATtiny with software serial and a Bluetooth mate module to send or receive data wirelessly between the ATtiny and a Processing sketch."
relatedConcepts:
relatedMethods:
relatedMaterials:
  - sensor
relatedSocialForms:
relatedProjects:
  - How To Get What You Want / KOBAKANT
openQuestions:
  - Which compiled concept or synthesis note should this source support?
---

# ATtiny Serial & Wireless Boards!

## Scope

This is a compiled source note for one raw source page from How To Get What You Want / KOBAKANT. It is part of the PBS Karpathy Core v1 source-note layer: raw sources remain immutable, while this note gives the runtime a durable, citable wiki page to query before synthesis.

## Source

- source family: `How To Get What You Want / KOBAKANT`
- sourceRef: `obsidian-vault/Sources/How To Get What You Want Full/ATtiny Serial & Wireless Boards! [4445].md`
- url: https://www.kobakant.at/DIY/?p=4445
- source card id: `htgwyw:e972a5136f9e`

## Evidence

- For projects with few i/o pins, using an ATtiny is a great alternative to Arduino boards. Using software serial allows you to send and receive data over the serial port via an FTDI board, and connecting to one of Sparkfun’s Bluetooth mate boards makes for a pretty streightforward wireless option. (You could also connect it […] [1]
- For projects with few i/o pins, using an ATtiny is a great alternative to Arduino boards. Using software serial allows you to send and receive data over the serial port via an FTDI board, and connecting to one of Sparkfun’s Bluetooth mate boards makes for a pretty streightforward wireless option. (You could also connect it to xBee.) The following ATtiny board design incorporates a 6-pin header that can be used both for programming (ISP) and serial communication (FTDI, Bluetooth). [1]
- ATtiny45/85 have 5 programmable i/o pins. Depending on your project, you might only need to send or receive data so you could only use one of these pins as either rx (receive) or tx (transmit) and have 4 i/o pins left to either read analog or digital input or write digital or PWM output. If you need to both send and receive data (rx, tx) then you still have 3 i/o pins left for in/output. [1]
- ATtiny44/84 have 11 programmable i/o pins!!! And 8 of them can read analog input! [1]
- The following examples show various uses of ATtiny with software serial and a Bluetooth mate module to send or receive data wirelessly between the ATtiny and a Processing sketch. [1]

## Terms

- pins
- board
- serial
- sensor
- arduino
- attiny
- code
- data
- processing
- boards
- receive
- uses
- both
- design

## Lint Notes

- This source note was generated deterministically from the local source card export.
- It is safe as a retrieval anchor, but claims still need stronger human/LLM review before promotion into concept, material, social-form, comparison, or synthesis notes.
- The raw source page was not modified.

## Citations

[1] `obsidian-vault/Sources/How To Get What You Want Full/ATtiny Serial & Wireless Boards! [4445].md`

## Open Questions

- What exact claim, if any, should this source contribute to the compiled PBS wiki?
