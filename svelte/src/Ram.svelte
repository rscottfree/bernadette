<script>

  export let size;
  export let internalSize;

  internalSize = parseInt(internalSize);

  console.assert(typeof size === 'number');
  console.assert(size > 0);
  console.assert(typeof internalSize === 'number', typeof internalSize);
  console.assert(internalSize > 0);

  let _memory; // array of int
  // size = size; // int
  // internalSize = internalSize;

  _memory = new Array(size);
  _memory.fill(new Array(internalSize).fill(0));

  /**
    * @param {number} address
    * @return {number}
    */
  export function peek(address) { // address: int; return int
    console.assert(typeof address === 'number');
    console.assert(address < _memory.length);

    return _memory[address] || [];
  }

  /**
    *
    * @param {number} address
    * @param {number} value
    * @return {number}
    */
  export function poke(address, value) {
    console.assert(typeof address === 'number');
    console.assert(address != null);
    console.assert(address < _memory.length);
    console.assert(typeof value === 'object', 'wrong type', typeof value, value);

    const previous = _memory[address];
    _memory[address] = value;

    return previous;
  }

</script>

<style>
  .ram {
    margin-left: 10px;
    width: 50px;
    height: 92px;
    background-color: darkgray;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

<div class="ram">
  <div>RAM</div>
</div>