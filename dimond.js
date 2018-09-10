"use strict";

var canvas;
var gl;
var pBuffer, cBuffer, tBuffer, nBuffer;
var count = 0;
var maxNumTriangles = 20000;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;
var theta = 0;
var thetaLoc;
var circleArr = [];
// var normal;


var near = 0.3;
var far = 8.0;
var radius = 4.0;
var cta  = 0.0;
var phi    = 0.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0; // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);  // changed from const
var up = vec3(0.0, 1.0, 0.0);  // changed from const

var colors = [

    vec4(0.0, 0.0, 1.0, 1.0),  // blue 0
    vec4(0.0, 0.2, 1.0, 1.0), // light blue 1
    vec4(0.0, 0.3, 1.0, 1.0), // lighter blue 2
    vec4(0.0, 0.4, 1.0, 1.0),  // lightest blue 3
    vec4(0.0, 0.0, 0.95, 1.0),  // dark blue 4
    vec4(0.0, 0.0, 0.98, 1.0),  // darker blue 5
];

// callback function that starts once html window is loaded
window.onload = function init() {

    // associate canvas with "gl-canvas"
    canvas = document.getElementById("gl-canvas");

    // setup WebGL presence in canvas, if that fails complain
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    //position buffer
    pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //color buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    //tag buffer
    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    var vTag = gl.getAttribLocation(program, "vTag");
    gl.vertexAttribPointer(vTag, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTag);

    //normal buffer
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 12 * maxNumVertices, gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    //uniform data
    thetaLoc = gl.getUniformLocation(program, "theta");
    projectionMatrixLoc = gl.getUniformLocation(program,"projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program,"modelViewMatrix");

    var lightPosition = vec4(1.0, 1.0, 0.5, 0.0 );
    var lightAmbient = vec4(0.0, 0.3, 0.8, 1.0);
    var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

    var materialAmbient = vec4( 0.0, 0.0, 1.0, 1.0 );
    var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
    var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
    var materialShininess = 200.0;

   // var ambientColor, diffuseColor, specularColor;

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
        flatten(specularProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
        flatten(lightPosition) );

    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"),materialShininess);

    //cube(0,0,0,0,0,0,1);
    dimond(0,1,2,3,0,1,1);

    document.getElementById("zFarSlider").onchange = function(event) {
        far = event.target.value;
    };
    document.getElementById("zNearSlider").onchange = function(event) {
        near = event.target.value;
    };
    document.getElementById("aspectSlider").onchange = function(event) {
        aspect = event.target.value;
    };
    document.getElementById("fovSlider").onchange = function(event) {
        fovy = event.target.value;
    };
    document.getElementById("radiusSlider").onchange = function(event) {
        radius = event.target.value;
    };
    document.getElementById("ctaSlider").onchange = function(event) {
        cta = event.target.value* Math.PI/180.0;
    };
    document.getElementById("phiSlider").onchange = function(event) {
        phi = event.target.value* Math.PI/180.0;
    };

    render();

}

function getNormal(a,b,c)
{
    var t1 = subtract(b,a);
    var t2 = subtract(c,b);
    var normal = cross(t2,t1);
    return normal;
}

function triangle(a,b,c,color,tag)
{
   // var p = [a,b,c];
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(a));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index + 16, flatten(b));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index + 32, flatten(c));

    var t = vec4(colors[color]);
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index + 16, flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index + 32, flatten(t));

    t = vec4(tag,tag,tag,tag);
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index + 16, flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index + 32, flatten(t));

    t = getNormal(a,b,c);
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 12 * index, flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 12 * index + 12, flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 12 * index + 24, flatten(t));

    index += 3 ;
    count++;
}

function cube(c1, c2, c3, c4, c5, c6, tag)
{


    var finArry = [vec4(0,0,0,1.0),
        vec4(0.5, 0, 0, 1.0),
        vec4(0, 0, -0.5, 1),
        vec4(0.5, 0, -0.5, 1),
        vec4(0, 0.5, 0, 1),
        vec4(0.5, 0.5, 0, 1),
        vec4(0, 0.5, -0.5,1),
        vec4(0.5, 0.5, -0.5, 1)];

    var front = vec4(0.0,0.0,1.0,0.0);
    var back = vec4(0.0,0.0,-1.0,0.0);
    var top = vec4(0.0,1.0,0.0,0.0);
    var bottom = vec4(0.0,-1.0,0.0,0.0);
    var right = vec4(1.0,0.0,0.0,0.0);
    var left = vec4(-1.0,0.0,0.0,0.0);

    triangle(finArry[0],finArry[5],finArry[4],c1,tag);
    triangle(finArry[0],finArry[1],finArry[5],c1,tag);
    triangle(finArry[1],finArry[7],finArry[5],c2,tag);
    triangle(finArry[1],finArry[3],finArry[7],c2,tag);
    triangle(finArry[4],finArry[7],finArry[6],c3,tag);
    triangle(finArry[4],finArry[5],finArry[7],c3,tag);
    triangle(finArry[0],finArry[6],finArry[2],c4,tag);
    triangle(finArry[0],finArry[4],finArry[6],c4,tag);
    triangle(finArry[2],finArry[6],finArry[7],c5,tag);
    triangle(finArry[2],finArry[7],finArry[3],c5,tag);
    triangle(finArry[0],finArry[2],finArry[3],c6,tag);
    triangle(finArry[0],finArry[3],finArry[1],c6,tag);
}

