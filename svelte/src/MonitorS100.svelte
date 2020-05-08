<script>
  import { Controller } from './controller.js';
  import { chars } from './chars.js';

  const _screenCharWidth = 20;
  const _screenCharHeight = 12;
  const _charPixels = 64;
  const _ramSize = 100;
  const _controllerStackSize = 1;
  let _power = false;
  const controller = new Controller(1);


  const sections = [];
  for (let i = 0; i < _screenCharWidth * _screenCharHeight; i++) {
    const section = [];
    for (let i = 0; i < _charPixels; i++) {
      section.push(0);
    }
    sections.push(section);
  }

  for (var i = 0; i < _ramSize; i++) {
    _updateSection(i, _getChar(i));
  }

  function _getChar(i) { // return list of int; i = int
    try {
      const start = i * _charPixels;
      const end = start + _charPixels;
      return chars.slice(start, end);
    } catch(e) {
      return Array(_charPixels).fill(0);
    }
  }

  function _updateSection(section, input) {
    console.assert(section != null);
    console.assert(section < (_screenCharWidth * _screenCharHeight) - 1);
    console.assert(input.length == _charPixels);

    var pixels = sections[section];
    for (var i = 0; i < input.length; i++) {
      pixels[i] = input[i];
    }
  }
</script>

<div id="monitor-s100" class="monitor-s100">
  {#each sections as section}
    <div class="monitor-s100__section">
      {#each section as pixel}
        <div
          class="monitor-s100__pixel"
          class:monitor-s100__pixel_off={pixel == 0} />
      {/each}
    </div>
  {/each}
</div>


<style>
  /*
amber: #FFBF00
green: #238823
dark green: #007000
forest green: #238823
*/

  .monitor-s100 {
    --pixel-color: hsl(120, 60%, 70%);

    width: 500px;
    height: 288px;
    border: 1px solid white;
    background-color: #000;
    border: 10px solid #000;
    display: flex;
    flex-wrap: wrap;
  }

  .monitor-s100__section {
    width: 24px;
    height: 24px;
    display: flex;
    flex-wrap: wrap;
    /* filter: brightness(120%); */
    /* filter: blur(0.5px); */
  }

  .monitor-s100__pixel {
    /* filter: blur(0.3px); */
    width: 3px;
    height: 3px;
    box-sizing: border-box;
    background-color: var(--pixel-color);
    /* margin: 0.5px; */
    box-shadow: 0px 0px 9px 1px rgba(34, 139, 34, 0.8);
    /* forestgreen */
    /* padding: 1px; */
    border-radius: 1px;
    border: 1px solid rgba(34, 139, 34, 0.6);
    /* var(--pixel-color); */
  }

  .monitor-s100__pixel_off {
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;
  }
</style>

