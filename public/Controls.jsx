import { useEffect, useRef, useState } from 'react';

const TOOL_NAMES = ['single', 'sweep', 'move', 'addvert', 'addtri', 'addcube'];

export default function Controls({
  scene, playing, tool, onClickPlay, onClickStop, onChangeFrame, onOpen, onSave, onToolSelected
}) {
  const ent = !scene.entities.length ? null : scene.entities[0];
  const model = !ent ? null : ent.model;
  const [frame, setFrame] = useState(0);
  const toolButtons = TOOL_NAMES.map((t) =>
    <button type='button'
      key={t}
      disabled={t == tool.name}
      onClick={() => onToolSelected(t)}
    >
      {t}
    </button>
  );

  useEffect(() => {
    if (!playing) return;

    const id = setInterval(() => setFrame(Math.floor(entity().frame)), 100);

    return () => clearInterval(id);
  });

  const entity = () => scene.entities[0];

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
        value={!ent ? 0 : ent.frame} onChange={onChangeFrame}
      />

      <button onClick={playing ? onClickStop : onClickPlay}>
        { playing ? 'stop' : 'play' }
      </button>

      { !model ? null : model.frames[frame].simpleFrame.name }
      <hr/>

      <h3>Skin</h3>
      View skin...
      <hr/>
      <h3>Tools</h3>
      <div>
        {toolButtons}
      </div>
      <hr/>
    </div>
  )
}
