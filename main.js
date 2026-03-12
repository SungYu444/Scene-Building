
var canvas;
var gl;

var program;

var near = 0.1;
var far = 200.0;
var fovy = 45.0;

var TEXTURE_MODE = {
    NONE: 0,
    STONE: 1,
    ROOF: 2,
    GLASS: 3,
    WALL: 4,
    GRASS: 5,
    WINDOW: 6
};

var textureCatalog = [
    { name: "stone", unit: 0, src: "Public/FiveArches_S.jpg" },
    { name: "roof", unit: 1, src: "Public/SevenArches_S.jpg" },
    { name: "glass", unit: 2, src: "Public/ThreeFlowerShapedB_S.jpg" },
    { name: "wall", unit: 3, src: "Public/Screenshot 2026-03-11 at 2.06.25 PM.jpeg" },
    { name: "grass", unit: 4, src: "Public/grass.png" },
    { name: "window", unit: 5, src: "Public/SevenArches_N.jpg" }
];
var textures = {};

var textureModeLoc, texScaleLoc, glassEffectLoc, glassColorLoc, timeLoc;

var cameraAngle = 0.0;
var doorSwing = 0.0;
var bellSwing = 0.0;
var clapperSwing = 0.0;

var lightPosition = vec4(12.0, 14.0, 12.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0;
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.22, 0.05, 0.08, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(24,program);
    Cone.init(24,program);
    Sphere.init(48,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

    textureModeLoc = gl.getUniformLocation(program, "uTextureMode");
    texScaleLoc = gl.getUniformLocation(program, "uTexScale");
    glassEffectLoc = gl.getUniformLocation(program, "uUseGlassEffect");
    glassColorLoc = gl.getUniformLocation(program, "uGlassGlowColor");
    timeLoc = gl.getUniformLocation(program, "uTime");
    
    gl.uniform1i(textureModeLoc, TEXTURE_MODE.NONE);
    gl.uniform2fv(texScaleLoc, flatten(vec2(1.0,1.0)));
    gl.uniform1i(glassEffectLoc, 0);
    gl.uniform3fv(glassColorLoc, vec3(0.0,0.0,0.0));
    
    gl.uniform1i(gl.getUniformLocation(program, "uStoneTexture"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "uRoofTexture"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "uGlassTexture"), 2);
    gl.uniform1i(gl.getUniformLocation(program, "uWallTexture"), 3);
    gl.uniform1i(gl.getUniformLocation(program, "uGrassTexture"), 4);
    gl.uniform1i(gl.getUniformLocation(program, "uWindowTexture"), 5);
    
    initTextures();


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
    };

    resetTimerFlag = true;
    animFlag = true;
    window.requestAnimFrame(render);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result, x, y, and z are the translation amounts for each axis
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result, theta is the rotation amount, x, y, z are the components of an axis vector (angle, axis rotations!)
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result, x, y, and z are the scale amounts for each axis
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

function initTextures() {
    textureCatalog.forEach(function(asset) {
        var texture = gl.createTexture();
        textures[asset.name] = { texture: texture, unit: asset.unit };
        gl.activeTexture(gl.TEXTURE0 + asset.unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        var image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = function() {
            gl.activeTexture(gl.TEXTURE0 + asset.unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        image.src = asset.src;
    });
}

function bindTextures() {
    textureCatalog.forEach(function(asset) {
        var tex = textures[asset.name];
        if(!tex) { return; }
        gl.activeTexture(gl.TEXTURE0 + asset.unit);
        gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    });
}

function setSurface(options) {
    options = options || {};
    var mode = (options.textureMode !== undefined) ? options.textureMode : TEXTURE_MODE.NONE;
    gl.uniform1i(textureModeLoc, mode);
    var scale = options.texScale || [1.0, 1.0];
    var scaleVec = vec2(scale[0], scale[1]);
    gl.uniform2fv(texScaleLoc, flatten(scaleVec));
    gl.uniform1i(glassEffectLoc, options.glassEffect ? 1 : 0);
    var glow = options.glassGlow || [0.0, 0.0, 0.0];
    var glowVec = vec3(glow[0], glow[1], glow[2]);
    gl.uniform3fv(glassColorLoc, flatten(glowVec));
}

function updateCamera() {
    var radius = 16.0;
    cameraAngle = cameraAngle + 12.0 * dt;
    var angleRad = radians(cameraAngle);
    var height = 4.0 + Math.sin(TIME * 0.35) * 1.5;
    eye = vec3(radius * Math.cos(angleRad), height, radius * Math.sin(angleRad));
    at = vec3(0.0, 0.5, 0.0);
    viewMatrix = lookAt(eye, at , up);
    var aspect = canvas.width / canvas.height;
    projectionMatrix = perspective(fovy, aspect, near, far);
}

function updateAnimationState() {
    doorSwing = -20.0 + 18.0 * Math.sin(TIME * 1.2);
    bellSwing = 18.0 * Math.sin(TIME * 2.2);
    clapperSwing = 40.0 * Math.sin(TIME * 3.3 + 0.8);
}

function drawGround() {
    gPush();
        gTranslate(0.0, -2.8, 0.0);
        gScale(30.0, 0.4, 30.0);
        setColor(vec4(0.2, 0.4, 0.22, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.GRASS, texScale: [8.0, 8.0] });
        drawCube();
    gPop();
}

function drawWalkway() {
    gPush();
        gTranslate(0.0, -2.35, 7.5);
        gScale(2.5, 0.1, 8.0);
        setColor(vec4(0.72, 0.62, 0.56, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [3.5, 6.0] });
        drawCube();
    gPop();
}

function drawChurch() {
    drawNaveBody();
    drawRearWall();
    drawBackTower();
    drawMainRoof();
    drawEntrance();
    drawRoseWindow();
    drawSideWindows();
    drawFrontWindows();
    drawTower(-3.2);
    drawTower(3.2);
    drawRearBellTower();
    drawRoofCross();
}

function drawNaveBody() {
    gPush();
        gTranslate(0.0, -0.3, 0.0);
        gScale(3.2, 2.4, 5.4);
        setColor(vec4(0.92, 0.92, 0.96, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [3.2, 2.8] });
        drawCube();
    gPop();
}

function drawRearWall() {
    var wallCenterZ = -5.4;
    var wallDepth = 0.4;
    var rearFaceZ = wallCenterZ - wallDepth * 0.5;
    var reliefDepth = 0.14;
    var reliefCenterZ = rearFaceZ - reliefDepth * 0.5 - 0.02;
    var buttressDepth = 0.12;
    var buttressCenterZ = rearFaceZ - buttressDepth * 0.5 - 0.01;

    gPush();
        gTranslate(0.0, -0.2, wallCenterZ);
        gScale(3.3, 2.3, wallDepth);
        setColor(vec4(0.92, 0.92, 0.96, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [3.0, 2.4] });
        drawCube();
    gPop();
    
    // FiveArches relief panel sits slightly proud of the masonry to avoid z-fighting while keeping the surface visually flush
    gPush();
        gTranslate(0.0, 0.0, reliefCenterZ);
        gScale(2.5, 1.85, reliefDepth);
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.STONE, texScale: [2.4, 1.9] });
        drawCube();
    gPop();
    [-1.9, 1.9].forEach(function(x) {
        gPush();
            gTranslate(x, -0.05, buttressCenterZ);
            gScale(0.4, 2.15, buttressDepth);
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.STONE, texScale: [0.9, 2.2] });
            drawCube();
        gPop();
    });
}

