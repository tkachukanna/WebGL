'use strict';
import Model from "./Model.mjs";

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let lightAngle = 0.0;
let u, v;
let L, T, B;

let diffuseTexture, specularTexture, normalTexture;
let texturesLoaded = 0;

// Constructor
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;
    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;

    this.iAttribUV = -1;
    this.iAttribTangent = -1;
    this.iAttribBitangent = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    this.iModelViewMatrix = -1;
    this.iNormalMatrix = -1;
    this.iLightPos = -1;
    this.iKa = -1;
    this.iKd = -1;
    this.iKs = -1;
    this.iShininess = -1;
    this.iDiffuseTex = -1;
    this.iSpecularTex = -1;
    this.iNormalTex = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

function loadTexture(url) {
    const texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
            texture.image
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
        texturesLoaded++;
    }
    texture.image.src = url;
    return texture;
}

/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    if (texturesLoaded < 3) {
        requestAnimationFrame(draw);
        return;
    }

    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 50);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotX = m4.xRotation(270 * Math.PI / 180);
    modelView = m4.multiply(rotX, modelView);

    let rotY = m4.yRotation(45 * Math.PI / 180);
    modelView = m4.multiply(rotY, modelView);

    let translateToPointZero = m4.translation(0, 0, -15);
    modelView = m4.multiply(translateToPointZero, modelView);

    // Update light angle
    lightAngle += 0.01; 
    let lx = 5.0 * Math.cos(lightAngle);
    let lz = 5.0 * Math.sin(lightAngle);
    let ly = 4.0;
    let lightPos = [lx, ly, lz];

    let lightEye = m4.transformPoint(modelView, lightPos);

    let modelViewProjection = m4.multiply(projection, modelView);

    let normalMatrix = m4.inverse(modelView);
    normalMatrix = m4.transpose(normalMatrix);
    let normalMatrix3 = [
        normalMatrix[0],normalMatrix[1],normalMatrix[2],
        normalMatrix[4],normalMatrix[5],normalMatrix[6],
        normalMatrix[8],normalMatrix[9],normalMatrix[10]
    ];

    shProgram.Use();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, modelView);
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, normalMatrix3);

    gl.uniform4fv(shProgram.iColor, [1,1,1,1]);
    gl.uniform3fv(shProgram.iLightPos, lightEye);
    gl.uniform3fv(shProgram.iKa, [0.2,0.2,0.2]);
    gl.uniform3fv(shProgram.iKd, [0.8,0.8,0.7]);
    gl.uniform3fv(shProgram.iKs, [1.0,1.0,1.0]);
    gl.uniform1f(shProgram.iShininess, 50.0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.uniform1i(shProgram.iDiffuseTex, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);
    gl.uniform1i(shProgram.iSpecularTex, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.uniform1i(shProgram.iNormalTex, 2);

    surface.draw(shProgram);

    requestAnimationFrame(draw);
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Phong', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribUV = gl.getAttribLocation(prog, "uv");
    shProgram.iAttribTangent = gl.getAttribLocation(prog, "tangent");
    shProgram.iAttribBitangent = gl.getAttribLocation(prog, "bitangent");

    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iKa = gl.getUniformLocation(prog, "Ka");
    shProgram.iKd = gl.getUniformLocation(prog, "Kd");
    shProgram.iKs = gl.getUniformLocation(prog, "Ks");
    shProgram.iShininess = gl.getUniformLocation(prog, "shininess");
    shProgram.iDiffuseTex = gl.getUniformLocation(prog, "diffuseTex");
    shProgram.iSpecularTex = gl.getUniformLocation(prog, "specularTex");
    shProgram.iNormalTex = gl.getUniformLocation(prog, "normalTex");

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    updateSurface();

    diffuseTexture = loadTexture("Textures/diffuse.jpg");
    specularTexture = loadTexture("Textures/specular.jpg");
    normalTexture = loadTexture("Textures/normal.jpg");
}

function updateSurface() {
    const lValue = +L.value;
    const tValue = +T.value;
    const bValue = +B.value;

    document.getElementById("l-value").innerText = lValue;
    document.getElementById("t-value").innerText = tValue;
    document.getElementById("b-value").innerText = bValue;

    let uGranularity = parseInt(u.value);
    let vGranularity = parseInt(v.value);

    surface = new Model(gl, uGranularity, vGranularity, lValue, tValue, bValue);
    surface.init();
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    canvas = document.getElementById("webglcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    u = document.getElementById("uSlider");
    v = document.getElementById("vSlider");

    u.oninput = function() {
        updateSurface();
    };
    v.oninput = function() {
        updateSurface();
    };

    L = document.getElementById("l");
    T = document.getElementById("t");
    B = document.getElementById("b");

    L.oninput = function() {
        updateSurface();
    };
    T.oninput = function() {
        updateSurface();
    };
    B.oninput = function() {
        updateSurface();
    };

    initGL();
    spaceball = new TrackballRotator(canvas, null, 0);
    draw();
}

document.addEventListener("DOMContentLoaded", init);