<script>
  import MonitorPI100 from "./MonitorPI100.svelte";
  import Serial from "./Serial.svelte";
  import Keyboard from "./Keyboard.svelte";
  import Clock from "./Clock.svelte";

  import { onMount } from 'svelte';

  let m; // monitor
  let ms; // monitor serial

  let c; // clock;

  let k; // keyboard

  onMount(() => {
    start();
  });

  function start() {
    ms.attach(m);
    ms.attach(k);

    c.register(m);

    k.controller.send([1, 1]);
    // k.controller.send([2, 2]);
  }
</script>

<style>

</style>

<main>
  <Clock bind:this={c}/>
  <MonitorPI100 bind:this={m}/>
  <Serial bind:this={ms}/>
  <Keyboard bind:this={k}/>
</main>
