/// <reference path="libs/AlphaTest.ts" />
/// <reference path="libs/Lighting.ts" />
/// <reference path="libs/Reflection.ts" />

namespace MITOIA.BuiltinShader.DefaultMesh {
    export const VERTEX: string = `
attribute vec3 ${ShaderPredefined.a_Position};

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_ATTRIB.name}>(vec2, ${ShaderPredefined.a_TexCoord})
#include<${General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_TexCoord})
#endif

#include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2P})

#include<${Lib.Lighting.VERT_HEADER.name}>
#include<${Lib.Reflection.VERT_HEADER.name}>

void main(void) {
#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_TexCoord}
    ${ShaderPredefined.v_TexCoord} = ${ShaderPredefined.a_TexCoord};
#endif

#include<${Lib.Lighting.VERT.name}>
#include<${Lib.Reflection.VERT.name}>

    gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(${ShaderPredefined.a_Position}, 1.0);
}`;

    export const FRAGMENT: string = `
${General.PRECISION_HEAD}

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_UNIFORM.name}>(sampler2D, ${ShaderPredefined.s_DiffuseSampler})
#include<${General.DECLARE_VARYING.name}>(vec2, ${ShaderPredefined.v_TexCoord})
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
#include<${General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_DiffuseColor})
#endif

#include<${Lib.Lighting.FRAG_HEADER.name}>
#include<${Lib.Reflection.FRAG_HEADER.name}>
#include<${Lib.AlphaTest.HEADER.name}>

void main(void) {
#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = texture2D(${ShaderPredefined.s_DiffuseSampler}, ${ShaderPredefined.v_TexCoord});

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.DIFFUSE_COLOR})
    vec4 c = ${ShaderPredefined.u_DiffuseColor};
#else
    vec4 c = vec4(0.0);
#endif

    #include<${Lib.AlphaTest.FRAG.name}>(c.w)

#include<${Lib.Lighting.FRAG.name}>(${ShaderPredefined.v_TexCoord})
#include<${Lib.Reflection.FRAG.name}>

#include<${General.FINAL_COLOR.name}>(c)

    gl_FragColor = c;
}`;
}