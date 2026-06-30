<script>
	// @ts-nocheck
	import { onMount, onDestroy } from "svelte";
	import TransitionScreen from "$lib/TransitionScreen.svelte";

	let { onReady } = $props();
	let container;
	let transitionState = $state(null); // { result: 'win'|'lose', score: number|null } | null
	let scaffolding = null;
	let preloadedBuffer = null;

	const STATUS_PROMISE_WAIT = 1;
	const STATUS_DONE = 4;

	const installPauseAddon = (s) => {
		const vm = s.vm;
		if (!vm) return;

		let paused = false;
		let pausedThreadState = new WeakMap();
		let audioContextStateChange = Promise.resolve();

		const setPaused = (_paused) => {
			paused = _paused;

			if (paused) {
				audioContextStateChange = audioContextStateChange.then(() =>
					vm.runtime.audioEngine?.audioContext?.suspend(),
				);

				if (!vm.runtime.ioDevices.clock._paused) {
					vm.runtime.ioDevices.clock.pause();
				}

				for (const thread of vm.runtime.threads) {
					if (!thread.updateMonitor && !pausedThreadState.has(thread)) {
						pausedThreadState.set(thread, {
							pauseTime: vm.runtime.currentMSecs,
							status: thread.status,
						});
						thread.status = STATUS_PROMISE_WAIT;
					}
				}

				vm.runtime.emit("PROJECT_RUN_STOP");
				vm.runtime.emit("RUNTIME_PAUSED");
			} else {
				audioContextStateChange = audioContextStateChange.then(() =>
					vm.runtime.audioEngine?.audioContext?.resume(),
				);

				vm.runtime.ioDevices.clock.resume();

				const now = Date.now();
				for (const thread of vm.runtime.threads) {
					const pauseState = pausedThreadState.get(thread);
					if (pauseState) {
						const dt = now - pauseState.pauseTime;
						const stackFrame = thread.peekStackFrame?.();

						if (stackFrame?.executionContext?.timer) {
							stackFrame.executionContext.timer.startTime += dt;
						}
						if (thread.compatibilityStackFrame?.timer) {
							thread.compatibilityStackFrame.timer.startTime += dt;
						}
						if (thread.timer) {
							thread.timer.startTime += dt;
						}

						thread.status = pauseState.status;
					}
				}
				pausedThreadState = new WeakMap();

				vm.runtime.emit("RUNTIME_UNPAUSED");
			}
		};

		const ensurePausedThreadIsStillPaused = (thread) => {
			if (thread.status === STATUS_DONE) return;
			const pauseState = pausedThreadState.get(thread);
			if (pauseState && thread.status !== STATUS_PROMISE_WAIT) {
				pauseState.status = thread.status;
				thread.status = STATUS_PROMISE_WAIT;
			}
		};

		const originalStepThreads = vm.runtime.sequencer.stepThreads;
		vm.runtime.sequencer.stepThreads = function () {
			if (paused) {
				for (const thread of this.runtime.threads) {
					ensurePausedThreadIsStillPaused(thread);
				}
			}
			return originalStepThreads.call(this);
		};

		const originalGreenFlag = vm.runtime.greenFlag;
		vm.runtime.greenFlag = function () {
			setPaused(false);
			return originalGreenFlag.call(this);
		};

		const originalStartHats = vm.runtime.startHats;
		vm.runtime.startHats = function (...args) {
			if (paused) return [];
			return originalStartHats.apply(this, args);
		};

		const originalGetMonitorThreadCount = vm.runtime._getMonitorThreadCount;
		vm.runtime._getMonitorThreadCount = function (threads) {
			let count = originalGetMonitorThreadCount.call(this, threads);
			if (paused) {
				for (const thread of threads) {
					if (pausedThreadState.has(thread)) count++;
				}
			}
			return count;
		};

		vm.setPaused = setPaused;
		vm.isPaused = () => paused;
	};

	onMount(() => {
		scaffolding = new window.Scaffolding.Scaffolding();
		scaffolding.width = 480;
		scaffolding.height = 360;
		scaffolding.resizeMode = "preserve-ratio";
		scaffolding.setup();
		scaffolding.appendTo(container);
		scaffolding.vm.setRuntimeOptions({ fencing: false, miscLimits: false, maxClones: Infinity });
		scaffolding.vm.setFramerate(60);
		scaffolding.renderer.setUseHighQualityRender(true);
		scaffolding.renderer?.resize(480, 360);
		scaffolding.vm?.runtime?.renderer?.resize?.(480, 360);
		installPauseAddon(scaffolding);
		onReady?.();
	});

	onDestroy(() => scaffolding?.destroy?.());

	function safeGetVariable(name, fallback = null) {
		try {
			return scaffolding?.getVariable?.(name) ?? fallback;
		} catch {
			return fallback;
		}
	}

	export const getGameState = () => {
		let stateVar = safeGetVariable("gameState", "neutral");
		if (stateVar === "neutral") {
			stateVar = scaffolding.vm?.runtime?.minigameData?.defaultGameState ?? "lose";
		}
		console.log(scaffolding.vm?.runtime?.minigameData);
		return stateVar;
	};

	export const preload = (buffer) => {
		preloadedBuffer = buffer;
	};
	
	export const showTransition = (result, score, onDone) => {
		scaffolding.vm?.setPaused?.(true);
		transitionState = { result, score };

		const holdTimer = new Promise(resolve => setTimeout(resolve, 3*1000));

		const loadProject = async () => {
			// small delay so the entry animation has a frame to actually show
			await new Promise(resolve => setTimeout(resolve, 100));
			if (preloadedBuffer) {
				scaffolding.stopAll();
				await scaffolding.loadProject(preloadedBuffer);
				preloadedBuffer = null;
			}
		};

		Promise.all([holdTimer, loadProject()]).then(() => {
			transitionState = null;
			setTimeout(onDone, 200);
		});
	};

	export const swap = () => {
		scaffolding.greenFlag();
	};

	// only runs at start
	export const loadAndStart = async (buffer) => {
		await scaffolding.loadProject(buffer);
		scaffolding.greenFlag();
	};

	export const pause = () => scaffolding?.vm?.setPaused?.(true);
	export const resume = () => scaffolding?.vm?.setPaused?.(false);
	export const togglePause = () => {
		const vm = scaffolding?.vm;
		if (!vm) return;
		vm.isPaused() ? vm.setPaused(false) : vm.setPaused(true);
	};
	export const isPaused = () => scaffolding?.vm?.isPaused?.() ?? false;
</script>

<div class="stage-wrapper">
	<div bind:this={container} class="slot"></div>
	<TransitionScreen result={transitionState?.result ?? null} score={transitionState?.score ?? null} />
</div>

<style>
	.stage-wrapper {
		position: relative;
		width: 480px;
		height: 360px;
	}
	.slot {
		width: 480px;
		height: 360px;
		overflow: hidden;
	}
	.slot :global(.sc-root),
	.slot :global(.sc-layers),
	.slot :global(.sc-canvas) {
		width: 480px !important;
		height: 360px !important;
	}
</style>