function dimond(c1, c2, c3, c4,c5, c6, tag)
{
    var finArry = [vec4(-1.55,-3.743,-0.9,1.0),
        vec4(-2.865, -2.865, -0.9, 1.0),
        vec4(-3.743, -1.55, -0.9, 1),
        vec4(-4.051, 0, -0.9,1),
        vec4(-3.743, 1.55, -0.9, 1),
        vec4(-2.865, 2.865, -0.9, 1.0),
        vec4(-1.55,3.743,-0.9,1.0),
        vec4(0, 4.051, -0.9, 1),
        vec4(1.55,3.743,-0.9,1),
        vec4(2.865, 2.865, -0.9, 1.0),
        vec4(3.743, 1.55, -0.9, 1),
        vec4(4.051, 0, -0.9,1),
        vec4(3.743, -1.55, -0.9, 1),
        vec4(2.865, -2.865, -0.9, 1.0),
        vec4(1.55,-3.743,-0.9,1.0),
        vec4(0, -4.051, -0.9, 1),
        vec4(-1.339,-3.234,-0.2,1),
        vec4(-3.234,-1.339,-0.2,1),
        vec4(-3.234,1.339,-0.2,1),
        vec4(-1.339,3.234,-0.2,1),
        vec4(1.339,3.234,-0.2,1),
        vec4(3.234,1.339,-0.2,1),
        vec4(3.234,-1.339,-0.2,1),
        vec4(1.339,-3.234,-0.2,1),
        vec4(0,3,0,1),
        vec4(2.121,2.121,0,1),
        vec4(3,0,0,1),
        vec4(2.121,-2.121,0,1),
        vec4(0,-3,0,1),
        vec4(-2.121,-2.121,0,1),
        vec4(-3,0,0,1),
        vec4(-2.121,2.121,0,1),
        vec4(0,0,0,1),              //center = 32'
        vec4(-0.719,-1.735,-2.9,1),
        vec4(-1.735,-0.719,-2.9,1),
        vec4(-1.735,0.719,-2.9,1),
        vec4(-0.719,1.735,-2.9,1),
        vec4(0.719,1.735,-2.9,1),
        vec4(1.735,0.719,-2.9,1),
        vec4(1.735,-0.719,-2.9,1),
        vec4(0.719,-1.735,-2.9,1),  //40
        vec4(0,0,-4.398,1) //bottom: 41
    ];
    triangle(finArry[1],finArry[0],finArry[16],c1,tag);
    triangle(finArry[0],finArry[15],finArry[16],c1,tag);
    triangle(finArry[15],finArry[14],finArry[23],c1,tag);
    triangle(finArry[14],finArry[13],finArry[23],c1,tag);
    triangle(finArry[13],finArry[12],finArry[22],c1,tag);
    triangle(finArry[12],finArry[11],finArry[22],c1,tag);
    triangle(finArry[11],finArry[10],finArry[21],c1,tag);
    triangle(finArry[10],finArry[9],finArry[21],c1,tag);
    triangle(finArry[9],finArry[8],finArry[20],c1,tag);
    triangle(finArry[8],finArry[7],finArry[20],c1,tag);
    triangle(finArry[7],finArry[6],finArry[19],c1,tag);
    triangle(finArry[6],finArry[5],finArry[19],c1,tag);
    triangle(finArry[5],finArry[4],finArry[18],c1,tag);
    triangle(finArry[4],finArry[3],finArry[18],c1,tag);
    triangle(finArry[3],finArry[2],finArry[17],c1,tag);
    triangle(finArry[2],finArry[1],finArry[17],c1,tag);

    triangle(finArry[7],finArry[19],finArry[24],c2,tag);
    triangle(finArry[7],finArry[24],finArry[20],c2,tag);
    triangle(finArry[5],finArry[18],finArry[31],c2,tag);
    triangle(finArry[5],finArry[31],finArry[19],c2,tag);
    triangle(finArry[3],finArry[17],finArry[30],c2,tag);
    triangle(finArry[3],finArry[30],finArry[18],c2,tag);
    triangle(finArry[1],finArry[16],finArry[29],c2,tag);
    triangle(finArry[1],finArry[29],finArry[17],c2,tag);
    triangle(finArry[15],finArry[23],finArry[28],c2,tag);
    triangle(finArry[15],finArry[28],finArry[16],c2,tag);
    triangle(finArry[13],finArry[22],finArry[27],c2,tag);
    triangle(finArry[13],finArry[27],finArry[23],c2,tag);
    triangle(finArry[11],finArry[21],finArry[26],c2,tag);
    triangle(finArry[11],finArry[26],finArry[22],c2,tag);
    triangle(finArry[9],finArry[20],finArry[25],c2,tag);
    triangle(finArry[9],finArry[25],finArry[21],c2,tag);

    triangle(finArry[16],finArry[28],finArry[29],c3,tag);
    triangle(finArry[17],finArry[29],finArry[30],c3,tag);
    triangle(finArry[18],finArry[30],finArry[31],c3,tag);
    triangle(finArry[19],finArry[31],finArry[24],c3,tag);
    triangle(finArry[20],finArry[24],finArry[25],c3,tag);
    triangle(finArry[21],finArry[25],finArry[26],c3,tag);
    triangle(finArry[22],finArry[26],finArry[27],c3,tag);
    triangle(finArry[23],finArry[27],finArry[28],c3,tag);

    triangle(finArry[24],finArry[32],finArry[25],c4,tag);
    triangle(finArry[25],finArry[32],finArry[26],c4,tag);
    triangle(finArry[26],finArry[32],finArry[27],c4,tag);
    triangle(finArry[27],finArry[32],finArry[28],c4,tag);
    triangle(finArry[28],finArry[32],finArry[29],c4,tag);
    triangle(finArry[29],finArry[32],finArry[30],c4,tag);
    triangle(finArry[30],finArry[32],finArry[31],c4,tag);
    triangle(finArry[31],finArry[32],finArry[24],c4,tag);

    triangle(finArry[15],finArry[0],finArry[33],c5,tag);
    triangle(finArry[0],finArry[1],finArry[33],c5,tag);
    triangle(finArry[1],finArry[2],finArry[34],c5,tag);
    triangle(finArry[2],finArry[3],finArry[34],c5,tag);
    triangle(finArry[3],finArry[4],finArry[35],c5,tag);
    triangle(finArry[4],finArry[5],finArry[35],c5,tag);
    triangle(finArry[5],finArry[6],finArry[36],c5,tag);
    triangle(finArry[6],finArry[7],finArry[36],c5,tag);
    triangle(finArry[7],finArry[8],finArry[37],c5,tag);
    triangle(finArry[8],finArry[9],finArry[37],c5,tag);
    triangle(finArry[9],finArry[10],finArry[38],c5,tag);
    triangle(finArry[10],finArry[11],finArry[38],c5,tag);
    triangle(finArry[11],finArry[12],finArry[39],c5,tag);
    triangle(finArry[12],finArry[13],finArry[39],c5,tag);
    triangle(finArry[13],finArry[14],finArry[40],c5,tag);
    triangle(finArry[14],finArry[15],finArry[40],c5,tag);

    triangle(finArry[33],finArry[1],finArry[34],c6,tag);
    triangle(finArry[34],finArry[3],finArry[35],c6,tag);
    triangle(finArry[35],finArry[5],finArry[36],c6,tag);
    triangle(finArry[36],finArry[7],finArry[37],c6,tag);
    triangle(finArry[37],finArry[9],finArry[38],c6,tag);
    triangle(finArry[38],finArry[11],finArry[39],c6,tag);
    triangle(finArry[39],finArry[13],finArry[40],c6,tag);
    triangle(finArry[40],finArry[15],finArry[33],c6,tag);
    triangle(finArry[33],finArry[34],finArry[41],c6,tag);
    triangle(finArry[34],finArry[35],finArry[41],c6,tag);
    triangle(finArry[35],finArry[36],finArry[41],c6,tag);
    triangle(finArry[36],finArry[37],finArry[41],c6,tag);
    triangle(finArry[37],finArry[38],finArry[41],c6,tag);
    triangle(finArry[38],finArry[39],finArry[41],c6,tag);
    triangle(finArry[39],finArry[40],finArry[41],c6,tag);
    triangle(finArry[40],finArry[33],finArry[41],c6,tag);
}

function render() {

    gl.enable(gl.CULL_FACE);
    // clear the working buffer
    gl.clear(gl.COLOR_BUFFER_BIT);


    eye = vec3(radius*Math.sin(phi), radius*Math.sin(cta),
        radius*Math.cos(phi));

    theta += Math.PI / 300;

    gl.uniform1f(thetaLoc, theta);

    modelViewMatrix = lookAt(eye,at,up);
    projectionMatrix = perspective(fovy, aspect, near, far);


    gl.uniformMatrix4fv( modelViewMatrixLoc, false,
        flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false,
        flatten(projectionMatrix) );

   // gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),ambientProduct);

    gl.drawArrays(gl.TRIANGLES, 0, 3 * count);

    window.requestAnimFrame(render);

    // recursively call render() in the context of the browser

}