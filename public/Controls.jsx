import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Skin from './Skin.jsx';

const TOOL_NAMES = ['single', 'sweep', 'move', 'rotate', 'addvert', 'addtri', 'addcube', 'adddisc'];

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
  onPickSkin,
  onChangeFrameset
}) {
  const ent = !scene.entities.length ? null : scene.entities[0];
  const model = !ent ? null : ent.model;
  // TODO: we should NOT have our own "frame" state. it causes e.g. the displayed label to be out of date once the "frameset" is switched, since the true authoritative frame is in scene.entities[0].frame, owned by parent.
  const [frame, setFrame] = useState(0);
  const [showSkinModal, setShowSkinModal] = useState(false);
  const toolButtons = TOOL_NAMES.map((t) =>
    <button type='button'
      key={t}
      disabled={t == tool?.name}
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

  function frameSetOptions() {
    if (!model) return [];

    return model.frames
      .reduce((acc, f, i) => {
        const name = f.simpleFrame.name;
        const match = name.match(/^([^\d])*/);
        console.assert(match, `no frameset name found in frame "${name}"`);
        const setname = match[0];

        const currentSet = acc.length == 0 ? null : acc[acc.length - 1];

        if (currentSet && currentSet.name == setname) {
          currentSet.frames.push(i);
        } else {
          const newSet = { name: setname, frames: [i] };
          acc.push(newSet);
        }

        return acc;
      }, [])
      .map(frameSet => {
        const name = frameSet.name;
        const frame = frameSet.frames[0];
        return <option key={name} value={frame}>{name}</option>
      });
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
      <div>
        <select name='frameset' onChange={onChangeFrameset}>
          {frameSetOptions()}
        </select>
      </div>
      <div>
        <input type='range' min='0' max={!model ? 0 : model.frames.length - 1}
          value={frame} onChange={_onChangeFrame}
        />
        <button onClick={playing ? onClickStop : onClickPlay}>
          { playing ? 'stop' : 'play' }
        </button>
      </div>
      <div>
        { !model ? null : model.frames[frame].simpleFrame.name }
      </div>
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
