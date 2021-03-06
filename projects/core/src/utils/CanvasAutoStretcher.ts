namespace Aurora {
    export class CanvasAutoStretcher {
        private _size: Vector2;
        private _canvas: HTMLCanvasElement;
        private _hasClientSize: boolean;

        constructor(canvas: HTMLCanvasElement) {
            this._canvas = canvas;
            this._size = new Vector2(this._canvas.width, this._canvas.height);
            this._hasClientSize = !!this._canvas.clientWidth || !!this._canvas.clientHeight;
        }

        public execute(): boolean {
            if (this._hasClientSize) {
                if (this._size.x !== this._canvas.clientWidth || this._size.y !== this._canvas.clientHeight) {
                    this._canvas.width = this._canvas.clientWidth;
                    this._canvas.height = this._canvas.clientHeight;
                    this._size.x = this._canvas.width;
                    this._size.y = this._canvas.height;
    
                    return true;
                }
            } else {
                if (this._size.x !== this._canvas.width || this._size.y !== this._canvas.height) {
                    this._size.x = this._canvas.width;
                    this._size.y = this._canvas.height;
    
                    return true;
                }
            }

            return false;
        }
    }
}