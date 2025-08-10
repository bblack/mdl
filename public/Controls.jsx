import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Skin from './Skin.jsx';

const TOOL_NAMES = ['single', 'sweep', 'move', 'rotate', 'addvert', 'addtri', 'addcube'];

export default function Controls({
  scene,
  activeSkin,
  playing,
  tool,
  onClickPlay,
  onClickStop,
  onChangeFrame,
  onOpen,
  onSave,
  onToolSelected,
  onPickSkin
}) {
  const ent = !scene.entities.length ? null : scene.entities[0];
  const model = !ent ? null : ent.model;
  const [frame, setFrame] = useState(0);
  const [showSkinModal, setShowSkinModal] = useState(false);
  const toolButtons = TOOL_NAMES.map((t) =>
    <button type='button'
      key={t}
      disabled={t == tool.name}
      onClick={() => onToolSelected(t)}
    >
      {t}
    </button>
  );
  const entity = () => scene.entities[0];

  useEffect(() => {
    if (!playing) return;

    const id = setInterval(() => setFrame(Math.floor(entity().frame)), 100);

    return () => clearInterval(id);
  });

  function onClickViewSkin() {
    setShowSkinModal(true);
  }

  function _onChangeFrame(evt) {
    const newFrame = parseInt(evt.target.value);

    if (isNaN(newFrame)) {
      console.warn('NaN: ' + newFrame);
      return;
    }

    setFrame(newFrame);
    onChangeFrame(newFrame);
  }

  return (
    <div id='controls'>
      <div>
          <h3>File</h3>
          <input type='file' id='file'
            onChange={(evt) => onOpen(evt.target.files[0])}>
          </input>
          <button type='button' onClick={onSave}>Save</button>
      </div>
      <h3>Model info</h3>
      <table>
        <tbody>
          <tr>
              <td>Vertices</td>
              <td>{ !model ? '-' : model.texCoords.length }</td>
          </tr>
          <tr>
              <td>Faces</td>
              <td>{ !model ? '-' : model.triangles.length }</td>
          </tr>
          <tr>
              <td>Frames</td>
              <td>{ !model ? '-' : model.frames.length }</td>
          </tr>
          <tr>
              <td>Skins</td>
              <td>{ !model ? '-' : model.skins.length }</td>
          </tr>
        </tbody>
      </table>
      <hr/>

      <h3>Animation</h3>

      <input type='range' min='0' max={!model ? 0 : model.frames.length - 1}
        value={frame} onChange={_onChangeFrame}
      />

      <button onClick={playing ? onClickStop : onClickPlay}>
        { playing ? 'stop' : 'play' }
      </button>

      { !model ? null : model.frames[frame].simpleFrame.name }
      <hr/>

      <h3>Skin</h3>
        <button onClick={onClickViewSkin}>View skin...</button>
      <hr/>
      <h3>Tools</h3>
      <div>
        {toolButtons}
      </div>
      <hr/>

      {showSkinModal &&
        createPortal(
          <Skin scene={scene}
            activeSkin={activeSkin}
            onClose={() => setShowSkinModal(false)}
            onPickSkin={onPickSkin}
          />,
          document.body
        )
      }
    </div>
  )
}
