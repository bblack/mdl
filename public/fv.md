# fv

this library is optimized for readability and understanding - to make you, the programmer faster, and less error-prone, even if it makes the program slower.

## named components, not numbered indeces

the most performant way to do things might be to treat vectors and even matrices as one-dimensional arrays, with numbered indeces assigned to their components. but in my experience, that leads to more confusion and mistakes. most mathematical writing refers to e.g. "the x component" of a vector, not `v[0]`.

therefore, we prefer **named components** like `vec3.x`.

## row vectors

i like to read matrix multiplication like "input -> machine -> output", or:

> vec3 * mat3 = vec3'

therefore, all vectors are **row vectors**.

## column-major matrix constructors

i find it easiest to think of a transformation matrix primarily in terms of its output vector, rather than its input vector. therefore Mat3 construction reads like:

```js
new Mat3(
  xx, yx, zx, // output vector x
  xy, yy, zy, // output vector y
  xz, yz, zz  // output vector z
)
```

therefore, all matrices are constructed in **column-major order**.

this has the unfortunate effect that matrices constructed in code appear transposed, relative to their proper appearance in handwriting or documentation.

## right-handed coordinate system

as described.
