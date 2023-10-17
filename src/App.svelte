<script lang="ts">
  import { onMount } from "svelte";
  import { createScene } from "./lib/createScene";

  let container: HTMLElement;
  let rollFunc: () => Promise<number> | null;

  let rollResult: number | null;

  async function handleRollClick() {
    rollResult = null;
    if (rollFunc) {
      const res = await rollFunc();
      console.log(res);
      rollResult = res;
    }
  }

  onMount(async () => {
    rollFunc = await createScene(container);
  });
</script>

<main bind:this={container}>
  {#if rollResult}
    <div id="roll-result">{rollResult}</div>
  {/if}

  <button on:click={handleRollClick}> Roll </button>
</main>

<style>
  main {
    min-width: 600px;
    /* min-height: 400px; */
    height: 90%;
    position: relative;
  }

  button {
    position: absolute;
    bottom: 5%;
    padding: 1.5rem;
    letter-spacing: 0.3rem;
    text-transform: uppercase;
    font-size: 1.5rem;
  }

  #roll-result {
    position: absolute;
    width: 100%;
    font-size: 5rem;
    text-shadow: #555 2px 0 10px;
  }
</style>
