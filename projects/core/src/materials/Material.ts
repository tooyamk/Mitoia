namespace Aurora {
    export const enum RenderingSort {
        FOREMOST,
        NEAR_TO_FAR,
        MIDDLE,
        FAR_TO_NEAR,
        FINALLY
    }

    export class Material {
        public shader: Shader = null;

        public renderingPriority: int = 0;
        public renderingSort: RenderingSort = RenderingSort.MIDDLE;

        public drawMode: GLDrawMode = GLDrawMode.TRIANGLES;

        public blend: GLBlend = null;

        public cullFace: GLCullFace = GLCullFace.BACK;

        public depthTest: GLDepthTest = GLDepthTest.LESS;

        public depthWrite: boolean = true;
        public colorWrite: GLColorWrite = null;

        public stencilFront: GLStencil = null;
        public stencilBack: GLStencil = null;

        public defines: ShaderDefines = new ShaderDefines();
        public uniforms: ShaderUniforms = new ShaderUniforms();

        constructor(shader: Shader = null) {
            this.shader = shader;
        }

        public static canCombine(value0: Material, value1: Material, info: GLProgramUniformInfo[] = null): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    if (value0.shader !== value1.shader ||
                        value0.drawMode !== value1.drawMode ||
                        value0.cullFace !== value1.cullFace ||
                        value0.depthTest !== value1.depthTest ||
                        value0.depthWrite !== value1.depthWrite) return false;
                    if (!GLBlend.isEqual(value0.blend, value1.blend)) return false;
                    if (!GLColorWrite.isEqual(value0.colorWrite, value1.colorWrite)) return false;
                    if (!GLStencil.isEqual(value0.stencilFront, value1.stencilBack)) return false;
                    if (!GLStencil.isEqual(value0.stencilBack, value1.stencilBack)) return false;
                    if (!ShaderUniforms.isEqual(value0.uniforms, value1.uniforms, info)) return false;
                } else {
                    return false;
                }
            }
            return !value1;
        }

        public clone(): Material {
            const m = new Material(this.shader);

            m.renderingPriority = this.renderingPriority;
            m.renderingSort = this.renderingSort;
            m.drawMode = this.drawMode;
            m.cullFace = this.cullFace;
            m.depthTest = this.depthTest;
            m.depthWrite = this.depthWrite;

            if (this.blend) m.blend = this.blend.clone();
            if (this.colorWrite) m.colorWrite = this.colorWrite.clone();
            if (this.stencilFront) m.stencilFront = this.stencilFront.clone();
            if (this.stencilBack) m.stencilBack = this.stencilBack.clone();
            if (this.defines) m.defines = this.defines.clone();
            if (this.uniforms) m.uniforms = this.uniforms.clone();

            return m;
        }

        public ready(defines: ShaderDefines): GLProgram {
            if (this.shader) {
                if (this.defines) {
                    const tail = this.defines.tail;
                    tail.next = defines;
                    const rst = this.shader.ready(this.defines);
                    tail.next = null;
                    return rst;
                } else {
                    return this.shader.ready(defines);
                }
            }

            return null;
        }

        public use(uniforms: ShaderUniforms): GLProgram {
            const gl = this.shader.gl;
            gl.setBlend(this.blend);
            gl.setCullFace(this.cullFace);
            gl.setDepthTest(this.depthTest);
            gl.setDepthWrite(this.depthWrite);
            gl.setColorWrite(this.colorWrite);
            gl.setStencil(this.stencilFront, this.stencilBack);

            if (this.uniforms) {
                const tail = this.uniforms.tail;
                tail.next = uniforms;
                const rst = this.shader.use(this.uniforms);
                tail.next = null;
                return rst;
            } else {
                return this.shader.use(uniforms);
            }
        }

        public destroy(destroyShader: boolean): void {
            if (destroyShader && this.shader) this.shader.destroy();

            this.shader = null;
            this.blend = null;
            this.colorWrite = null;
            this.stencilFront = null;
            this.stencilBack = null;
            this.defines = null;
            this.uniforms = null;
        }
    }
}