function drawBackTower() {
    gPush();
        gTranslate(0.0, 0.1, -6.6);
        gScale(0.9, 1.8, 0.9);
        setColor(vec4(0.93, 0.94, 0.98, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [1.5, 2.0] });
        drawCube();
    gPop();
    gPush();
        gTranslate(0.0, 1.9, -6.6);
        gScale(0.78, 0.35, 0.78);
        setColor(vec4(0.82, 0.83, 0.9, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [1.2, 0.9] });
        drawCube();
    gPop();
    gPush();
        gTranslate(0.0, 3.0, -6.6);
        gRotate(-90, 1, 0, 0);
        gScale(0.75, 0.75, 1.45);
        setColor(vec4(0.34, 0.5, 0.6, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [1.0, 1.0] });
        drawCone();
    gPop();
}

function drawMainRoof() {
    gPush();
        gTranslate(0.0, 2.4, 0.0);
        gScale(3.5, 1.2, 5.6);
        setColor(vec4(0.35, 0.54, 0.62, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [2.5, 4.0] });
        drawCylinder();
    gPop();
}

function drawEntrance() {
    drawDoorPanel();
}

function drawDoorPanel() {
    gPush();
        gTranslate(-0.6, -1.2, 5.35);
        gRotate(doorSwing, 0, 1, 0);
        gTranslate(0.6, 0.0, 0.0);
        gScale(1.2, 1.35, 0.08);
        setColor(vec4(0.55, 0.33, 0.15, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [1.0, 1.5] });
        drawCube();
    gPop();
}

function drawRoseWindow() {
    gPush();
        gTranslate(0.0, 0.9, 5.3);
        gScale(1.1, 1.1, 0.35);
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        setSurface({
            textureMode: TEXTURE_MODE.GLASS,
            texScale: [2.0, 2.0],
            glassEffect: true,
            glassGlow: [1.2, 0.6, 0.3]
        });
        drawSphere();
    gPop();
}

