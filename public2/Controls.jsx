import { useEffect, useRef, useState } from 'react';

const TOOLS = ['single', 'sweep', 'move', 'addvert', 'addtri'];

export default function Controls({ scene, playing, toolState, onClickPlay, onClickStop, onChangeFrame }) {
  // const [modelVertexCount, setModelVertexCount] = useState(null);
  // const [modelFaceCount, setModelFaceCount] = useState(null);

  const ent = scene.entities[0];
  const model = ent.model;
  const frame = Math.floor(ent.frame);

  const toolButtons = TOOLS.map((tool) =>
    <button type='button'
      disabled={tool == toolState.get().split(".")[0]}
      onClick={() => toolState.set(tool)}
    >
      {tool}
    </button>
  );

  return (
    <>
      <div>
          <h3>File</h3>
          {/* onchange: angular.element(this).scope().open() */}
          <input type='file' id='file'
              ></input>
          <button type='button' ng-click='save()'>Save</button>
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
      {/* max='{{ model.frames.length - 1 }}' */}
      {/* onChange='{{ stop() }}' */}
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
    </>
  )
}
