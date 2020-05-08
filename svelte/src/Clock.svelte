<script>

    let _tick = 0;
    let _on = false;
    let _parts = [];

    function getTick() {
        return _tick;
    }

    function clickStep() {
        if (_on) {
            return;
        }

        step();
    }

    export function register(...parts) {
        _parts.push(...parts);
        console.log('registered', _parts);
    }

    export function unregister(part) {
        _parts = _parts.filter(p => p !== part);
    }

    function step() {
        _tick++;
        _parts.forEach(part => {
            part.controller.processNext(_tick);
        });
    }

    function next() {
        if (_on) {
            step();
            window.requestAnimationFrame(next);
        }
    }

    function start() {
        if (_on === true) {
            return _tick;
        }

        _on = true;

        window.requestAnimationFrame(next);

        return _tick;
    }

    function stop() {
        _on = false;
        return _tick;
    }

</script>

<style>
    .clock {
        display: flex;
        justify-content: start;
        align-items: center;
    }

    .tick-counter {
        margin-left: 16px;
    }

    .start-stop {
        width: 60px;
    }
</style>

<div id="clock" class="clock">
    {#if !_on}
    <button type="button" class="start-stop" on:click={start}>Start</button>
    {/if}
    {#if _on}
    <button type="button" class="start-stop" on:click={stop}>Stop</button>
    {/if}
    <button type="button" disabled={_on} on:click={clickStep}>Step</button>
    {#if !_on}
    <div class="tick-counter">{_tick}</div>
    {/if}
</div>