function drawSideWindows() {
    var sideOffsets = [-3.2, 3.2];
    var zPositions = [-3.2, -1.0, 1.2, 3.4];
    for(var i = 0; i < sideOffsets.length; i++) {
        for(var j = 0; j < zPositions.length; j++) {
            gPush();
                gTranslate(sideOffsets[i], 0.2, zPositions[j]);
                gRotate((sideOffsets[i] < 0) ? 90 : -90, 0, 1, 0);
                gScale(0.2, 1.4, 0.6);
                setColor(vec4(1.0, 1.0, 1.0, 1.0));
                setSurface({
                    textureMode: TEXTURE_MODE.GLASS,
                    texScale: [1.4, 1.8],
                    glassEffect: true,
                    glassGlow: [0.5, 0.8, 1.2]
                });
                drawCube();
            gPop();
        }
    }
}

function drawFrontWindows() {
    var offsets = [-1.8, 1.8];
    offsets.forEach(function(xOffset) {
        gPush();
            gTranslate(xOffset, 0.0, 5.25);
            gScale(0.6, 1.5, 0.2);
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            setSurface({
                textureMode: TEXTURE_MODE.GLASS,
                texScale: [0.8, 2.2],
                glassEffect: true,
                glassGlow: [0.7, 0.9, 1.3]
            });
            drawCube();
        gPop();
    });
}

function drawTower(xOffset) {
    gPush();
        gTranslate(xOffset, -0.4, 3.8);
        gPush();
            gTranslate(0.0, -0.2, 0.0);
            gScale(0.9, 2.4, 0.9);
            setColor(vec4(0.92, 0.93, 0.97, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [1.4, 2.4] });
            drawCube();
        gPop();
        drawTowerWindows();
        
        gPush();
            gTranslate(0.0, 3.0, 0.0);
            gRotate(-90, 1, 0, 0);
            gScale(0.75, 0.75, 1.45);
            setColor(vec4(0.35, 0.52, 0.64, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [1.8, 2.0] });
            drawCone();
        gPop();
    gPop();
}

function drawTowerWindows() {
    var heights = [0.0, 1.2];
    heights.forEach(function(h) {
        gPush();
            gTranslate(0.0, h, 0.45);
            gScale(0.3, 0.7, 0.15);
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            setSurface({
                textureMode: TEXTURE_MODE.GLASS,
                texScale: [0.8, 1.4],
                glassEffect: true,
                glassGlow: [0.8, 0.7, 1.2]
            });
            drawCube();
        gPop();
    });
}

function drawRearBellTower() {
    gPush();
        gTranslate(0.0, 1.6, -4.2);
        gPush();
            gScale(1.9, 0.5, 1.6);
            setColor(vec4(0.9, 0.92, 0.96, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [1.4, 1.0] });
            drawCube();
        gPop();
        gPush();
            gTranslate(0.0, 2.0, 0.0);
            drawBelfryStructure();
        gPop();
        gPush();
            gTranslate(0.0, 4.6, 0.0);
            gRotate(-90, 1, 0, 0);
            gScale(0.85, 0.85, 1.6);
            setColor(vec4(0.35, 0.52, 0.64, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [1.2, 1.6] });
            drawCone();
        gPop();
    gPop();
}

function drawBelfryStructure() {
    var columnPositions = [
        [-0.65, 0.0, 0.45],
        [0.65, 0.0, 0.45],
        [-0.65, 0.0, -0.45],
        [0.65, 0.0, -0.45]
    ];
    columnPositions.forEach(function(pos) {
        gPush();
            gTranslate(pos[0], pos[1] + 0.15, pos[2]);
            gScale(0.2, 2.6, 0.2);
            setColor(vec4(0.92, 0.93, 0.97, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [1.0, 1.8] });
            drawCube();
        gPop();
    });
    
    var beamOffsets = [
        [0.0, 2.5, 0.45],
        [0.0, 2.5, -0.45],
        [-0.65, 2.5, 0.0],
        [0.65, 2.5, 0.0]
    ];
    beamOffsets.forEach(function(pos) {
        gPush();
            gTranslate(pos[0], pos[1], pos[2]);
            gScale(pos[2] === 0.0 ? 0.2 : 1.3, 0.18, pos[2] === 0.0 ? 1.3 : 0.2);
            setColor(vec4(0.9, 0.92, 0.96, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.WALL, texScale: [1.0, 1.0] });
            drawCube();
        gPop();
    });
    
    gPush();
        gTranslate(0.0, 0.6, 0.0);
        drawBellAssembly();
    gPop();
}

