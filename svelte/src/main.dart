import 'dart:html';

import 'cpu.dart';
import 'keyboard.dart';
import 'monitor_s100.dart';
import 'serial.dart';

void main() {
  var output = querySelector('#output');

  var monitor = MonitorS100();
  output.children.add(monitor.uiElement);

  var monitorSerial = Serial();
  monitorSerial.attachA(monitor);

  var keyboard = Keyboard();
  monitorSerial.attachB(keyboard);

  var cpu = Cpu();
  output.children.add(cpu.uiElement);
  cpu.register(monitor);
  cpu.register(keyboard);

  keyboard.controller.send([0, 0]);
  // keyboard.controller.send([1, 1]);
}
