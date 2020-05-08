import 'dart:html';

import 'chars.dart';
import 'part.dart';
import 'ram.dart';

class MonitorS100 extends Part with Ram {
  final _screenCharWidth = 20;
  final _screenCharHeight = 12;
  final _charPixels = 64;
  final _ramSize = 100;
  final _controllerStackSize = 1;

  MonitorS100() {
    initRam(_ramSize);
    initController(_controllerStackSize);

    uiElement.id = 'monitor-s100';
    uiElement.classes.add('monitor-s100');

    var sections = <DivElement>[];
    for (var i = 0; i < _screenCharWidth * _screenCharHeight; i++) {
      sections.add(_makeSection());
    }

    uiElement.children.addAll(sections);

    // Testing
    powerOn();
    for (var i = 0; i < _ramSize; i++) {
      _updateSection(i, _getChar(i));
    }
  }

  Iterable<int> _getChar(int i) {
    try {
      final start = i * _charPixels;
      final end = start + _charPixels;
      return chars.getRange(start, end);
    } on RangeError {
      return List(_charPixels);
    }
  }

  void _updateSection(int section, Iterable<int> input) {
    assert(section != null);
    assert(section < (_screenCharWidth * _screenCharHeight) - 1);
    assert(input.length == _charPixels);

    var pixels = uiElement.children.elementAt(section).children;
    for (var i = 0; i < input.length; i++) {
      if (input.elementAt(i) == 1) {
        pixels.elementAt(i).classes.remove('monitor-s100__pixel_off');
      } else {
        pixels.elementAt(i).classes.add('monitor-s100__pixel_off');
      }
    }
  }

  DivElement _makeSection() {
    var s = DivElement();
    s.classes.add('monitor-s100__section');

    for (var i = 0; i < _charPixels; i++) {
      s.children.add(_makePixel());
    }

    return s;
  }

  DivElement _makePixel() {
    var p = DivElement();
    p.classes.add('monitor-s100__pixel');
    p.classes.add('monitor-s100__pixel_off');
    return p;
  }
}
