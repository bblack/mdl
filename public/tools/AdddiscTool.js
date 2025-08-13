import AbstractAddGeomTool from "./AbstractAddGeomTool.js";
const { sqrt } = Math;

export default class AdddiscTool extends AbstractAddGeomTool {
  constructor() {
    super();
    this.name = 'adddisc';
    this.UNIT_MESH = {
      verts: [
        [1, 0, 0],
        [0.5, 0.5 * sqrt(3), 0],
        [-0.5, 0.5 * sqrt(3), 0],
        [-1, 0, 0],
        [-0.5, -0.5 * sqrt(3), 0],
        [0.5, -0.5 * sqrt(3), 0],
      ],
      tris: [
        [0, 1, 5],
        [1, 4, 5],
        [2, 4, 1],
        [2, 3, 4]
      ]
    };
  }
}
