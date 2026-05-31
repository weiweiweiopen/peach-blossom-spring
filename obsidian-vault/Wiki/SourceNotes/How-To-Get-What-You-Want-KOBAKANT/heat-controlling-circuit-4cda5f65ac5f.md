---
id: "source-note-htgwyw-htgwyw4cda5f65ac5f"
title: "Heat Controlling Circuit"
type: source
status: compiled-source-note
summary: "Compiled source note for Heat Controlling Circuit from How To Get What You Want / KOBAKANT. Key terms: circuit, heating, arduino, mosfet, schematic, heat, here, lab."
sourceRefs:
  - obsidian-vault/Sources/How To Get What You Want Full/Heat Controlling Circuit [2909].md
evidence:
  - "Here is the circuit schematics to control heating elements. I am using MOSFET as a digital switch to control on/off of the each heating element from Arduino digital out pins. The project I developed this circuit for uses multiple heating lines, therefor I am pulsing it with 100ms each. OpAmp and transistors are there to […]"
  - "Here is the circuit schematics to control heating elements."
  - "I am using MOSFET as a digital switch to control on/off of the each heating element from Arduino digital out pins."
  - "The project I developed this circuit for uses multiple heating lines, therefor I am pulsing it with 100ms each. OpAmp and transistors are there to open the MOSFET switch completely incase pulsing time was not enough."
  - "!! oops, there was a mistake on the above schematic. I was powering the opAmp with too less power, and pushing the mosFET gate with 5V when it actually needs 12V to fully open the gate. The above schematic configuration will still work since IRLML0030’s internal resistance is very small, but when I replaced mosFET to other kind (STP16NF06), it started to heat up the mosFET since the gate is not fully opening. The revised schematic is following. I have tested this one, and it works with STP16NF06 too."
relatedConcepts:
  - lab
relatedMethods:
relatedMaterials:
  - circuit
  - textile
relatedSocialForms:
  - lab
relatedProjects:
  - How To Get What You Want / KOBAKANT
openQuestions:
  - Which compiled concept or synthesis note should this source support?
---

# Heat Controlling Circuit

## Scope

This is a compiled source note for one raw source page from How To Get What You Want / KOBAKANT. It is part of the PBS Karpathy Core v1 source-note layer: raw sources remain immutable, while this note gives the runtime a durable, citable wiki page to query before synthesis.

## Source

- source family: `How To Get What You Want / KOBAKANT`
- sourceRef: `obsidian-vault/Sources/How To Get What You Want Full/Heat Controlling Circuit [2909].md`
- url: https://www.kobakant.at/DIY/?p=2909
- source card id: `htgwyw:4cda5f65ac5f`

## Evidence

- Here is the circuit schematics to control heating elements. I am using MOSFET as a digital switch to control on/off of the each heating element from Arduino digital out pins. The project I developed this circuit for uses multiple heating lines, therefor I am pulsing it with 100ms each. OpAmp and transistors are there to […] [1]
- Here is the circuit schematics to control heating elements. [1]
- I am using MOSFET as a digital switch to control on/off of the each heating element from Arduino digital out pins. [1]
- The project I developed this circuit for uses multiple heating lines, therefor I am pulsing it with 100ms each. OpAmp and transistors are there to open the MOSFET switch completely incase pulsing time was not enough. [1]
- !! oops, there was a mistake on the above schematic. I was powering the opAmp with too less power, and pushing the mosFET gate with 5V when it actually needs 12V to fully open the gate. The above schematic configuration will still work since IRLML0030’s internal resistance is very small, but when I replaced mosFET to other kind (STP16NF06), it started to heat up the mosFET since the gate is not fully opening. The revised schematic is following. I have tested this one, and it works with STP16NF06 too. [1]

## Terms

- circuit
- heating
- arduino
- mosfet
- schematic
- heat
- here
- lab
- textile
- voltage
- control
- digital
- each
- htgwyw

## Lint Notes

- This source note was generated deterministically from the local source card export.
- It is safe as a retrieval anchor, but claims still need stronger human/LLM review before promotion into concept, material, social-form, comparison, or synthesis notes.
- The raw source page was not modified.

## Citations

[1] `obsidian-vault/Sources/How To Get What You Want Full/Heat Controlling Circuit [2909].md`

## Open Questions

- What exact claim, if any, should this source contribute to the compiled PBS wiki?
