// @ts-nocheck
export class Conductor {
	bpm = $state(120);
	player = $state(null);
	_speed = $state(1.0);

	minigameLength = $state(0);
	inMinigame = $state(false);

	paused = $state(false);
	
	song_position = $state(0);
	_last_song_position = $state(0);

	_last_reported_step = $state(-1);
	
	minigameTimeoutCallback = null;
	
	secToBeats = (n) => n * ((this.secPerBeat * 1000) / this.speed);

	secPerBeat = $derived(
		60 / this.bpm
	)

	cur_step = $derived(
		this.secPerBeat > 0 ? this.song_position / (this.secPerBeat / 4) : 0
	)

	cur_beat = $derived(
		this.cur_step / 4
	)

	get time_left() {
		return this.minigameLength - this.cur_beat;
	}

	set time_left(value) {
		this.minigameLength = value + this.cur_beat;
	}

	get speed() {
		return this._speed;
	}

	set speed(value) {
		this._speed = value;
		this.player.setSpeed(value);
	}

	constructor(bpm) {
		this.bpm = bpm;
	}

	start() {
		this._lastTime = performance.now();
		this._frameId = requestAnimationFrame((timestamp) => this._loop(timestamp));
	}

	stop() {
		if (this._frameId !== null) {
			cancelAnimationFrame(this._frameId)
		}
	}

	reset() {
		this.song_position = 0;
		this._last_song_position = 0;
		this.minigameLength = 0;
	}


	_loop(timestamp) {
		const delta = (timestamp - this._lastTime) / 1000
		this._lastTime = timestamp;

		this._update(delta);

		this._frameId = requestAnimationFrame((timestamp) => this._loop(timestamp));
	}

	_update(delta) {
		if (this.paused) return;

		//if (this.song_position < 0) {
		this.song_position += delta * this.speed;
		/*} else {
			this.song_position += delta * this.speed;

			if (this.song_position < this._last_song_position) {
				this.song_position = this._last_song_position;
			}
		}*/

		if (this.inMinigame && this.time_left <= 0) {
			if (typeof this.minigameTimeoutCallback === 'function') {
				this.minigameTimeoutCallback();
			}
		}

		this._last_song_position = this.song_position;

		const int_step = Math.floor(this.cur_step);

		if (this._last_reported_step < int_step) {
			this._report_step();
		} else if (this._last_reported_step !== int_step) {
			this._rollback_step();
		}
	}

	_report_step() {
		while (Math.floor(this._last_reported_step) < Math.floor(this.cur_step)) {
			this._last_reported_step += 1;

			if (Math.floor(this._last_reported_step) % 4 === 0 && Math.floor(this._last_reported_step) !== 0) {
				this._report_beat();
			}
		}
	}

	_rollback_step() {
		while (Math.floor(this._last_reported_step) > Math.floor(this.cur_step)) {
			this._last_reported_step -= 1;
		}
	}

	_report_beat() {
		// idk
	}
}

