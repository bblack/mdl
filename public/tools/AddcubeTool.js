import { vec3 } from '../components/gl-matrix/lib/gl-matrix.js';

const UNIT_CUBE = {
  verts: [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [1, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
  ],
  tris: [
    [2, 1, 0],
    [0, 3, 2],
    [5, 6, 7],
    [7, 4, 5],
    [1, 5, 4],
    [4, 0, 1],
    [6, 2, 3],
    [3, 7, 6],
    [3, 0, 4],
    [4, 7, 3],
    [6, 5, 1],
    [1, 2, 6]
  ]
}

export default class AddcubeTool {
  constructor() {
    this.name = 'addcube';
  }

  reset() {
    delete this.state;
    delete this.canvasStartPos;
    delete this.geomVerts;
    delete this.geomPos;
    delete this.modelVertIndeces;
    delete this.canvas;
    delete this.model;
    delete this.computeBasisMat3ForNewGeometry;
    delete this.zoom;
    delete this.camSpaceMatrix;
    delete this.scene;
  }

  onMouseDown(evt) {
    // hacky indictor for "is this event from a OrthoWireProjection component".
    // TODO: make clearer, maybe collect all these in something explicitly named for that component
    if (!evt.canvas) return;

    const [x, y] = [evt.offsetX, evt.offsetY];
    const { canvas, model, worldPosFromCanvasPos, zoom, camSpaceMatrix } = evt;
    const { verts, tris } = UNIT_CUBE;
    const newVertIndeces = verts.map(v => model.addVert(v));
    // TODO create Model#addtri
    tris.forEach(tri => {
      tri = tri.map(vertInd => model.vertexCount() + vertInd - verts.length);
      model.triangles.push({ facesFront: 0, vertIndeces: tri });
    });

    console.log('added verts ' + newVertIndeces.join(', '));

    Object.assign(this, {
      state: 'scaling',
      canvasStartPos: [x, y],
      geomVerts: verts, // geometry prototype, e.g. unit cube with origin (0,0,0)
      geomPos: worldPosFromCanvasPos(x, y, canvas, zoom, camSpaceMatrix),
      modelVertIndeces: verts.map((_, i) => model.vertexCount() - verts.length + i),
      canvas: evt.canvas,
      model: evt.model,
      computeBasisMat3ForNewGeometry: evt.computeBasisMat3ForNewGeometry,
      zoom: evt.zoom,
      camSpaceMatrix: evt.camSpaceMatrix,
      scene: evt.scene
    });
  }

  onMouseMove(evt) {
    if (this.state == 'scaling') {
      const {
        modelVertIndeces, geomVerts, geomPos, canvasStartPos,
        canvas, model, computeBasisMat3ForNewGeometry, zoom, camSpaceMatrix
      } = this;
      const canvasBounds = canvas.getBoundingClientRect();
      const [x, y] = [evt.clientX - canvasBounds.x, evt.clientY - canvasBounds.y];
      const basis = computeBasisMat3ForNewGeometry(x, y, canvasStartPos, canvas, zoom, camSpaceMatrix);

      const newGeomVertCoords = modelVertIndeces.map((vertIndex, i) => {
        const geomVert = vec3.fromValues.apply(vec3, geomVerts[i]);
        const outVert = vec3.create();

        vec3.transformMat3(outVert, geomVert, basis);
        vec3.add(outVert, outVert, vec3.fromValues.apply(vec3, geomPos));

        // console.log(`geom vert ${i}: (${geomVert.join(', ')}) -> (${outVert.join(', ')})`)

        return outVert;
      });

      model.frames.forEach(f => {
        modelVertIndeces.forEach((vertIndex, i) => {
          f.simpleFrame.verts[vertIndex] = {
            x: newGeomVertCoords[i][0],
            y: newGeomVertCoords[i][1],
            z: newGeomVertCoords[i][2]
          }
        });
      });
    }
  }

  onMouseUp(evt) {
    if (this.state == 'scaling') {
      const { scene } = this;
      // scene.selectedVerts = this.modelVertIndeces;
      // 1. WHY DOES THE ABOVE MEAN THAT SUBSEQUENT DRAWS REFLECT THE OLD SELECTION FOREVER?
      scene.selectedVerts.splice(0, scene.selectedVerts.length, ...this.modelVertIndeces)
      this.reset();
    }
  }
}
