<script>
	// @ts-nocheck
	import { fly, fade } from 'svelte/transition';
	import { cubicOut, backOut } from 'svelte/easing';

	let { result, score = null } = $props(); // result: 'win' | 'lose' | null, score: number | null
</script>

{#if result !== null}
	<div
		class="transition-overlay {result}"
		in:fade={{ duration: 120 }}
		out:fade={{ duration: 200 }}
	>
		<span
			class="result-text"
			in:fly={{ y: -60, duration: 250, easing: backOut }}
			out:fly={{ y: 60, duration: 180, easing: cubicOut }}
		>
			{result === 'win' ? 'you ar winner' : 'you are losar'}
		</span>
		{#if score !== null}
			<span
				class="score-text"
				in:fly={{ y: 40, duration: 300, delay: 150, easing: backOut }}
				out:fly={{ y: 60, duration: 180, easing: cubicOut }}
			>
				{score}
			</span>
		{/if}
	</div>
{/if}

<style>
	.transition-overlay {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.win {
		background: #00ff88;
	}

	.lose {
		background: #ff3355;
	}

	.result-text {
		font-size: 5rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		color: white;
		text-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
	}

	.score-text {
		font-size: 2rem;
		font-weight: 700;
		color: white;
		opacity: 0.9;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
	}
</style>
