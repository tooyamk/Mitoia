namespace Aurora {
    export class Animator<T extends AbstractAnimationClip> extends Ref {
        protected _curClip: AbstractAnimationClip = null;
        protected _elapsed: number = 0;

        public get elapsed(): number {
            return this._elapsed;
        }

        public set elapsed(value: number) {
            if (this._curClip) {
                const delta = value - this._elapsed;
                this._elapsed = value;
                this._update(delta);
            }
        }

        public get duration(): number {
            return this._curClip ? this._curClip.duration : 0;
        }

        public get clip() {
            return this._curClip;
        }

        public update(delta: number): void {
            if (this._curClip) {
                this._elapsed += delta;
                this._update(delta);
            }
        }

        public setClip(clip: T, startTime: number = 0, blendTime: number = 0): void {
            if (this._curClip !== clip) {
                if (clip) clip.retain();
                if (this._curClip) this._curClip.release();
                this._curClip = clip;
            }

            if (clip) {
                this._elapsed = startTime;
            } else {
                this._elapsed = 0;
            }
        }

        protected _update(delta: number): void {
            this._elapsed = this._curClip.update(this._elapsed);
        }

        public destroy(): void {
            if (this._curClip) {
                this._curClip.release();
                this._curClip = null;
            }
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}