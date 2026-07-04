<script>
	// @ts-nocheck
	let { score, lives, conductor } = $props();
	import { onMount, onDestroy } from "svelte";
	import { fly } from 'svelte/transition';

	import audioStart from "./assets/transition/transition_start.ogg?url";
	import audioNormal from "./assets/transition/transition.ogg?url";
	import audioWin from "./assets/transition/transition_win.ogg?url";
	import audioLose from "./assets/transition/transition_lose.ogg?url";
	import audioSpeed from "./assets/transition/transition_speed.ogg?url";

	let phase = $state(null);

	let instruction = $state("googoo");
	let showInstruction = $state(false);

	const LABELS = {
		start: "GET READY",
		next: "holdon im cooking",
		win: "you ar winner",
		lose: "you are losar",
		speed: "Speedy uop"
	};

	const AUDIO_BASE = "/transition";
	const AUDIO_SRC = {
		start: audioStart,
		normal: audioNormal,
		win: audioWin,
		lose: audioLose,
		speed: audioSpeed,
	};

	const START_HOLD_BEATS = 4;
	const NEXT_HOLD_BEATS = 4;
	const RESULT_HOLD_BEATS = 4;
	const SPEED_HOLD_BEATS = 4;

	const INSTRUCTION_HOLD_BEATS = 4;

	let audio = {};

	const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const holdBeats = (n) => wait(conductor.secToBeats(n));

	function playSound(name, speed = 1.0) {
		const el = audio[name];
		if (!el) return;
		
		el.loop = false;
		el.pause();
		el.currentTime = 0;

		el.playbackRate = speed;
		
		el.play().catch(() => {});
	}

	async function runPhase(nextPhase, soundName, holdBeatsCount) {
		phase = nextPhase;

		if (soundName) playSound(soundName, conductor.speed);

		if (nextPhase === "next") {
			await holdBeats(holdBeatsCount - (INSTRUCTION_HOLD_BEATS / 2));

			showInstructionText();

			await holdBeats((INSTRUCTION_HOLD_BEATS / 2));

			phase = null;
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
	export const showNext = () => runPhase("next", "normal", NEXT_HOLD_BEATS);
	export const showResult = (result) => runPhase(result, result === "win" ? "win" : "lose", RESULT_HOLD_BEATS);
	export const showSpeed = () => runPhase("speed", "speed", SPEED_HOLD_BEATS)

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
			<span class="hearts-text">
				{#each [...Array(lives)] as _, index}
					❤️
				{/each}
			</span>
			{#if phase === "next"}
				<span class="score-text">
					scoar: {score}
				</span>
			{/if}
		</div>
	{/if}

	{#if showInstruction}
		<span class="instruction-text" 
			in:fly={{ y: -200, duration: conductor.secToBeats(INSTRUCTION_HOLD_BEATS * 0.1) }}
			out:fly={{ y: 200, duration: conductor.secToBeats(INSTRUCTION_HOLD_BEATS * 0.1) }}
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
		width: 100%;
		height: 100%;
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
		font-size: 5cqw;
		font-weight: 900;
		color: white;
		-webkit-text-stroke: 0.2cqw black;
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

	.speed {
		background: #33beff;
	}

	.result-text {
		font-size: 3cqw;
		font-weight: 900;
		letter-spacing: 0.1em;
		color: white;
		text-align: center;
		text-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
	}

	.score-text, .hearts-text {
		font-size: 2cqw;
		font-weight: 700;
		color: white;
		opacity: 0.9;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
	}
</style>
