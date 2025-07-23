import { useEffect, useRef, useState } from 'react';

const TOOL_NAMES = ['single', 'sweep', 'move', 'addvert', 'addtri'];

export default function Controls({
  scene, playing, tool, onClickPlay, onClickStop, onChangeFrame, onOpen, onSave, onToolSelected
}) {
  if (scene.entities.length == 0) return null;

  const ent = scene.entities[0];
  const model = ent.model;
  const [frame, setFrame] = useState(Math.floor(ent.frame));
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
              <td>{ model.texCoords.length }</td>
          </tr>
          <tr>
              <td>Faces</td>
              <td>{ model.triangles.length }</td>
          </tr>
          <tr>
              <td>Frames</td>
              <td>{ model.frames.length }</td>
          </tr>
          <tr>
              <td>Skins</td>
              <td>{ model.skins.length }</td>
          </tr>
        </tbody>
      </table>
      <hr/>

      <h3>Animation</h3>

      <input type='range' min='0' max={model.frames.length - 1} value={ent.frame} onChange={onChangeFrame} />

      <button onClick={playing ? onClickStop : onClickPlay}>
        { playing ? 'stop' : 'play' }
      </button>

      { model.frames[frame].simpleFrame.name }
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
