import { useEffect, useRef, useState } from 'react';

export default function Skin({ scene }) {
  const canvasRef = useRef(null);
  const style = {
    position: 'absolute',
    // height: '100px',
    // width: '100px',
    top: '200px',
    left: '200px',
    background: '#181818',
    borderRadius: '4px',
    boxShadow: '0 2px 8px black',
    padding: '1em'
  }
  const palette = scene.palette;
  const model = scene.entities[0].model;
  const width = model.skinWidth;
  const height = model.skinHeight;

  useEffect(() => {
    const pixelBytes = [];
    const skin = model.skins[0];

    new Uint8Array(skin.data.data).forEach((color) => {
      const rgba = palette[color].concat(0xff); // alpha opaque
      pixelBytes.push.apply(pixelBytes, rgba);
    });
    const imageData = new ImageData(
      new Uint8ClampedArray(pixelBytes), width, height
    );

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.putImageData(imageData, 0, 0);
  });

  return (
    <>
      <div className='palette' style={style}>
        <div className='title'>skin</div>
        {paletteTable(palette)}
        <canvas className='skin' ref={canvasRef}
          width={width} height={height}
          style={{width: width*2, height: height*2}}
        />
      </div>
    </>
  );
}

function paletteTable(palette) {
  const rows = [];

  for (var i = 0; i < palette.length; i += 8) {
    const cells = palette.slice(i, i + 8).map(el => {
      const rgb = el.join(', ');
        return <td key={rgb} style={{ backgroundColor: `rgb(${rgb})` }}>
      </td >
    });
    const row = <tr key={i}>{cells}</tr>;
    rows.push(row);
  }

  return <table><tbody>{rows}</tbody></table>;
}
