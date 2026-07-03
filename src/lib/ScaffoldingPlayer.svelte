<script>
	// @ts-nocheck
	import { onMount, onDestroy } from "svelte";

	let { onReady, onMinigameEnd } = $props();
	let container;
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

	const createScaffolding = () => {
		scaffolding = new window.Scaffolding.Scaffolding();
		scaffolding.width = 480;
		scaffolding.height = 360;
		scaffolding.resizeMode = "preserve-ratio";
		scaffolding.usePackagedRuntime = true;
		scaffolding.setup();
		scaffolding.appendTo(container);

		scaffolding.vm.runtime.minigameEndedCallback = function(event) {
			if (onMinigameEnd) {
				onMinigameEnd(event);
			}
		}

		scaffolding.vm.extensionManager.securityManager.rewriteExtensionURL = (extensionURL) => {
			let url = extensionURL;
			switch (extensionURL) {
				case "https://extensions.turbowarp.org/SharkPool/Camera.js":
					url = "extensions/Camera.js"
			}

			return Promise.resolve(url);
    	}

		installPauseAddon(scaffolding);
	}

	onMount(() => {
		createScaffolding();
		onReady?.();
	});

	onDestroy(() => scaffolding?.destroy?.());

	// use conductor to get it
	export const setSpeed = (value) => {
		scaffolding.vm.runtime.timeScale = value;
	}

	export const getMinigameLength = () => {
		return scaffolding.vm?.runtime?.minigameData?.length ?? 8.0;
	}

	export const getGameState = () => {
		let stateVar = scaffolding.vm?.runtime?.gameState ?? "neutral";
		if (stateVar === "neutral") {
			stateVar = scaffolding.vm?.runtime?.minigameData?.defaultGameState ?? "lose";
		}

		return stateVar;
	};

	export const getInstruction = () => {
		return scaffolding.vm?.runtime?.minigameData?.instruction ?? "Instruction failed to load :(";
	};

	export const preload = (buffer) => {
		preloadedBuffer = buffer;
	};

	export const loadProject = async (buffer) => {
		const buf = buffer ?? preloadedBuffer;
		preloadedBuffer = null;

		if (!buf) return;
		
		quitProject();
		await scaffolding.loadProject(buf);
	};

	export const quitProject = () => {
		scaffolding.stopAll();
		scaffolding.vm.quit();
	}

	export const start = () => scaffolding.greenFlag();
	export const stopAll = () => scaffolding?.stopAll?.();

	export const pause = () => scaffolding?.vm?.setPaused?.(true);
	export const resume = () => scaffolding?.vm?.setPaused?.(false);
	
	export const togglePause = () => {
		const vm = scaffolding?.vm;
		if (!vm) return;
		vm.isPaused() ? vm.setPaused(false) : vm.setPaused(true);
	};

	export const isPaused = () => scaffolding?.vm?.isPaused?.() ?? false;

</script>

<div bind:this={container} class="slot"></div>

<style>
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
