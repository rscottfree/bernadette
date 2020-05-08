import 'dart:async';

import 'part.dart';

class Clock {
  int _tick = 0;
  Timer _timer;
  final Set<Part> parts = {};

  int get tick {
    return _tick;
  }

  void next() {
    _tick++;
    print('tick ${_tick}');
    parts.forEach((element) {
      element.controller.processNext(_tick);
    });
  }

  int start() {
    next();

    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      next();
    });

    return _tick;
  }

  int stop() {
    if (_timer != null) {
      _timer.cancel();
    }

    return _tick;
  }
}
