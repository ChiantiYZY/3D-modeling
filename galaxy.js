"use strict";

var canvas;
var gl;
var pBuffer, cBuffer, tBuffer, nBuffer, vBuffer;
var count = 0;
var scount = 0; // total number of triangles for a star
var maxNumTriangles = 400000;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;
var tindex = 0;
var theta = 0;
var thetaLoc;
var object = 0;
var objectLoc;
var circleArr = [];
var texSize = 64;
var near = 0.3;
var far = 8.0;
var radius = 4.0;
var cta  = 0.0;
var phi    = 0.0;
var program;
var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0; // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);  // changed from const
var up = vec3(0.0, 1.0, 0.0);  // changed from const

var lightPosition1 = vec4(-0.8, -0.4, 3, 0.0 );
var lightAmbient1 = vec4(20/255,158/255,160/255, 1.0);
var lightDiffuse1 = vec4( 0 ,1,0,1.0 );
var lightSpecular1 = vec4( 0.5, 0.5, 1.0, 1.0 );

var lightPosition2 = vec4(1.0, 1.5, 2.0, 0.0 );
var lightAmbient2 = vec4(178/255,34/255,34/255, 1.0);
var lightDiffuse2 = vec4( 1,0,0,1.0 );
var lightSpecular2 = vec4( 1.0, 0.5, 0.5, 1.0 );
var materialShininess = 400;

var colors = [

    vec4(0.0, 0.0, 1.0, 1.0),  // blue 0
    vec4(0.0, 0.8, 0.0, 1.0), // light green 1
    vec4(1.0, 150 / 255, 0.0, 1.0), // orange 2
    vec4(0.75, 0.75, 0.75, 1.0),  // yellow 3
    vec4(0.0, 1.0, 0.0, 1.0),  // green 4
    vec4(0.0, 0.0, 0.0, 1.0),  // black 5
    vec4(1.0, 1.0, 1.0, 1.0),  // white 6
    vec4(0.5, 0.5, 0.5, 1.0),  // red 7
    vec4(0.9, 0.8, 0.3, 1.0),   // background 8
    vec4(238 / 256, 130 / 256, 245 / 256, 1.0), // violet 9
    vec4(0,0,0.8, 1.0) // earth 10
];


var texCoordsArray = [];

var texture;

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function configureTexture( image ) {
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
        gl.RGB, gl.UNSIGNED_BYTE, image );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.NEAREST );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

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
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

    var vTag = gl.getAttribLocation(program, "vTag");
    gl.vertexAttribPointer(vTag, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTag);

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 12 * maxNumVertices, gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);


    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    background();
    sky();
    sphere(0.4,200,50,10,0);
    cone(0.1, 0.1, 50, 7, 2);
    fin(7,1);
    fin1(7,1);
    cylinder(0.1,0.06,0,0.3,3,1);
    Circle(0.06,0.3,3,1);

    var image = document.getElementById("texImage");

    thetaLoc = gl.getUniformLocation(program, "theta");
    objectLoc = gl.getUniformLocation(program, "object");
    projectionMatrixLoc = gl.getUniformLocation(program,"projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program,"modelViewMatrix");

    var ambientProduct1 = lightAmbient1;
    var diffuseProduct1 = lightDiffuse1;
    var specularProduct1 = lightSpecular1;
    var ambientProduct2 = lightAmbient2;
    var diffuseProduct2 = lightDiffuse2;
    var specularProduct2 = lightSpecular2;

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct1"),
        flatten(ambientProduct1));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct1"),
        flatten(diffuseProduct1) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct1"),
        flatten(specularProduct1) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition1"),
        flatten(lightPosition1) );
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct2"),
        flatten(ambientProduct2));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct2"),
        flatten(diffuseProduct2) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct2"),
        flatten(specularProduct2) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition2"),
        flatten(lightPosition2) );
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"),materialShininess);
    //
    //



    var newImage = new Image();
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    newImage.src = "square.gif";
    newImage.onload = function()
    {
        configureTexture(newImage);
    }

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

