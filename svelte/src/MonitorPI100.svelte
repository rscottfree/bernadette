<script>
  import { Controller } from './controller';
  import Ram from './Ram.svelte';
  import { chars } from './chars.js';
  import { onMount } from 'svelte';

  const _screenCharWidth = 11;
  const _screenCharHeight = 3;
  const _charPixels = 64;
  const _ramSize = _screenCharWidth * _screenCharHeight; // one unit per "section" or character
  const _numChars = 96; // number if characters in library
  let _power = false;
  export const name = 'monitorPI100';
  export const controller = new Controller(1, name);
  // const ram = new Ram(_screenCharWidth * _screenCharHeight, 64); // 240
  let drawQueue = [];

  let ram;


  let sections = [];
  for (let i = 0; i < _screenCharWidth * _screenCharHeight; i++) {
    const section = [];
    for (let i = 0; i < _charPixels; i++) {
      section.push(0);
    }
    sections.push(section);
  }

  function displayRandomChars() {
    let tt = 33;
    let rc = function() {
      tt-=1;
      if (tt < 0) {
        return;
      }

      for (let j = 0; j < 1; j++) {
        let c = randomNumber(0, _numChars + 1);
        let s = randomNumber(0, sections.length);
        _updateRam(s, _getChar(c));
      }
      window.requestAnimationFrame(rc);
    }

    window.requestAnimationFrame(rc);
  }

  displayRandomChars();

  function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }


  function screenStepFn() {
    const charsPerStep = 1;

    for (let i = 0; i < charsPerStep; i++) {
      const s = drawQueue.shift();
      if (s === undefined || s > _ramSize - 1) {
        return;
      }

      _updateSection(s, ram.peek(s));
    }

    if (drawQueue.length > 0) {
      window.requestAnimationFrame(screenStepFn);
    }
  }

  function addToDrawQueue(address) {
    if (drawQueue.indexOf(address) === -1) {
      drawQueue.push(address);
    }
    if (drawQueue.length === 1) {
      window.requestAnimationFrame(screenStepFn);
    }
  }

  /**
   * @param {number} i
   * @return {number[]}
   */
  function _getChar(i) {
    try {
      const start = i * _charPixels;
      const end = start + _charPixels;
      return chars.slice(start, end);
    } catch(e) {
      return Array(_charPixels).fill(0);
    }
  }

  /**
   * @param {number} address
   * @param {number[]} input
   */
  function _updateRam(address, input) {
    console.assert(address != null);
    console.assert(address < (_screenCharWidth * _screenCharHeight), address, (_screenCharWidth * _screenCharHeight) - 1);
    console.assert(input.length == _charPixels, input.length, _charPixels);

    ram.poke(address, input);
    addToDrawQueue(address);
  }

  /**
   * @param {number} section
   * @param {number[]} input
   */
  function _updateSection(section, input) {
    if (!input) {
      return;
    }

    console.assert(section != null);
    console.assert(section < (_screenCharWidth * _screenCharHeight), section, (_screenCharWidth * _screenCharHeight) - 1);
    console.assert(input.length === _charPixels, input.length, _charPixels);

    sections[section] = input;
  }
</script>

<div style="display: flex;">
  <div id="monitor-s100" class="monitor-s100"
    style="width: {_screenCharWidth * 8 * 3}px; height: {_screenCharHeight * 8 * 3}px;">
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

  <Ram size={_screenCharWidth * _screenCharHeight} internalSize=64 bind:this={ram} />
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

    width: 480px;
    height: 288px;
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
    box-shadow: 0px 0px 9px 1px rgba(34, 139, 34, 0.8);
    border-radius: 1px;
    border: 1px solid rgba(34, 139, 34, 0.6);
  }

  .monitor-s100__pixel_off {
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;
  }
</style>

