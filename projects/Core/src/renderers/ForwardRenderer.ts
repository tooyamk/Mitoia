///<reference path="../materials/Material.ts"/>
///<reference path="../shaders/ShaderPredefined.ts"/>
///<reference path="../utils/sort/Merge.ts"/>

namespace Aurora {
    export class ForwardRenderer extends AbstractRenderer {
        protected _enalbedLighting = true;
        protected _light: AbstractLight = null;

        protected _l2wM44Array = new Float32Array(16);
        protected _l2pM44Array = new Float32Array(16);
        protected _l2vM44Array = new Float32Array(16);

        protected _shaderDefines: ShaderDefines = null;
        protected _shaderUniforms: ShaderUniforms = null;

        protected _definesList = new ShaderDataList<ShaderDefines, ShaderDefines.Value>();
        protected _uniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();

        protected _renderFn: (renderingData: RenderingData) => void = null;

        constructor() {
            super();

            this._shaderDefines = new ShaderDefines();
            this._shaderDefines.retain();

            this._shaderUniforms = new ShaderUniforms();
            this._shaderUniforms.retain();

            this._renderFn = this._render.bind(this);
        }

        public get enabledLighting(): boolean {
            return this._enalbedLighting;
        }

        public set enabledLighting(value: boolean) {
            this._enalbedLighting = value;
        }

        public collect(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void {
            const mats = renderable.getMaterials();
            if (mats) {
                const rawMats = mats.raw;
                const len = rawMats.length;
                if (len > 0) {
                    if (replaceMaterials) {
                        const len1 = replaceMaterials.length;
                        if (len >= len1) {
                            for (let i = 0; i < len1; ++i) renderable.collect(replaceMaterials[i], rawMats[i], appendFn);
                        } else if (len === 1) {
                            const m = rawMats[0];
                            for (let i = 0; i < len1; ++i) renderable.collect(replaceMaterials[i], m, appendFn);
                        } else {
                            for (let i = 0; i < len1; ++i) renderable.collect(replaceMaterials[i], rawMats[i], appendFn);
                        }
                    } else {
                        for (let i = 0; i < len; ++i) renderable.collect(rawMats[i], null, appendFn);
                    }
                }
            }
        }

        public preRender(renderingMgr: RenderingManager, lights: AbstractLight[]): void {
            super.preRender(renderingMgr, lights);

            if (lights) {
                for (let i = 0, n = lights.length; i < n; ++i) {
                    const l = lights[i];
                    if (l && l.enabled) {
                        this._light = l;
                        break;
                    }
                }
            }
        }

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            if (this._enalbedLighting && this._light) {
                this._shaderDefines.set(ShaderPredefined.LIGHTING, true);
                this._light.ready(this._shaderDefines, this._shaderUniforms);
            } else {
                this._shaderDefines.set(ShaderPredefined.LIGHTING, false);
            }

            this._renderByQueue(renderingData, renderingObjects, start, end);
        }

        public flush(): void {
        }

        public postRender(): void {
            this._light = null;

            super.postRender();
        }

        private _renderByQueue(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            for (let i = start; i <= end; ++i) {
                const obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.callback(renderingData);

                const su = this._shaderUniforms;
                su.setNumberArray(ShaderPredefined.u_M44_L2P, obj.l2p.toArray44(false, this._l2pM44Array));
                su.setNumberArray(ShaderPredefined.u_M44_L2V, obj.l2v.toArray44(false, this._l2vM44Array));
                su.setNumberArray(ShaderPredefined.u_M44_L2W, obj.l2w.toArray44(false, this._l2wM44Array));

                renderingData.render(this._renderFn);
                obj.renderable.postRender();
            }
        }

        private _render(renderingData: RenderingData): void {
            const out = renderingData.out;
            const as = out.asset;
            if (as) {
                const obj = renderingData.in.renderingObject;
                const mat = obj.material;
                this._definesList.pushBackByList(out.definesList).pushBack(mat.defines).pushBack(this._shaderDefines);
                this._uniformsList.pushBackByList(out.uniformsList).pushBack(mat.uniforms).pushBack(obj.alternativeUniforms).pushBack(this._shaderUniforms);

                this._renderingMgr.useAndDraw(as, mat, this._definesList, this._uniformsList);
                this._definesList.clear();
                this._uniformsList.clear();
            }
        }

        public destroy() {
            if (this._shaderDefines) {
                this._shaderDefines.release();
                this._shaderDefines = null;
            }

            if (this._shaderUniforms) {
                this._shaderUniforms.release();
                this._shaderUniforms = null;
            }

            this._renderFn = null;

            super.destroy();
        }
    }
}