---
id: "source-note-htgwyw-htgwyw427189e9eb34"
title: "ATtiny: 7-Segment Display"
type: source
status: compiled-source-note
summary: "Compiled source note for ATtiny: 7-Segment Display from How To Get What You Want / KOBAKANT. Key terms: attiny, display, segment, circuit, htgwyw, leds, pin, pins."
sourceRefs:
  - obsidian-vault/Sources/How To Get What You Want Full/ATtiny - 7-Segment Display [3800].md
evidence:
  - "This circuit uses the ATtiny 8-pin microcontroller which has 5 I/O pins to create a 7-segment display. Since a 7-segment display only requires control of 7 individual LEDs, we use 4 of the ATtiny I/O pins as charlieplexed outputs (n*(n-1)). Leaving the the fifth I/O pin to be used as digital or analog input or […]"
  - "This circuit uses the ATtiny 8-pin microcontroller which has 5 I/O pins to create a 7-segment display. Since a 7-segment display only requires control of 7 individual LEDs, we use 4 of the ATtiny I/O pins as charlieplexed outputs (n*(n-1)). Leaving the the fifth I/O pin to be used as digital or analog input or another output."
  - "For some reason it is not working properly yet…"
  - "Front and back (LEDs mounted facing down):"
  - ">> https://github.com/plusea/CODE/blob/master/EXAMPLE%20CODE/a_tiny7Segment/a_tiny7Segment.ino"
relatedConcepts:
relatedMethods:
  - diy
relatedMaterials:
  - circuit
relatedSocialForms:
relatedProjects:
  - How To Get What You Want / KOBAKANT
openQuestions:
  - Which compiled concept or synthesis note should this source support?
---

# ATtiny: 7-Segment Display

## Scope

This is a compiled source note for one raw source page from How To Get What You Want / KOBAKANT. It is part of the PBS Karpathy Core v1 source-note layer: raw sources remain immutable, while this note gives the runtime a durable, citable wiki page to query before synthesis.

## Source

- source family: `How To Get What You Want / KOBAKANT`
- sourceRef: `obsidian-vault/Sources/How To Get What You Want Full/ATtiny - 7-Segment Display [3800].md`
- url: https://www.kobakant.at/DIY/?p=3800
- source card id: `htgwyw:427189e9eb34`

## Evidence

- This circuit uses the ATtiny 8-pin microcontroller which has 5 I/O pins to create a 7-segment display. Since a 7-segment display only requires control of 7 individual LEDs, we use 4 of the ATtiny I/O pins as charlieplexed outputs (n*(n-1)). Leaving the the fifth I/O pin to be used as digital or analog input or […] [1]
- This circuit uses the ATtiny 8-pin microcontroller which has 5 I/O pins to create a 7-segment display. Since a 7-segment display only requires control of 7 individual LEDs, we use 4 of the ATtiny I/O pins as charlieplexed outputs (n*(n-1)). Leaving the the fifth I/O pin to be used as digital or analog input or another output. [1]
- For some reason it is not working properly yet… [1]
- Front and back (LEDs mounted facing down): [1]
- >> https://github.com/plusea/CODE/blob/master/EXAMPLE%20CODE/a_tiny7Segment/a_tiny7Segment.ino [1]

## Terms

- attiny
- display
- segment
- circuit
- htgwyw
- leds
- pin
- pins
- code
- diy
- analog
- charlieplexed
- control
- create

## Lint Notes

- This source note was generated deterministically from the local source card export.
- It is safe as a retrieval anchor, but claims still need stronger human/LLM review before promotion into concept, material, social-form, comparison, or synthesis notes.
- The raw source page was not modified.

## Citations

[1] `obsidian-vault/Sources/How To Get What You Want Full/ATtiny - 7-Segment Display [3800].md`

## Open Questions

- What exact claim, if any, should this source contribute to the compiled PBS wiki?
