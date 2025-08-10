const {PI, sin, cos} = Math;

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
}

class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot(v) {
    return this.x * v.x +
      this.y * v.y +
      this.z * v.z;
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

export default { Mat3, Vec3 };
