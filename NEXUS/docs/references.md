# References

Technical background relevant to the concepts NEXUS's prototype
borrows from. No papers, benchmarks, or statistics are fabricated —
where a specific number or claim is not established, this document
says so rather than inventing one.

## Object detection (relevant to the future Live Perception Provider)

- TensorFlow.js official documentation and pre-trained model zoo:
  https://www.tensorflow.org/js/models
- The `coco-ssd` pre-trained model card (COCO-SSD object detection in
  the browser), distributed via `@tensorflow-models/coco-ssd`:
  https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd

## Web platform APIs used

- MediaDevices / `getUserMedia` (camera access):
  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Web Speech API / `SpeechRecognition` (voice input):
  https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

## Multi-criteria decision making (conceptual background for the evaluator)

The evaluator's weighted-sum scoring model is a simple instance of the
long-established **Weighted Sum Model (WSM)** family of multi-criteria
decision analysis (MCDA) methods. General background:

- Triantaphyllou, E. (2000). *Multi-Criteria Decision Making Methods:
  A Comparative Study.* Kluwer Academic Publishers. (Standard textbook
  covering WSM, AHP, and related methods — cited here for the general
  concept, not as a claim that NEXUS implements the full method set
  described in the book.)

## Explicit non-claims

This prototype does not claim novel published research, does not cite
a benchmark result of its own (none was run), and does not claim
compliance with any specific accessibility or safety standard. Any
future claim along those lines should be backed by an actual
measurement before being added here.
