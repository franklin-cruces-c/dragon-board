(function (global) {
    'use strict';

    class ClockManager {
        constructor({ initialMs, incrementMs }, providers = {}) {
            this.now = providers.now || (() => performance.now());
            this.wallNow = providers.wallNow || (() => Date.now());
            this.configure({ initialMs, incrementMs });
        }

        configure({ initialMs, incrementMs }) {
            this.initialMs = initialMs;
            this.incrementMs = incrementMs;
            this.reset();
        }

        reset() {
            this.phase = 'ready';
            this.activeColor = null;
            this.remainingMs = { w: this.initialMs, b: this.initialMs };
            this.turn = this.emptyTurn();
            this.finishReason = null;
        }

        emptyTurn() {
            return {
                baseRemainingMs: null,
                accumulatedActiveMs: 0,
                segmentStartedAt: null,
                wallStartedAt: null
            };
        }

        startFirstTurn(color = 'w', perfNow = this.now(), wallNow = this.wallNow()) {
            if (this.phase !== 'ready' || color !== 'w') {
                return false;
            }
            this.phase = 'running';
            this.startTurn(color, perfNow, wallNow);
            return true;
        }

        startTurn(color, perfNow, wallNow) {
            this.activeColor = color;
            this.turn = {
                baseRemainingMs: this.remainingMs[color],
                accumulatedActiveMs: 0,
                segmentStartedAt: perfNow,
                wallStartedAt: wallNow
            };
        }

        segmentElapsed(perfNow = this.now(), wallNow = this.wallNow()) {
            if (this.turn.segmentStartedAt === null) {
                return 0;
            }
            const monotonicElapsed = Math.max(0, perfNow - this.turn.segmentStartedAt);
            const wallElapsed = Math.max(0, wallNow - this.turn.wallStartedAt);
            return Math.max(monotonicElapsed, wallElapsed);
        }

        consumedMs(perfNow = this.now(), wallNow = this.wallNow()) {
            return this.turn.accumulatedActiveMs + this.segmentElapsed(perfNow, wallNow);
        }

        getRemaining(color, perfNow = this.now(), wallNow = this.wallNow()) {
            if (this.phase === 'running' && color === this.activeColor) {
                return Math.max(0, this.turn.baseRemainingMs - this.consumedMs(perfNow, wallNow));
            }
            if (this.phase === 'paused' && color === this.activeColor) {
                return Math.max(0, this.turn.baseRemainingMs - this.turn.accumulatedActiveMs);
            }
            return Math.max(0, this.remainingMs[color]);
        }

        completeTurn(color, perfNow = this.now(), wallNow = this.wallNow()) {
            if (this.phase !== 'running' || color !== this.activeColor) {
                return { ok: false, reason: 'inactive' };
            }

            const consumedMs = this.consumedMs(perfNow, wallNow);
            const beforeIncrementMs = this.turn.baseRemainingMs - consumedMs;
            if (beforeIncrementMs <= 0) {
                return {
                    ok: false,
                    reason: 'flag',
                    consumedMs,
                    remainingMs: 0,
                    incrementAppliedMs: 0
                };
            }

            const remainingMs = beforeIncrementMs + this.incrementMs;
            this.remainingMs[color] = remainingMs;
            const nextColor = color === 'w' ? 'b' : 'w';
            this.startTurn(nextColor, perfNow, wallNow);

            return {
                ok: true,
                consumedMs,
                remainingMs,
                incrementAppliedMs: this.incrementMs,
                nextColor
            };
        }

        isFlagged(perfNow = this.now(), wallNow = this.wallNow()) {
            return this.phase === 'running' &&
                this.getRemaining(this.activeColor, perfNow, wallNow) <= 0;
        }

        pause(perfNow = this.now(), wallNow = this.wallNow()) {
            if (this.phase !== 'running') {
                return false;
            }
            this.turn.accumulatedActiveMs += this.segmentElapsed(perfNow, wallNow);
            this.turn.segmentStartedAt = null;
            this.turn.wallStartedAt = null;
            this.phase = 'paused';
            return true;
        }

        resume(perfNow = this.now(), wallNow = this.wallNow()) {
            if (this.phase !== 'paused') {
                return false;
            }
            this.turn.segmentStartedAt = perfNow;
            this.turn.wallStartedAt = wallNow;
            this.phase = 'running';
            return true;
        }

        finish(reason) {
            if (this.phase === 'running') {
                this.remainingMs[this.activeColor] =
                    this.getRemaining(this.activeColor, this.now(), this.wallNow());
            } else if (this.phase === 'paused' && this.activeColor) {
                this.remainingMs[this.activeColor] =
                    this.getRemaining(this.activeColor);
            }
            this.phase = 'finished';
            this.finishReason = reason;
            this.activeColor = null;
            this.turn = this.emptyTurn();
        }
    }

    global.ClockManager = ClockManager;
})(globalThis);
