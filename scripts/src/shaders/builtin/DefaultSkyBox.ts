/// <reference path="libs/AlphaTest.ts" />
/// <reference path="libs/Lighting.ts" />
/// <reference path="libs/Reflection.ts" />

namespace MITOIA.BuiltinShader.DefaultSkyBox {
    export const NAME = "_Built-in_DefaultSkyBox";

    export const VERTEX = `
attribute vec3 ${ShaderPredefined.a_Position};

#if defined(${ShaderPredefined.DIFFUSE_TEX})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_TexCoord})
#endif

#include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2P})

void main(void) {
#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_TexCoord}
    ${ShaderPredefined.v_TexCoord} = ${ShaderPredefined.a_Position};
#endif

    gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(${ShaderPredefined.a_Position}, 1.0);
}`;

    export const FRAGMENT = `
${General.PRECISION_HEAD}

#if defined(${ShaderPredefined.DIFFUSE_TEX})
#include<${General.DECLARE_UNIFORM.name}>(samplerCube, ${ShaderPredefined.u_DiffuseSampler})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_TexCoord})
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
#include<${General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_DiffuseColor})
#endif

void main(void) {
#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = textureCube(${ShaderPredefined.u_DiffuseSampler}, ${ShaderPredefined.v_TexCoord});

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.DIFFUSE_COLOR})
    vec4 c = ${ShaderPredefined.u_DiffuseColor};
#else
    vec4 c = vec4(0.0);
#endif

    gl_FragColor = c;
}`;
}