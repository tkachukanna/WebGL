let horizontalLinesAmount = 0;  
let verticalLinesAmount = 0; 

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length;
    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
   
        gl.drawArrays(gl.LINE_STRIP, 0, 40);
        for (let i = 0; i < horizontalLinesAmount - 1; i++ ) {
            gl.drawArrays(gl.LINE_STRIP, verticalLinesAmount * i + 41, verticalLinesAmount-1);
        }
        for (let i = 0; i < verticalLinesAmount; i++ ) {
            if(i === 40) {
                continue;
            }
            gl.drawArrays(gl.LINE_STRIP, this.count/6 + (horizontalLinesAmount * i), horizontalLinesAmount);
        }   
    }
}

function calcSurfaceEquation(u, v) {
    const L = +document.getElementById("l").value;
    const T = +document.getElementById("t").value;
    const B = +document.getElementById("b").value;

    document.getElementById("l-value").innerText = L;
    document.getElementById("t-value").innerText = T;
    document.getElementById("b-value").innerText = B;

    let x = L * u;
    let y = 3 * T * v / (1 + v**3) * B * (1 - u);
    let z = 3 * T * v**2 / (1 + v**3) * B * (1 - u);
    
    return { x: x/3, y: y/3, z: z/3 }
}

function CreateSurfaceData()
{
    horizontalLinesAmount = 0;
    verticalLinesAmount = 0;

    let vertexList = [];

    const minU = 0;
    const maxU = 1;
    const stepU = 0.1;

    const minV = -5;
    const maxV = 5;
    const stepV = 0.1;

    // Полілінії u
    for(let i = minU; i < maxU; i += stepU) {
        for(let j = minV; j < maxV; j += stepV) {
            let vertex = calcSurfaceEquation(i, j);
            vertexList.push(vertex.x, vertex.y, vertex.z); 
        }
        horizontalLinesAmount++;
    }
    
    // Полілінії v
    for(let j = minV; j < maxV; j += stepV) {
        for(let i = minU; i < maxU; i += stepU) {
            let vertex = calcSurfaceEquation(i, j);
            vertexList.push(vertex.x, vertex.y, vertex.z);
        }
        verticalLinesAmount++;
    }
    return vertexList;
}
