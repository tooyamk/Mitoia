namespace Aurora {
    export abstract class AbstractRenderer {
        public isRendering: boolean = false;

        protected _renderingMgr: RenderingManager = null;
        protected _lights: AbstractLight[] = null;

        public preRender(renderingMgr: RenderingManager, lights: AbstractLight[]): void {
            this._renderingMgr = renderingMgr;
            this._lights = lights;
        }

        public postRender(): void {
            this._renderingMgr = null;
            this._lights = null;
        }

        public abstract render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void;
        public abstract collect(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void;

        public destroy(): void {
            //override
        }
    }
}