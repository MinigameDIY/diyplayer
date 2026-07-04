<script>
	// @ts-nocheck
	let { score, onButtonPressed } = $props();
	import { onMount, onDestroy } from "svelte";
</script>

<div class="endscreen-container">
    <div class="endscreen-overlay">
        <span class="end-text">
            GAME = ITS DONE GO HOME
        </span>
        <span class="score-text">
            scoar: {score}
        </span>
        <button onclick={() => { if (onButtonPressed)  onButtonPressed() }}>go home</button>
    </div>
</div>

<style>
	.endscreen-container {
		position: absolute;
		inset: 0;
		z-index: 10;

		width: 100%;
		height: 100%;
		
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		align-items: center;
		justify-items: center;
		pointer-events: none;
	}

	.endscreen-overlay {
		grid-column: 1;
		grid-row: 1;

		width: 100%;
		height: 100%;
		
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		pointer-events: none;

        background: #1a1a1a;
	}

    button {
        pointer-events: all;
		font-size: 1cqw;
    }

	.end-text {
		font-size: 2cqw;
		font-weight: 900;
		letter-spacing: 0.1em;
		color: white;
		text-align: center;
		text-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
	}

	.score-text {
		font-size: 2cqw;
		font-weight: 700;
		color: white;
		opacity: 0.9;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
	}
</style>
