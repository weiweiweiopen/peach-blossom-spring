---
id: "source-note-htgwyw-htgwyw7628858a45a4"
title: "Voltage Divider"
type: source
status: compiled-source-note
summary: "Compiled source note for Voltage Divider from How To Get What You Want / KOBAKANT. Key terms: resister, voltage, sensor, arduino, can, connected, set, two."
sourceRefs:
  - obsidian-vault/Sources/How To Get What You Want Full/Voltage Divider [6102].md
evidence:
  - "So much of a theory, let’s try this to see if it really works. Here is an experiment with two resister with a multumeter.The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to […]"
  - "So much of a theory, let’s try this to see if it really works. Here is an experiment with two resister with a multumeter. The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to 0V (GND) of the power supply and the middle point where two resisters meet. You can see 2.44 in the multilmeter’s display. (almost 2.5V.. maybe the resister had some range) It divides the 5V in 50/50..."
  - "In the second experiment, I changed one of the resister to 47kohm. So now the ratio of two resisters are 10/47. So, I should read 5V x 10/(10+47) = 0.877 V in theory. As you can see in multimeter, it is 0.85V it measures. Not bad!"
  - "Now, if you change one of the resister to our resistive textile sensor, it works the same. The felt sensor I tested here has about 8kohm – 100kohm resistance range. You can see how the voltage that gets divided in the middle changes as I manipulate the felt. Now, if you connect the point where multimeter is reading to the Arduino Analog input, we can read how much voltage comes in."
  - "Here is a diagram of how the resistive sensor can be connected with Arduino."
relatedConcepts:
relatedMethods:
  - experiment
relatedMaterials:
  - sensor
  - textile
relatedSocialForms:
relatedProjects:
  - How To Get What You Want / KOBAKANT
openQuestions:
  - Which compiled concept or synthesis note should this source support?
---

# Voltage Divider

## Scope

This is a compiled source note for one raw source page from How To Get What You Want / KOBAKANT. It is part of the PBS Karpathy Core v1 source-note layer: raw sources remain immutable, while this note gives the runtime a durable, citable wiki page to query before synthesis.

## Source

- source family: `How To Get What You Want / KOBAKANT`
- sourceRef: `obsidian-vault/Sources/How To Get What You Want Full/Voltage Divider [6102].md`
- url: https://www.kobakant.at/DIY/?p=6102
- source card id: `htgwyw:7628858a45a4`

## Evidence

- So much of a theory, let’s try this to see if it really works. Here is an experiment with two resister with a multumeter.The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to […] [1]
- So much of a theory, let’s try this to see if it really works. Here is an experiment with two resister with a multumeter. The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to 0V (GND) of the power supply and the middle point where two resisters meet. You can see 2.44 in the multilmeter’s display. (almost 2.5V.. maybe the resister had some range) It divides the 5V in 50/50... [1]
- In the second experiment, I changed one of the resister to 47kohm. So now the ratio of two resisters are 10/47. So, I should read 5V x 10/(10+47) = 0.877 V in theory. As you can see in multimeter, it is 0.85V it measures. Not bad! [1]
- Now, if you change one of the resister to our resistive textile sensor, it works the same. The felt sensor I tested here has about 8kohm – 100kohm resistance range. You can see how the voltage that gets divided in the middle changes as I manipulate the felt. Now, if you connect the point where multimeter is reading to the Arduino Analog input, we can read how much voltage comes in. [1]
- Here is a diagram of how the resistive sensor can be connected with Arduino. [1]

## Terms

- resister
- voltage
- sensor
- arduino
- can
- connected
- set
- two
- experiment
- here
- kohm
- pull
- see
- textile

## Lint Notes

- This source note was generated deterministically from the local source card export.
- It is safe as a retrieval anchor, but claims still need stronger human/LLM review before promotion into concept, material, social-form, comparison, or synthesis notes.
- The raw source page was not modified.

## Citations

[1] `obsidian-vault/Sources/How To Get What You Want Full/Voltage Divider [6102].md`

## Open Questions

- What exact claim, if any, should this source contribute to the compiled PBS wiki?
