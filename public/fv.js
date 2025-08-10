const {PI, sin, cos, sqrt} = Math;

class Mat3 {
  constructor(
    xx, yx, zx, // output x
    xy, yy, zy, // output y
    xz, yz, zz  // output z
  ) {
    this.x = new Vec3(xx, yx, zx);
    this.y = new Vec3(xy, yy, zy);
    this.z = new Vec3(xz, yz, zz);
  }

  static fromVectors(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  multVec3(v) {
    return new Vec3(
      v.dot(this.x),
      v.dot(this.y),
      v.dot(this.z)
    );
  }

  transpose() {
    const { x, y, z } = this;
    return new Mat3(
      x.x, y.x, z.x,
      x.y, y.y, z.y,
      x.z, y.z, z.z
    );
  }
}

class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static fromArray(a) {
    return new Vec3(a[0], a[1], a[2]);
  }

  cross(v) {
    return new Vec3(
      this.y*v.z - this.z*v.y,
      this.z*v.x - this.x*v.z,
      this.x*v.y - this.y*v.x
    );
  }

  dot(v) {
    return this.x * v.x +
      this.y * v.y +
      this.z * v.z;
  }

  mag() {
    const { x, y, z } = this;
    return sqrt(x * x + y * y + z * z);
  }

  normalize() {
    const n = this.mag();
    return this.scale(1 / n);
  }

  scale(n) {
    return new Vec3(this.x * n, this.y * n, this.z * n);
  }

  rotate(th, axis) {
    axis = axis.normalize();

    const c = cos(th);
    const s = sin(th);
    const nx = axis.x;
    const ny = axis.y;
    const nz = axis.z;

    const m = new Mat3(
      c + (1 - c) * nx * nx, (1 - c) * ny * nx - s * nz, (1 - c) * nz * nx + s * ny,
      (1 - c) * nx * ny + s * nz, c + (1 - c) * ny * ny, (1 - c) * nz * ny - s * nx,
      (1 - c) * nx * nz - s * ny, (1 - c) * ny * nz + s * nx, c + (1 - c) * nz * nz
    );

    return m.multVec3(this);
  }

  rotateZ(th) {
    const m = new Mat3(
      cos(th),  -sin(th), 0,
      sin(th), cos(th), 0,
      0,        0,       1
    );
    return this.mult(m);
  }

  mult(mat3) {
    return mat3.multVec3(this);
  }
}

console.log(new Vec3(1, 0, 0).rotateZ(PI/4));
console.log(new Vec3(0, 1, 0).rotateZ(PI/4));

export  { Mat3, Vec3 };
