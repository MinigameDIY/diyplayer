<script>
	// @ts-nocheck
	import { onMount, onDestroy } from "svelte";
	import { fly } from 'svelte/transition';

	// phase: 'start' | 'next' | 'win' | 'lose' | null
	let phase = $state(null);
	let score = $state(null);

	let instruction = $state("googoo");
	let showInstruction = $state(false);

	const LABELS = {
		start: "GET READY",
		next: "holdon im cooking",
		win: "you ar winner",
		lose: "you are losar",
	};

	const AUDIO_BASE = "/transition";
	const AUDIO_SRC = {
		start: `${AUDIO_BASE}/transition_start.ogg`,
		normal: `${AUDIO_BASE}/transition.ogg`,
		win: `${AUDIO_BASE}/transition_win.ogg`,
		lose: `${AUDIO_BASE}/transition_lose.ogg`,
		speed: `${AUDIO_BASE}/transition_speed.ogg`,
	};

	const BPM = 120;
	const SEC_PER_BEAT = 60 / BPM;
	const beats = (n) => n * SEC_PER_BEAT * 1000;

	const START_HOLD_BEATS = 4;
	const NEXT_HOLD_BEATS = 4;
	const RESULT_HOLD_BEATS = 4;

	const INSTRUCTION_HOLD_BEATS = 4;

	let audio = {};

	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const holdBeats = (n) => wait(beats(n));

	function playSound(name) {
		const el = audio[name];
		if (!el) return;
		
		el.loop = false;
		el.pause();
		el.currentTime = 0;
		
		el.play().catch(() => {});
	}

	async function runPhase(nextPhase, soundName, holdBeatsCount, nextScore = null) {
		phase = nextPhase;
		score = nextScore;

		console.log(phase);

		if (soundName) playSound(soundName);

		if (nextPhase === "next") {
			await holdBeats(holdBeatsCount - (INSTRUCTION_HOLD_BEATS / 2));

			showInstructionText();

			await holdBeats((INSTRUCTION_HOLD_BEATS / 2));

			phase = null;
			score = null;
		} else {
			await holdBeats(holdBeatsCount);
		}
	}

	async function showInstructionText() {
		showInstruction = true;
		await holdBeats(INSTRUCTION_HOLD_BEATS);

		showInstruction = false;
		instruction = null;
	}

	export const setInstruction = (newInstruction) => {
		instruction = newInstruction;
	}

	export const showStart = () => runPhase("start", "start", START_HOLD_BEATS);
	export const showNext = (score = 0) => runPhase("next", "normal", NEXT_HOLD_BEATS, score)
	export const showResult = (result) => runPhase(result, result === "win" ? "win" : "lose", RESULT_HOLD_BEATS);

	onMount(() => {
		for (const [name, src] of Object.entries(AUDIO_SRC)) {
			const el = new Audio(src);
			el.preload = "auto";
			audio[name] = el;
		}
	});

	onDestroy(() => {
		for (const el of Object.values(audio)) {
			el.pause();
		}
	});
</script>

<div class="transition-container">
	{#if phase !== null}
		<div class="transition-overlay {phase}">
			<span class="result-text">
				{LABELS[phase] ?? ""}
			</span>
			{#if score !== null}
				<span class="score-text">
					scoar: {score}
				</span>
			{/if}
		</div>
	{/if}

	{#if showInstruction}
		<span class="instruction-text" 
			in:fly={{ y: -200, duration: beats(INSTRUCTION_HOLD_BEATS) * 0.1 }}
			out:fly={{ y: 200, duration: beats(INSTRUCTION_HOLD_BEATS) * 0.1 }}
		>
			{instruction}
		</span>
	{/if}
</div>

<style>
	.transition-container {
		position: absolute;
		inset: 0;
		z-index: 10;

		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		align-items: center;
		justify-items: center;
		pointer-events: none;
	}

	.transition-overlay {
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
	}

	.instruction-text {
		grid-column: 1;
		grid-row: 1;
		z-index: 20;
		
		font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		font-size: 3rem;
		font-weight: 900;
		color: white;
		-webkit-text-stroke: 2px black;
		text-align: center;
		pointer-events: none;
	}

	.start {
		background: #3355ff;
	}

	.next {
		background: #1a1a1a;
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
		text-align: center;
		text-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
	}

	.next .result-text,
	.start .result-text {
		font-size: 3rem;
	}

	.score-text {
		font-size: 2rem;
		font-weight: 700;
		color: white;
		opacity: 0.9;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
	}
</style>