function background()
{

        var a = vec4( -3.5, -3.5,  -3.5, 1.0 );
        var b = vec4( -3.5,  3.5,  -3.5, 1.0 );
        var c = vec4( 3.5,  3.5,  -3.5, 1.0 );
        var d = vec4( 3.5, -3.5,  -3.5, 1.0 );

    triangle(b,a,d,1,9);
    triangle(d,c,b,1,9);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * tindex, flatten(texCoord[1]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (tindex + 1), flatten(texCoord[0]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (tindex + 2), flatten(texCoord[3]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (tindex + 3), flatten(texCoord[3]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (tindex + 4), flatten(texCoord[2]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (tindex + 5), flatten(texCoord[1]));

}


function sky()
{
    //gl.clearColor(0.0,0.0,0.0,1.0);
    for(var i = 0; i < 10; i++)
    {
        star(0.005, Math.random(),Math.random(),Math.random()*3,9,5);
        star(0.005, Math.random(),Math.random(),-Math.random()*3,6,6);
        star(0.005, Math.random(),Math.random(),Math.random()*3,3,7);
        star(0.005, Math.random(),Math.random(),-Math.random()*3,6,8);
    }
    for(var i = 0; i < 10; i++)
    {
        star(0.005, -Math.random(),Math.random(), -Math.random()*3,6,5);
        star(0.005, -Math.random(),Math.random(),Math.random()*3,3,6);
        star(0.005, -Math.random(),Math.random(),-Math.random()*3,6,7);
        star(0.005, -Math.random(),Math.random(),Math.random()*3,9,8);
    }
    for(var i = 0; i < 10; i++)
    {
        star(0.005, -Math.random(),-Math.random(),Math.random()*3,6,5);
        star(0.005, -Math.random(),-Math.random(),-Math.random()*3,9,6);
        star(0.005, -Math.random(),-Math.random(),-Math.random()*3,3,7);
        star(0.005, -Math.random(),-Math.random(),Math.random()*3,6,8);
    }
    for(var i = 0; i < 10; i++)
    {
        star(0.005, Math.random(),-Math.random(),-Math.random()*3,9,5);
        star(0.005, Math.random(),-Math.random(),Math.random()*3,6,6);
        star(0.005, Math.random(),-Math.random(),Math.random()*3,3,7);
        star(0.005, Math.random(),-Math.random(),-Math.random()*3,6,8);
    }
}


function getNormal(a,b,c)
{
    var t1 = subtract(a,b);
    var t2 = subtract(b,c);
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

function star(r,x0,y0,z0,color,tag)
{
    var i = 1;
    var d, dp,xn, yn, xm, ym;
    var t, m, n;
    for (i; i <= 10; i++) {
        d = i * Math.PI / 5;
        dp = (i-1)* Math.PI / 5;
        xn = x0 + Math.cos(d) * r;
        yn = y0 + Math.sin(d) * r;
        xm = x0 + Math.cos(dp) * r;
        ym = y0 + Math.sin(dp) * r;
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        t = vec4(x0, y0,z0,1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        t = vec4(colors[color]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER,tBuffer);
        t = vec4(tag,tag,tag,tag);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index,flatten(t));
        index ++;

        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        m = vec4(xm, ym,z0,1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index , flatten(m));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        m = vec4(colors[color]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index , flatten(m));

        gl.bindBuffer(gl.ARRAY_BUFFER,tBuffer);
        m = vec4(tag,tag,tag,tag);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*index,flatten(m));
        index ++;

        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        n = vec4(xn, yn,z0,1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(n));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        n = vec4(colors[color]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(n));

        gl.bindBuffer(gl.ARRAY_BUFFER,tBuffer);
        n = vec4(tag,tag,tag,tag);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*index,flatten(n));
        count ++;
        index ++;
        scount ++;
    }
}

function Circle(r,y,color,tag)
{
    var i = 1;
    var d, dp,xn, zn, xm, zm;
    var t, m, n;
    for (i; i <= 50; i++) {
        d = i * Math.PI / 25;
        dp = (i-1)* Math.PI / 25;
        xn =  Math.cos(d) * r;
        zn =  Math.sin(d) * r;
        xm =  Math.cos(dp) * r;
        zm =  Math.sin(dp) * r;

        var a = vec4(0,y,0,1);
        var b = vec4(xm, y, zm, 1);
        var c = vec4(xn,y,zn,1);

        triangle(a, b, c, color, tag);
    }
}

// split to x parts
function circleIndex(x)
{
    var i = 1;
    var d;
    for (i; i <= x; i++) {
        d = i * 2 * Math.PI / x;
        circleArr.push(d);
    }
}

//r = radius, x = x parts of circle, y = height
function cone(r, y, x, color, tag)
{
    circleIndex(x);

    for (var j = 0; j < x; j++) {
        var t, m, n, origin;
        var xPosition = Math.cos(circleArr[j]) * r;
        var zPosition = Math.sin(circleArr[j]) * r;
        if (j != (x - 1)) {
            var xP = Math.cos(circleArr[j + 1]) * r;
            var zP = Math.sin(circleArr[j + 1]) * r;
        }
        else {
            var xP = Math.cos(circleArr[0]) * r;
            var zP = Math.sin(circleArr[0]) * r;
        }

        origin = vec4(0,0.0,0,1);
        t = vec4(xPosition,y,zPosition,1);
        m = vec4(xP,y,zP,1);

        triangle(origin,m,t,color,tag);
    }

    circleArr = [];
}

//r1 = bottom radius, r2 = top radius, y = bottom y axis, h = height
function cylinder(r1,r2,y,h, color, tag)
{
    var x = 50;
    circleIndex(x);

    for (var j = 0; j < x; j++) {
        var xBottom = Math.cos(circleArr[j]) * r1;
        var zBottom = Math.sin(circleArr[j]) * r1;
        var xTop = Math.cos(circleArr[j]) * r2;
        var zTop = Math.sin(circleArr[j]) * r2;
        var t, m, n, k;

        if (j != (x - 1)) {
            var xB = Math.cos(circleArr[j + 1]) * r1;
            var zB = Math.sin(circleArr[j + 1]) * r1;
            var xT = Math.cos(circleArr[j + 1]) * r2;
            var zT = Math.sin(circleArr[j + 1]) * r2;
        }
        else {
            var xB = Math.cos(circleArr[0]) * r1;
            var zB = Math.sin(circleArr[0]) * r1;
            var xT = Math.cos(circleArr[0]) * r2;
            var zT = Math.sin(circleArr[0]) * r2;
        }

        t = vec4(xBottom, y, zBottom,1);
        m = vec4(xB,y,zB,1);
        n = vec4(xTop,y+h,zTop,1);
        k = vec4(xT, y+h, zT, 1);
        if(r1 < r2)
        {
            triangle(t,n,m,color,tag);
            triangle(m,n,k,color,tag);
        }
        else
        {
            triangle(t,m,n,color,tag);
            triangle(m,k,n,color,tag);
        }

    }
    circleArr = [];
}

function fin(color, tag)
{
    var finArry = [vec4(-0.03, 0.2, 0.07, 1.0),
        vec4(0.03, 0.2, 0.07, 1.0),
        vec4(-0.03, 0.35, 0.18, 1),
        vec4(0.03, 0.35, 0.18, 1),
        vec4(-0.03, 0.32, 0.06, 1),
        vec4(0.03, 0.32, 0.06, 1)];

    triangle(finArry[0],finArry[2],finArry[4],color,tag);
    triangle(finArry[1],finArry[5],finArry[3],color,tag);
    triangle(finArry[0],finArry[3],finArry[2],color,tag);
    triangle(finArry[0],finArry[1],finArry[3],color,tag);
    triangle(finArry[4],finArry[2],finArry[5],color,tag);
    triangle(finArry[2],finArry[3],finArry[5],color,tag);
}

function fin1(color, tag)
{
    var finArry = [vec4(-0.03, 0.2, -0.07, 1.0),
        vec4(0.03, 0.2, -0.07, 1.0),
        vec4(-0.03, 0.35, -0.18, 1),
        vec4(0.03, 0.35, -0.18, 1),
        vec4(-0.03, 0.32, -0.06, 1),
        vec4(0.03, 0.32, -0.06, 1)];

    triangle(finArry[0],finArry[2],finArry[4],color,tag);
    triangle(finArry[1],finArry[5],finArry[3],color,tag);
    triangle(finArry[0],finArry[3],finArry[2],color,tag);
    triangle(finArry[0],finArry[1],finArry[3],color,tag);
    triangle(finArry[4],finArry[2],finArry[5],color,tag);
    triangle(finArry[2],finArry[3],finArry[5],color,tag);
}

// layer = how many layer circles, parts = # of parts each circle
function sphere(r, layers, parts, color, tag)
{
    var angle = 2 * Math.PI / layers;
    circleIndex(layers);

    for(var i = layers / 2 ; i < layers; i++)
    {
        var rBottom = r * Math.cos(i * angle);
        var rTop = r * Math.cos((i + 1) * angle);
        var hBottom = r * Math.sin(i * angle);
        var hTop = r * Math.sin((i+1) * angle);
        var height = hTop - hBottom;

        cylinder(rBottom, rTop, hBottom, height, color, tag);
    }

    for(var i = 0; i < layers / 2; i++)
    {
        var rBottom = r * Math.cos(i * angle);
        var rTop = r * Math.cos((i + 1) * angle);
        var hBottom = r * Math.sin(i * angle);
        var hTop = r * Math.sin((i+1) * angle);
        var height = hTop - hBottom;

        cylinder(rBottom, rTop, hBottom, height, color, tag);
    }
}

function render() {

    gl.enable(gl.CULL_FACE);
    // clear the working buffer
    gl.clear(gl.COLOR_BUFFER_BIT);
    //background();
    gl.enable(gl.DEPTH_TEST);
    //ctx.clear(gl.DEPTH_BUFFER_BIT);

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

    gl.drawArrays(gl.TRIANGLES, 0, 3 * scount + 6);

    // render index vertices and colors from their buffers
    for (var i = 0; i < 3; i++)
    {
        object = i;
        gl.uniform1f(objectLoc,object);
        gl.drawArrays(gl.TRIANGLES, 3 * scount + 6, 3 * count);
    }

    //gl.drawArrays(gl.TRIANGLES, 0, 3 * count);

    // recursively call render() in the context of the browser
    window.requestAnimFrame(render);
}