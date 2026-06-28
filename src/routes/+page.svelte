<script>
	// @ts-nocheck
	import { onMount } from "svelte";
	import ScaffoldingPlayer from "$lib/ScaffoldingPlayer.svelte";
	import { projects, pickRandom } from "$lib/projects";

	const ROUND_DURATION = 8;

	let player;
	let timeLeft = $state(ROUND_DURATION);
	let currentProject = $state("");
	let nextProject = $state("");
	let preloadReady = $state(false);
	let started = $state(false);
	let animationFrameId;
	let lastTime;

	const fetchProject = async (path) => {
		const res = await fetch(path);
		return res.arrayBuffer();
	};

	const onReady = async () => {
		const first = pickRandom();
		currentProject = first;
		const buf = await fetchProject(first);
		await player.loadAndStart(buf);
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

	const startTimer = () => {
		timeLeft = ROUND_DURATION;
		cancelAnimationFrame(animationFrameId);
		lastTime = performance.now();
		animationFrameId = requestAnimationFrame(updateTimer);
	};

	const endRound = () => {
		cancelAnimationFrame(animationFrameId);
		const result = player.getGameState();
		const score = 999;

		const runTransition = () => {
			player.showTransition(result, score, () => {
				currentProject = nextProject;
				player.swap();
				startTimer();
				schedulePreload();
			});
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

	started = true;
</script>

{#if !started}
	<p>Loading...</p>
{:else}
	<div class="hud">
		<span>⏱ {timeLeft.toFixed(1)}s</span>
	</div>
	<ScaffoldingPlayer bind:this={player} {onReady} />
{/if}
