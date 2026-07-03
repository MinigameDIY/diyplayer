<script>
	// @ts-nocheck
	import { onMount } from "svelte";
	import ScaffoldingPlayer from "$lib/ScaffoldingPlayer.svelte";
	import TransitionScreen from "$lib/TransitionScreen.svelte";
	import EndScreen from "$lib/EndScreen.svelte";
	import { projects, pickRandom } from "$lib/projects";

	const ROUND_DURATION = 8;

	const DEFAULT_LIVES = 4;

	let started = $state(false);
	let gameOver = $state(false);

	let player = $state("");
	let transition = $state("");
	let endScreen = $state("");

	let timeLeft = $state(ROUND_DURATION);

	let currentProject = $state("");
	let nextProject = $state("");

	let preloadReady = $state(false);
	let animationFrameId;
	let lastTime;

	let score = $state(0);
	let lives = $state(DEFAULT_LIVES);

	const fetchProject = async (path) => {
		const res = await fetch(path);
		return res.arrayBuffer();
	};

	const onReady = async () => {
		currentProject = pickRandom();
		const buf = await fetchProject(currentProject);

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

		if (result === "lose" && isStart !== true) lives--;

		const runTransition = async () => {
			player.pause();
			
			if (!isStart) {
				await transition.showResult(result);
			} else {
				await transition.showStart();
			}

			if (lives <= 0) {
				endGame();
			} else {
				currentProject = nextProject;

				player.loadProject().then(() => {
					transition.setInstruction(player.getInstruction());
				});

				await transition.showNext(score);

				player.start();

				startTimer();
				schedulePreload();
			}
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

	const endGame = () => {
		player.quitProject();
		gameOver = true;
	}

	const resetGame = () => {
		gameOver = false;
		started = false;
		lives = DEFAULT_LIVES;
		score = 0;
		currentProject = "";
		nextProject = "";
	}

	onMount(() => {
		return () => cancelAnimationFrame(animationFrameId);
	});

	
</script>

{#if !started}
	<button onclick={() => started = true}>start oit</button>
	
{:else}
	{#if !gameOver}
		<div class="hud">
			<span>⏱ {timeLeft.toFixed(1)}s</span>
		</div>
	{/if}
	<div class="stage-wrapper">
		{#if gameOver}
			<EndScreen bind:this={endScreen} score={score} onButtonPressed = {resetGame}></EndScreen>
		{:else}
			<ScaffoldingPlayer bind:this={player} onReady={onReady} onMinigameEnd={minigameEnded} />
			<TransitionScreen bind:this={transition} score={score} lives={lives} />
		{/if}
	</div>
{/if}

<style>
	.stage-wrapper {
		position: relative;
		width: 480px;
		height: 360px;
	}
</style>
