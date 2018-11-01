namespace Aurora {
    export class FrameLooper {
        private _platform: IPlatform;
        private _callback: (delta: number) => void = null;
        private _prevTime: number = null;
        private _delta: number;
        private _type: FrameLooper.Type = FrameLooper.Type.STANDARD;
        private _timerID: number = null;
        private _timeoutTickFn: () => void;
        private _animationFrameTickFn: () => void;

        constructor(platform: IPlatform, delta: number, type: FrameLooper.Type = FrameLooper.Type.STANDARD) {
            this._platform = platform;
            this._delta = delta;
            this._type = type;
            this._timeoutTickFn = this._timeoutTick.bind(this);
            this._animationFrameTickFn = this._animationFrameTick.bind(this);
        }

        public get delta(): number {
            return this._delta;
        }

        public set delta(value: number) {
            this._delta = value;
        }

        public start(callback: (delta: number) => void): void {
            this.stop();

            this._callback = callback;
            if (callback) {
                this._prevTime = this._platform.duration();

                if (this._type === FrameLooper.Type.STANDARD) {
                    this._timerID = setTimeout(this._timeoutTickFn, this._delta);
                } else if (this._type === FrameLooper.Type.ANIMATION_FRAME) {
                    this._timerID = requestAnimationFrame(this._animationFrameTickFn);
                }
            }
        }

        public stop(): void {
            if (this._type === FrameLooper.Type.STANDARD) {
                if (this._timerID !== null) {
                    if (this._timerID !== undefined) clearTimeout(this._timerID);
                    this._timerID = null;
                }
            } else if (this._type === FrameLooper.Type.ANIMATION_FRAME) {
                if (this._timerID !== null) {
                    if (this._timerID !== undefined) cancelAnimationFrame(this._timerID);
                    this._timerID = null;
                }
            }

            this._callback = null;
        }

        private _timeoutTick(): void {
            this._timerID = undefined;
            let t = this._platform.duration();
            const d = t - this._prevTime;
            this._prevTime = t;
            this._callback(d);

            if (this._timerID === undefined) {
                t = this._delta - this._platform.duration() + t;
                if (t < 0) t = 0;
                this._timerID = setTimeout(this._timeoutTickFn, t | 0);
            }
        }

        private _animationFrameTick(): void {
            this._timerID = undefined;
            const t = this._platform.duration();
            const d = t - this._prevTime;
            this._prevTime = t;
            this._callback(d);

            if (this._timerID === undefined) this._timerID = requestAnimationFrame(this._animationFrameTickFn);
        }
    }

    export namespace FrameLooper {
        export const enum Type {
            STANDARD,
            ANIMATION_FRAME
        }
    }
}