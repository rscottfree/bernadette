import 'dart:html';

import 'controller.dart';

abstract class Part {
  DivElement uiElement = DivElement();
  Controller controller;
  bool _power = false;

  void initController(int stackSize) {
    controller = Controller(stackSize);
  }

  void powerOn() {
    _power = true;
  }

  void powerOff() {
    _power = false;
  }

  bool hasPower() {
    return _power;
  }
}
