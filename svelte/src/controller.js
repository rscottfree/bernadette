export class Controller {
  constructor(stackSize, name) {
    this.name = name;
    this._stack = [];
    this._serial;
    this._stackSize = stackSize || 0;
  }

  ready() {
    return this._stack != null;
  }

  attachSerial(s) {
    this._serial = s;
  }

  send(value) { // value is list of int
    this._serial.transmit(this, value);
  }

  receive(value) { // value is list of int
    console.log('receive', value, this.name);
    console.assert(value != null, 'Controller received a null value');
    console.assert(this._stack != null, 'Controller stack is not initialized');
    console.assert(this._stackSize > 0, 'Controller stack size is not greater than 0');
    console.assert(this._stack.length < this._stackSize, `Controller stack overflow, no room to recieve value: ${value}`);
    this._stack.push(value);
  }

  processNext(tick) {
    if (this._stack.length > 0) {
      var value = this._stack.shift(0);
      console.log('processNext', value, this.name);
    }
  }
}
