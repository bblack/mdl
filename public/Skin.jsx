import { useEffect, useRef, useState } from 'react';

export default function Skin({ scene, activeSkin, onClose, onPickSkin }) {
  const canvasRef = useRef(null);
  const [style, setStyle] = useState({
    position: 'absolute',
    // height: '100px',
    // width: '100px',
    top: '200px',
    left: '200px',
    background: '#181818',
    borderRadius: '4px',
    boxShadow: '0 2px 8px black',
    padding: '1em'
  });

  const palette = scene.palette;
  const model = scene.entities[0].model;
  const width = model.skinWidth;
  const height = model.skinHeight;

  useEffect(() => {
    const skin = model.skins[activeSkin];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = buildImageDataFromSkin(skin);

    ctx.putImageData(imageData, 0, 0);
    drawTexMapMesh(model, ctx);
  }, [activeSkin]);

  function buildImageDataFromSkin(skin) {
    const pixelBytes = [];
    new Uint8Array(skin.data.data).forEach((color) => {
      const rgba = palette[color].concat(0xff); // alpha opaque
      pixelBytes.push.apply(pixelBytes, rgba);
    });
    return new ImageData(
      new Uint8ClampedArray(pixelBytes), width, height
    );
  }

  function startDrag(evt) {
    // TODO: disable selecting text while dragging
    const offsetX = evt.clientX - parseInt(style.left);
    const offsetY = evt.clientY - parseInt(style.top);
    const drag = (moveEvt) => {
      const left = moveEvt.clientX - offsetX;
      const top = moveEvt.clientY - offsetY;
      const newStyle = Object.assign({}, style);

      Object.assign(newStyle, {top: top, left: left})

      setStyle(newStyle);
    }
    const stopDrag = () => {
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('mousedown', stopDrag);
    }
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDrag);
    // window.addEventListener('mousedown', stopDrag);
  }

  const buttons = model.skins.map((skin, i) => {
    return <button key={i} onClick={() => onPickSkin(i)}>{i}</button>
  })

  return (
    <>
      <div className='dialog palette' style={style}
        onMouseDown={startDrag}>
        <div className='head'>
          <div className='title'>skin</div>
          <div className='close' onClick={onClose}></div>
        </div>
        {paletteTable(palette)}
        <canvas className='skin' ref={canvasRef}
          width={width} height={height}
          style={{width: width*2, height: height*2}}
        />
        {buttons}
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

function drawTexMapMesh(model, ctx) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';

  model.texCoords.forEach(texCoord => {
    const { s, t } = texCoord;

    ctx.fillRect(s - 1, t - 1, 3, 3);

    if (texCoord.onSeam) {
      ctx.fillRect(s + model.skinWidth / 2 - 1, t - 1, 3, 3);
    }
  });

  model.triangles.forEach(tri => {
    ctx.beginPath();

    const st0 = model.texCoords[tri.vertIndeces[0]];
    const st1 = model.texCoords[tri.vertIndeces[1]];
    const st2 = model.texCoords[tri.vertIndeces[2]];

    ctx.moveTo(st0.s + (!tri.facesFront && st0.onSeam ? (model.skinWidth / 2) : 0), st0.t);
    ctx.lineTo(st1.s + (!tri.facesFront && st1.onSeam ? (model.skinWidth / 2) : 0), st1.t);
    ctx.lineTo(st2.s + (!tri.facesFront && st2.onSeam ? (model.skinWidth / 2) : 0), st2.t);
    ctx.lineTo(st0.s + (!tri.facesFront && st0.onSeam ? (model.skinWidth / 2) : 0), st0.t);
    ctx.stroke();
  })
}
