<script>
  let attached = [];

  export function attach(a) {
    console.assert(a !== null);
    console.assert(a.controller !== null);
    console.assert(a.controller.ready());

    attached.push(a);
    a.controller.attachSerial(this);
  }

  /**
   * @param {Controller} origin.
   * @param {number[]} value.
   */
  export function transmit(origin, value) {
    for (const part of attached) {
      if (part.controller !== origin) {
        console.log(`transmitting ${origin.name} -> ${part.name}`);
        part.controller.receive(value);
      }
    }
  }
</script>

<style>

</style>
