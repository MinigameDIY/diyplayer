<script>
    // @ts-nocheck
    import { onMount } from "svelte";
    import ScaffoldingPlayer from "./ScaffoldingPlayer.svelte";
    import TransitionScreen from "./TransitionScreen.svelte";
    import EndScreen from "./EndScreen.svelte";
    import { Conductor } from "./Conductor.svelte";
    
    let { projectUrls = [] } = $props();

    const pickRandomProject = (excludeUrl = "") => {
        if (projectUrls.length === 0) return "";
        if (projectUrls.length === 1) return projectUrls[0];
        
        let filtered = projectUrls.filter(url => url !== excludeUrl);
        return filtered[Math.floor(Math.random() * filtered.length)];
    };

    const DEFAULT_LIVES = 4;
    const DEFAULT_SPEED_INCREASE = 1 / 12;
    const DEFAULT_MAX_SPEED = 2.5;
    const DEFAULT_MIN_SPEED = 0.5;

    const conductor = new Conductor(120);
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    let started = $state(false);
    let gameOver = $state(false);

    let player = $state("");
    let transition = $state("");
    let endScreen = $state("");

    let currentProject = $state("");
    let nextProject = $state("");

    let preloadReady = $state(false);
    let animationFrameId;

    let score = $state(0);
    let lives = $state(DEFAULT_LIVES);

    const fetchProject = async (path) => {
        const res = await fetch(path);
        return res.arrayBuffer();
    };

    const playerOnReady = async () => {
        conductor.minigameTimeoutCallback = minigameTimeout;
        conductor.start();
        
        currentProject = pickRandomProject();
        if (!currentProject) return;
        
        const buf = await fetchProject(currentProject);
        
        endRound(true);
        schedulePreload();

        conductor.player = player;
    };

    const schedulePreload = async () => {
        preloadReady = false;
        nextProject = pickRandomProject(currentProject);

        if (!nextProject) return;
        const buf = await fetchProject(nextProject);

        player.preload(buf);
        preloadReady = true;
    };

    const minigameTimeout = () => {
        endRound();
    };

    const minigameEnded = (state) => {
        if (conductor.time_left > 4.0) {
            const remainder = conductor.time_left - Math.round(conductor.time_left);
            conductor.time_left = 4 + (1 - remainder);
        }
    };

    const endRound = (isStart = false) => {
        cancelAnimationFrame(animationFrameId);
        const result = player.getGameState();

        score++;

        if (result === "lose" && isStart !== true) lives--;

        const runTransition = async () => {
            player.pause();
            conductor.reset();
            conductor.inMinigame = false;
            
            if (!isStart) {
                await transition.showResult(result);
            } else {
                await transition.showStart();
            }

            conductor.reset();

            if (lives <= 0) {
                endGame();
            } else {
                if (score % 5 == 0 && score !== 0 && conductor.speed < DEFAULT_MAX_SPEED) {
                    await transition.showSpeed();
                    conductor.speed = clamp(conductor.speed + DEFAULT_SPEED_INCREASE, DEFAULT_MIN_SPEED, DEFAULT_MAX_SPEED);
                }

                currentProject = nextProject;

                player.loadProject().then(() => {
                    transition.setInstruction(player.getInstruction());
                });

                await transition.showNext(score);

                player.start();
                conductor.reset();
                conductor.inMinigame = true;
                conductor.minigameLength = player.getMinigameLength();
                
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
        conductor.speed = 1.0;
        conductor.inMinigame = false;
        conductor.reset();
        player.quitProject();
        gameOver = true;
    };

    const resetGame = () => {
        conductor.speed = 1.0;
        conductor.inMinigame = false;
        conductor.stop();

        gameOver = false;
        started = false;

        lives = DEFAULT_LIVES;
        score = 0;

        currentProject = "";
        nextProject = "";
    };

    onMount(() => {
        return () => cancelAnimationFrame(animationFrameId);
    });
</script>

{#if !started}
    <button onclick={() => started = true}>start oit</button>
{:else}
    {#if !gameOver}
        <div class="hud">
            <span>{conductor?.time_left?.toFixed(1) ?? '0.0'}s</span>
        </div>
    {/if}
    <div class="stage-wrapper">
        {#if gameOver}
            <EndScreen bind:this={endScreen} score={score} onButtonPressed={resetGame}></EndScreen>
        {:else}
            <ScaffoldingPlayer bind:this={player} onReady={playerOnReady} onMinigameEnd={minigameEnded} />
            <TransitionScreen bind:this={transition} conductor={conductor} score={score} lives={lives} />
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