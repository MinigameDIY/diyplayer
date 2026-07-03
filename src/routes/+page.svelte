<script>
	// @ts-nocheck
	import { onMount } from "svelte";
	import ScaffoldingPlayer from "$lib/ScaffoldingPlayer.svelte";
	import TransitionScreen from "$lib/TransitionScreen.svelte";
	import { projects, pickRandom } from "$lib/projects";

	const ROUND_DURATION = 8;

	let started = $state(false);

	let player = $state("");
	let transition = $state("");
	let timeLeft = $state(ROUND_DURATION);
	let currentProject = $state("");
	let nextProject = $state("");
	let preloadReady = $state(false);
	let animationFrameId;
	let lastTime;

	let score = $state(0);

	const fetchProject = async (path) => {
		const res = await fetch(path);
		return res.arrayBuffer();
	};

	const onReady = async () => {
		const first = pickRandom();
		currentProject = first;
		const buf = await fetchProject(first);

		endRound(true);

		schedulePreload();
		startTimer();
	};

	const schedulePreload = async () => {
		preloadReady = false;
		nextProject = pickRandom(currentProject);

		const buf = await fetchProject(nextProject);

		player.preload(buf);
		preloadReady = true;
	};

	const updateTimer = () => {
		const now = performance.now();
		const deltaTime = (now - lastTime) / 1000;
		lastTime = now;
		timeLeft -= deltaTime;

		if (timeLeft <= 0) {
			timeLeft = 0;
			endRound();
		} else {
			animationFrameId = requestAnimationFrame(updateTimer);
		}
	};

	const minigameEnded = (state) => {
		if (timeLeft > 4.0) {
			const remainder = timeLeft - Math.round(timeLeft)
			timeLeft = 4 + (1 - remainder)
		}
	}

	const startTimer = () => {
		timeLeft = ROUND_DURATION;
		cancelAnimationFrame(animationFrameId);
		lastTime = performance.now();
		animationFrameId = requestAnimationFrame(updateTimer);
	};

	const endRound = (isStart = false) => {
		cancelAnimationFrame(animationFrameId);
		const result = player.getGameState();

		score++;

		const runTransition = async () => {
			player.pause();
			
			if (!isStart) {
				await transition.showResult(result);
			} else {
				await transition.showStart();
			}

			currentProject = nextProject;

			player.loadProject().then(() => {
				transition.setInstruction(player.getInstruction());
			});

			await transition.showNext(score);

			player.start();

			startTimer();
			schedulePreload();
		};

		if (!preloadReady) {
			const wait = setInterval(() => {
				if (preloadReady) {
					clearInterval(wait);
					runTransition();
				}
			}, 50);
		} else {
			runTransition();
		}
	};

	onMount(() => {
		return () => cancelAnimationFrame(animationFrameId);
	});

	
</script>

{#if !started}
	<button onclick={() => started = true}>start oit</button>
{:else}
	<div class="hud">
		<span>⏱ {timeLeft.toFixed(1)}s</span>
	</div>
	<div class="stage-wrapper">
		<ScaffoldingPlayer bind:this={player} onReady={onReady} onMinigameEnd={minigameEnded} />
		<TransitionScreen bind:this={transition} />
	</div>
{/if}

<style>
	.stage-wrapper {
		position: relative;
		width: 480px;
		height: 360px;
	}
</style>