function drawBellAssembly() {
    gPush();
        gRotate(bellSwing, 0, 0, 1);
        gPush();
            gScale(1.4, 0.15, 0.45);
            setColor(vec4(0.45, 0.28, 0.1, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.ROOF, texScale: [1.0, 1.0] });
            drawCube();
        gPop();
        gPush();
            gTranslate(0.0, -0.5, 0.0);
            gScale(0.5, 0.5, 0.5);
            setColor(vec4(0.93, 0.77, 0.22, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.NONE });
            drawSphere();
        gPop();
        gPush();
            gTranslate(0.0, -1.1, 0.0);
            gRotate(-clapperSwing, 0, 0, 1);
            gScale(0.12, 0.7, 0.12);
            setColor(vec4(0.2, 0.2, 0.2, 1.0));
            setSurface({ textureMode: TEXTURE_MODE.NONE });
            drawCube();
        gPop();
    gPop();
}

function drawRoofCross() {
    gPush();
        gTranslate(0.0, 4.6, 0.0);
        gRotate(TIME * 20.0, 0, 1, 0);
        setColor(vec4(0.9, 0.83, 0.4, 1.0));
        setSurface({ textureMode: TEXTURE_MODE.NONE });
        gPush();
            gScale(0.12, 1.0, 0.12);
            drawCube();
        gPop();
        gPush();
            gScale(0.8, 0.15, 0.12);
            drawCube();
        gPop();
    gPop();
}

function drawLanterns() {
    var offsets = [-2.5, 2.5];
    offsets.forEach(function(xOffset) {
        gPush();
            gTranslate(xOffset, -2.0, 5.8);
            gPush();
                gScale(0.2, 1.6, 0.2);
                setColor(vec4(0.3, 0.3, 0.3, 1.0));
                setSurface({ textureMode: TEXTURE_MODE.NONE });
                drawCube();
            gPop();
            gPush();
                gTranslate(0.0, 1.1, 0.0);
                gScale(0.5, 0.4, 0.5);
                setColor(vec4(1.0, 0.85, 0.5, 1.0));
                setSurface({ textureMode: TEXTURE_MODE.NONE });
                drawSphere();
            gPop();
        gPop();
    });
}

function drawBats() {
    for(var i = 0; i < 6; i++) {
        var orbitAngle = TIME * 0.55 + i * 1.07;
        var radius = 8.5 + Math.sin(TIME * 0.4 + i) * 1.5;
        var height = 0.5 + Math.sin(TIME * 2.2 + i * 0.9) * 1.5;
        var flapAngle = 35 + 25 * Math.sin(TIME * 6.0 + i);
        gPush();
            gTranslate(Math.cos(orbitAngle) * radius, height, Math.sin(orbitAngle) * radius);
            gRotate(orbitAngle * 180.0 / Math.PI + 90.0, 0, 1, 0);
            drawBatBody(flapAngle);
        gPop();
    }
}

function drawBatBody(flapAngle) {
    setColor(vec4(0.07, 0.07, 0.09, 1.0));
    setSurface({ textureMode: TEXTURE_MODE.NONE });
    gPush();
        gScale(0.4, 0.18, 0.6);
        drawCube();
    gPop();
    gPush();
        gTranslate(0.0, 0.12, 0.15);
        gScale(0.18, 0.14, 0.18);
        drawCube();
    gPop();
    drawBatWing(-1, flapAngle);
    drawBatWing(1, flapAngle);
}

function drawBatWing(direction, flapAngle) {
    gPush();
        gTranslate(direction * 0.35, 0.05, 0.0);
        gRotate(direction * flapAngle, 0, 0, 1);
        gPush();
            gScale(0.7, 0.05, 0.25);
            drawCube();
        gPop();
        gTranslate(direction * 0.45, 0.0, 0.0);
        gRotate(direction * 10.0, 0, 0, 1);
        gPush();
            gScale(0.9, 0.05, 0.4);
            drawCube();
        gPop();
    gPop();
}


function render(timestamp) {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if(resetTimerFlag) {
        prevTime = timestamp;
        resetTimerFlag = false;
    }
    
    if( animFlag ) {
        dt = (timestamp - prevTime) / 1000.0;
        prevTime = timestamp;
        TIME += dt;
    }
    else {
        dt = 0.0;
    }
    
    updateCamera();
    gl.uniform1f(timeLoc, TIME);
    bindTextures();
    updateAnimationState();
    
    MS = []; // Initialize modeling matrix stack
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set all the matrices
    setAllMatrices();
    
    drawGround();
    drawWalkway();
    drawChurch();
    drawLanterns();
    drawBats();
    
    if( animFlag )
        window.requestAnimFrame(render);
}
