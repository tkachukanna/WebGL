export default function Model(gl, uGranularity, vGranularity, L, T, B) {
    this.gl = gl;
    this.uGranularity = uGranularity;
    this.vGranularity = vGranularity;
    this.L = L;
    this.T = T;
    this.B = B;

    this.minU = 0;
    this.maxU = 1;
    this.stepU = 0.1;

    this.minV = -5;
    this.maxV = 5;
    this.stepV = 0.1;

    this.init = function () {
        this.createSurfaceData();
        this.initBuffers();
    }

    this.calcSurfaceEquation = function(u, v)  {
        let x = this.L * u;
        let y = 3 * this.T * v / (1 + v**3) * this.B * (1 - u);
        let z = 3 * this.T * v**2 / (1 + v**3) * this.B * (1 - u);
        return {x: x, y: y, z: z};
    }

    this.createSurfaceData = function () {
        let uCount = this.uGranularity + 1;
        let vCount = this.vGranularity + 1;
        let totalVertices = uCount * vCount * 2;

        this.vertexList = new Float32Array(totalVertices * 3);

        for (let i = 0; i < vCount; i++) {
            let v = this.minV + (this.maxV - this.minV) * i / this.vGranularity;
            for (let j = 0; j < uCount; j++) {
                let u = this.minU + (this.maxU - this.minU) * j / this.uGranularity;
                let vertex = this.calcSurfaceEquation(u, v);
                let index = i * uCount + j;

                this.vertexList[index * 3] = vertex.x;
                this.vertexList[index * 3 + 1] = vertex.y;
                this.vertexList[index * 3 + 2] = vertex.z;
            }
        }

        //Візуалізація поверхні із заповненими трикутниками за допомогою технології VBO (Vertex Buffer Object) з індексами
        let indices = [];
        for (let v = 0; v < vCount - 1; v++) {
            for (let u = 0; u < uCount - 1; u++) {
                let plusTL = v * uCount + u;
                let plusTR = v * uCount + (u + 1);
                let plusBL = (v + 1) * uCount + u;
                let plusBR = (v + 1) * uCount + (u + 1);

                let minusTL = plusTL + vCount * uCount;
                let minusTR = plusTR + vCount * uCount;
                let minusBL = plusBL + vCount * uCount;
                let minusBR = plusBR + vCount * uCount;

                indices.push(plusTL, plusTR, minusTR);
                indices.push(plusTL, minusTR, minusTL);
                indices.push(plusTR, plusBR, minusBR);
                indices.push(plusTR, minusBR, minusTR);
                indices.push(plusTL, minusTL, minusBL);
                indices.push(plusTL, minusBL, plusBL);
                indices.push(plusBL, plusBR, minusBR);
                indices.push(plusBL, minusBR, minusBL);
            }
        }

        this.indices = new Uint16Array(indices);

        // Обчислення Facet Average normal
        this.normalList = new Float32Array(totalVertices * 3);
        let faceCount = this.indices.length / 3;
        let tempNormals = new Array(totalVertices);
        for (let i = 0; i < totalVertices; i++) {
            tempNormals[i] = [0,0,0];
        }
        for (let f = 0; f < faceCount; f++) {
            let i1 = this.indices[f * 3];
            let i2 = this.indices[f * 3 + 1];
            let i3 = this.indices[f * 3 + 2];

            let p1 = [this.vertexList[i1 * 3], this.vertexList[i1 * 3 + 1], this.vertexList[i1 * 3 + 2]];
            let p2 = [this.vertexList[i2 * 3], this.vertexList[i2 * 3 + 1], this.vertexList[i2 * 3 + 2]];
            let p3 = [this.vertexList[i3 * 3], this.vertexList[i3 * 3 + 1], this.vertexList[i3 * 3 + 2]];

            let U = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
            let V = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
            let Nx = U[1] * V[2] - U[2] * V[1];
            let Ny = U[2] * V[0] - U[0] * V[2];
            let Nz = U[0] * V[1] - U[1] * V[0];

            tempNormals[i1][0] += Nx; 
            tempNormals[i1][1] += Ny; 
            tempNormals[i1][2] += Nz;
            tempNormals[i2][0] += Nx; 
            tempNormals[i2][1] += Ny; 
            tempNormals[i2][2] += Nz;
            tempNormals[i3][0] += Nx; 
            tempNormals[i3][1] += Ny; 
            tempNormals[i3][2] += Nz;
        }

        for (let i = 0; i < totalVertices; i++){
            let len = Math.sqrt(tempNormals[i][0] * tempNormals[i][0] + tempNormals[i][1] * tempNormals[i][1] + tempNormals[i][2] * tempNormals[i][2]);
            if (len > 0.000001) {
                this.normalList[i * 3] = tempNormals[i][0] / len;
                this.normalList[i * 3 + 1] = tempNormals[i][1] / len;
                this.normalList[i * 3 + 2] = tempNormals[i][2] / len;
            } else {
                this.normalList[i * 3] = 0;
                this.normalList[i * 3 + 1] = 0;
                this.normalList[i * 3 + 2] = 1;
            }
        }
    }
    

    this.initBuffers = function () {
        const gl = this.gl;
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexList, gl.STATIC_DRAW);

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalList, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    
    this.draw = function(shaderProgram) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.iAttribNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT,0);
    }
}
