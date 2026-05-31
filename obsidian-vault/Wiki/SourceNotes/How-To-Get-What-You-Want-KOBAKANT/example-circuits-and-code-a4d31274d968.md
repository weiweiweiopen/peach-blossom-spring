---
id: "source-note-htgwyw-htgwywa4d31274d968"
title: "Example Circuits and Code"
type: source
status: compiled-source-note
summary: "Compiled source note for Example Circuits and Code from How To Get What You Want / KOBAKANT. Key terms: int, led, textile, arduino, delay, sensor, void, code."
sourceRefs:
  - obsidian-vault/Sources/How To Get What You Want Full/Example Circuits and Code [6315].md
evidence:
  - "A collection of simple example circuits that demonstrate the use of textile sensors and e-textile circuit techniques in combination with microcontroller programming."
  - "A collection of simple example circuits that demonstrate the use of textile sensors and e-textile circuit techniques in combination with microcontroller programming."
  - "Flickr set >> https://www.flickr.com/photos/plusea/albums/72157670530066984"
  - "for (int i = 0; i < 6; i++) { pinMode(petals[i], INPUT_PULLUP); } pinMode(speaker, OUTPUT); Serial.begin(9600); }"
  - "for (int i = 0; i < 6; i++) { if (digitalRead(petals[i]) == 0) { tone(speaker, (i+1) * 1000, 500); delay(500); } else digitalWrite(speaker, HIGH); }"
relatedConcepts:
relatedMethods:
relatedMaterials:
  - textile
  - sensor
  - circuits
  - e-textile
relatedSocialForms:
relatedProjects:
  - How To Get What You Want / KOBAKANT
openQuestions:
  - Which compiled concept or synthesis note should this source support?
---

# Example Circuits and Code

## Scope

This is a compiled source note for one raw source page from How To Get What You Want / KOBAKANT. It is part of the PBS Karpathy Core v1 source-note layer: raw sources remain immutable, while this note gives the runtime a durable, citable wiki page to query before synthesis.

## Source

- source family: `How To Get What You Want / KOBAKANT`
- sourceRef: `obsidian-vault/Sources/How To Get What You Want Full/Example Circuits and Code [6315].md`
- url: https://www.kobakant.at/DIY/?p=6315
- source card id: `htgwyw:a4d31274d968`

## Evidence

- A collection of simple example circuits that demonstrate the use of textile sensors and e-textile circuit techniques in combination with microcontroller programming. [1]
- A collection of simple example circuits that demonstrate the use of textile sensors and e-textile circuit techniques in combination with microcontroller programming. [1]
- Flickr set >> https://www.flickr.com/photos/plusea/albums/72157670530066984 [1]
- for (int i = 0; i < 6; i++) { pinMode(petals[i], INPUT_PULLUP); } pinMode(speaker, OUTPUT); Serial.begin(9600); } [1]
- for (int i = 0; i < 6; i++) { if (digitalRead(petals[i]) == 0) { tone(speaker, (i+1) * 1000, 500); delay(500); } else digitalWrite(speaker, HIGH); } [1]

## Terms

- int
- led
- textile
- arduino
- delay
- sensor
- void
- code
- digitalwrite
- circuits
- e-textile
- example
- htgwyw
- pinmode

## Lint Notes

- This source note was generated deterministically from the local source card export.
- It is safe as a retrieval anchor, but claims still need stronger human/LLM review before promotion into concept, material, social-form, comparison, or synthesis notes.
- The raw source page was not modified.

## Citations

[1] `obsidian-vault/Sources/How To Get What You Want Full/Example Circuits and Code [6315].md`

## Open Questions

- What exact claim, if any, should this source contribute to the compiled PBS wiki?
