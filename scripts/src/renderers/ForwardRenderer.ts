namespace MITOIA {
    class RenderNode {
        public material: Material;
        public node: Node;
        public renderable: AbstractRenderableObject;
        public localToWorld: Matrix44 = new Matrix44();
        public localToView: Matrix44 = new Matrix44();
        public localToProj: Matrix44 = new Matrix44();
    }

    export class ForwardRenderer extends AbstractRenderer {
        public enalbedBlendSort: boolean = true;

        private _renderingGL: WebGLRenderingContext;
        private _renderingReplaceMaterials: Material[];

        private _renderingQueue: RenderNode[] = [];
        private _renderingQueueLength: uint = 0;
        private _renderingQueueCapacity: uint = 0;

        protected _viewToProjMatrix: Matrix44 = new Matrix44();
        protected _worldToViewMatrix: Matrix44 = new Matrix44();
        protected _worldToProjMatrix: Matrix44 = new Matrix44();

        private _renderingNode: RenderNode = null;

        constructor() {
            super();

            this._renderingQueueCapacity = 100;
            for (let i = 0; i < this._renderingQueueCapacity; ++i) this._renderingQueue[i] = new RenderNode();
        }

        public render(gl: GL, camera: Camera, node: Node, replaceMaterials: Material[] = null): void {
            this._renderingGL = gl.context;
            this._renderingReplaceMaterials = replaceMaterials;

            if (camera.node) {
                camera.node.getWorldMatrix(this._worldToViewMatrix);
                this._worldToViewMatrix.invert();
            } else {
                this._worldToViewMatrix.identity();
            }

            camera.getProjectionMatrix(this._viewToProjMatrix);

            this._worldToViewMatrix.append44(this._viewToProjMatrix, this._worldToProjMatrix);

            this._shaderUniform.setNumberArray(ShaderPredefined.u_MatV2P, this._viewToProjMatrix.toArray44());
            this._shaderUniform.setNumberArray(ShaderPredefined.u_MatW2P, this._worldToProjMatrix.toArray44());
            this._shaderUniform.setNumberArray(ShaderPredefined.u_MatW2V, this._worldToViewMatrix.toArray44());

            this.begin(gl, camera);

            this._collectNode(node);
            
            Sort.Merge.sort(this._renderingQueue, (a: RenderNode, b: RenderNode) => {
                return a.material.renderingPriority < b.material.renderingPriority;
            }, 0, this._renderingQueueLength);

            if (this.enalbedBlendSort) this._sortByBlend();

            this._renderByQueue();

            //clean
            this._renderingGL = null;
            this._renderingReplaceMaterials = null;
            for (let i = 0; i < this._renderingQueueLength; ++i) {
                let rn = this._renderingQueue[i];
                rn.material = null;
                rn.node = null;
                rn.renderable = null;
            }
            this._renderingQueueLength = 0;
        }

        private _collectNode(node: Node): void {
            let renderable = node.getComponentByType(AbstractRenderableObject, true);
            if (renderable && renderable.isReady()) {
                let materials = this._renderingReplaceMaterials ? this._renderingReplaceMaterials : renderable.materials;
                if (materials) {
                    for (let i = 0, n = materials.length; i < n; ++i) {
                        let m = materials[i];
                        if (m && m.shader) {
                            let queueNode: RenderNode;
                            if (this._renderingQueueLength == this._renderingQueueCapacity) {
                                queueNode = new RenderNode();
                                this._renderingQueue[this._renderingQueueCapacity] = queueNode;
                                ++this._renderingQueueLength;
                                ++this._renderingQueueCapacity;
                            } else {
                                queueNode = this._renderingQueue[this._renderingQueueLength++];
                            }

                            queueNode.material = m;
                            queueNode.node = node;
                            queueNode.renderable = renderable;
                            node.getWorldMatrix(queueNode.localToWorld);
                            queueNode.localToWorld.append34(this._worldToViewMatrix, queueNode.localToView);
                            queueNode.localToWorld.append44(this._worldToProjMatrix, queueNode.localToProj);
                        }
                    }
                }
            }

            node.foreach(child => {
                this._collectNode(child);
            });
        }

        private _sortByBlend(): void {
            let renderingPriority: number = null;
            let alphaBlendStart: number = null;
            for (let i = 0; i < this._renderingQueueLength; ++i) {
                let rn = this._renderingQueue[i];
                if (rn.material.blend) {
                    if (alphaBlendStart === null) {
                        alphaBlendStart = i;
                        renderingPriority = rn.material.renderingPriority;
                    } else if (renderingPriority !== rn.material.renderingPriority) {
                        this._sortByDepth(alphaBlendStart, i - 1);
                        alphaBlendStart = i;
                        renderingPriority = rn.material.renderingPriority;
                    }
                } else if (alphaBlendStart !== null) {
                    this._sortByDepth(alphaBlendStart, i - 1);
                    alphaBlendStart = null;
                }
            }

            if (alphaBlendStart !== null) this._sortByDepth(alphaBlendStart, this._renderingQueueLength - 1);
        }

        private _sortByDepth(start: uint, end: uint): void {
            Sort.Merge.sort(this._renderingQueue, (a: RenderNode, b: RenderNode) => {
                return a.localToView.m32 > b.localToView.m32;
            }, start, end);
        }

        private _renderByQueue(): void {
            for (let i = 0; i < this._renderingQueueLength; ++i) {
                let rn = this._renderingQueue[i];
                this._renderingNode = rn;
                rn.renderable.draw(this, rn.material);
            }

            this._renderingNode = null;
        }

        public onShaderPreUse(): void {
            let shader = this._renderingNode.material.shader;

            if (shader.hasUniform(ShaderPredefined.u_MatL2P)) this._shaderUniform.setNumberArray(ShaderPredefined.u_MatL2P, this._renderingNode.localToProj.toArray44());
            if (shader.hasUniform(ShaderPredefined.u_MatL2V)) this._shaderUniform.setNumberArray(ShaderPredefined.u_MatL2V, this._renderingNode.localToView.toArray44());
            if (shader.hasUniform(ShaderPredefined.u_MatL2W)) this._shaderUniform.setNumberArray(ShaderPredefined.u_MatL2W, this._renderingNode.localToWorld.toArray44());
        }
    }
}