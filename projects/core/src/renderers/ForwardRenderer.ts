///<reference path="../materials/Material.ts" />
///<reference path="../shaders/ShaderPredefined.ts" />
///<reference path="../utils/sort/Merge.ts" />

namespace Aurora {
    export class ForwardRenderer extends AbstractRenderer {
        protected _enalbedLighting = true;
        protected _light: AbstractLight = null;

        protected _localToWorldM33Array: number[] = [];
        protected _localToWorldM44Array: number[] = [];
        protected _localToProjM44Array: number[] = [];
        protected _localToViewM44Array: number[] = [];

        public get enabledLighting(): boolean {
            return this._enalbedLighting;
        }

        public set enabledLighting(value: boolean) {
            this._enalbedLighting = value;
        }

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void {
            const mats = renderable.materials;
            if (mats) {
                const len = mats.length;
                if (len > 0) {
                    if (replaceMaterials) {
                        const len1 = replaceMaterials.length;
                        if (len >= len1) {
                            for (let i = 0; i < len1; ++i) {
                                const m = mats[i];
                                appendFn(renderable, replaceMaterials[i], m ? m.uniforms : null);
                            }
                        } else if (len === 1) {
                            const m = mats[0];
                            const u = m ? m.uniforms : null;
                            for (let i = 0; i < len1; ++i) appendFn(renderable, replaceMaterials[i], u);
                        } else {
                            for (let i = 0; i < len; ++i) {
                                const m = mats[i];
                                appendFn(renderable, replaceMaterials[i], m ? m.uniforms : null);
                            }
                        }
                    } else {
                        for (let i = 0; i < len; ++i) appendFn(renderable, mats[i], null);
                    }
                }
            }
        }

        public preRender(shaderDefines: ShaderDefines, shaderUniforms: ShaderUniforms, lights: AbstractLight[]): void {
            super.preRender(shaderDefines, shaderUniforms, lights);

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
                this._shaderDefines.setDefine(ShaderPredefined.LIGHTING, true);
                this._light.ready(this._shaderDefines, this._shaderUniforms);
            } else {
                this._shaderDefines.setDefine(ShaderPredefined.LIGHTING, false);
            }

            this._renderByQueue(renderingData, renderingObjects, start, end);
        }

        public postRender(): void {
            super.postRender();

            this._light = null;
        }

        private _renderByQueue(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            for (let i = start; i <= end; ++i) {
                const obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.renderable.visit(renderingData);
                const as = renderingData.out.asset;
                if (as) {
                    let su = renderingData.out.uniforms;
                    let tail: ShaderUniforms = null;
                    if (su) {
                        tail = su.tail;
                        tail.next = obj.alternativeUniforms;
                    } else {
                        su = obj.alternativeUniforms;
                    }
                    this.useAndDraw(as, obj.material, su, () => {
                        const shader = obj.material.shader;

                        if (shader.hasUniform(ShaderPredefined.u_M33_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M33_L2W, obj.localToWorld.toArray33(false, this._localToWorldM33Array));
                        if (shader.hasUniform(ShaderPredefined.u_M44_L2P)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2P, obj.localToProj.toArray44(false, this._localToProjM44Array));
                        if (shader.hasUniform(ShaderPredefined.u_M44_L2V)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2V, obj.localToView.toArray44(false, this._localToViewM44Array));
                        if (shader.hasUniform(ShaderPredefined.u_M44_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2W, obj.localToWorld.toArray44(false, this._localToWorldM44Array));
                    });
                    if (tail) tail.next = null;
                }
                renderingData.out.clear();
            }
        }
    }
}