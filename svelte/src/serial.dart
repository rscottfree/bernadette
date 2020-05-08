import 'controller.dart';
import 'part.dart';

class Serial {
  Part _a;
  Part _b;

  void attachA(Part a) {
    assert(a != null);
    assert(a.controller.ready());

    _a = a;
    _a.controller.attachSerial(this);
  }

  void attachB(Part b) {
    assert(b != null);
    assert(b.controller.ready());

    _b = b;
    _b.controller.attachSerial(this);
  }

  void transmit(Controller origin, List<int> value) {
    if (_a.controller == origin) {
      _b.controller.receive(value);
    } else if (_b.controller == origin) {
      _a.controller.receive(value);
    }
  }
}
