import 'dart:html';

import 'clock.dart';
import 'part.dart';

class Cpu extends Part {
  Clock clock;

  Cpu() {
    initController(8);
    clock = Clock();
    // clock.start();

    uiElement.id = 'cpu';
    uiElement.classes.add('cpu');

    var clockStep = ButtonElement();
    clockStep.innerText = 'step';
    clockStep.addEventListener('click', (event) {
      clock.next();
    });
    uiElement.children.add(clockStep);

    var clockStart = ButtonElement();
    clockStart.innerText = 'start';
    clockStart.addEventListener('click', (event) {
      clock.start();
    });
    uiElement.children.add(clockStart);

    var clockStop = ButtonElement();
    clockStop.innerText = 'stop';
    clockStop.addEventListener('click', (event) {
      clock.stop();
    });
    uiElement.children.add(clockStop);
  }

  void register(Part p) {
    clock.parts.add(p);
  }
}
