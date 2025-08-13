import { useEffect, useRef, useState } from 'react';
import Controls from './Controls.jsx';
import QuadView from './QuadView.jsx';
import Mdl from './Mdl.js';
import tools from './tools.js';
const { floor } = Math;

function fetchModel() {
  return fetch('/player.mdl')
    .then((res) => res.arrayBuffer())
    .then((buf) => Mdl.fromBuffer(buf));
}

function fetchPalette() {
  return fetch('palette.lmp')
    .then((res) => res.arrayBuffer())
    .then(parsePalette);
}

function parsePalette(buf) {
  const bytes = new Uint8Array(buf);
  return new Array(256).fill(null)
    .map((e, i) => [bytes[i*3], bytes[i*3 + 1], bytes[i*3 + 2]]);
}


export default function App() {
  // -- members --
  var lastTickTime;
  const selectedVerts = [];
  const [tool, setTool] = useState(null);
  const [scene, _setScene] = useState(
    {
      selectedVerts: selectedVerts,
      entities: []
    }
  );
  const [activeSkin, setActiveSkin] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lerpFrameRequest = useRef(null);

  // -- doin stuff --
  useEffect(() => {
    const onMousedown = (e) => tool?.onMouseDown?.(e);
    const onMousemove = (e) => tool?.onMouseMove?.(e);
    const onMouseup = (e) => tool?.onMouseUp?.(e);
    document.addEventListener('mousedown', onMousedown);
    document.addEventListener('mousemove', onMousemove);
    document.addEventListener('mouseup', onMouseup);
    return () => {
      document.removeEventListener('mousedown', onMousedown);
      document.removeEventListener('mousemove', onMousemove);
      document.removeEventListener('mouseup', onMouseup);
    }
  }, [tool]);

  useEffect(() => {
    Promise.all([fetchPalette(), fetchModel()])
      .then((values) => {
        const _palette = values[0];
        const _model = values[1];
        const frame = 0;
        scene.palette = _palette;
        scene.entities = [
          {
            model: _model,
            frame: frame,
            nextFrame: decideNextFrame(frame, _model),
            lerp: 0
          }
        ];
        setScene(Object.assign({}, scene));
      });
    return function cleanup() {
      cancelAnimationFrame(lerpFrameRequest.current);
    }
  }, []);

  // should this go in an "effect" too? dependent on [playing]?
  if (playing) {
    if (!lerpFrameRequest.current) {
      lerpFrame();
    }
  } else {
    cancelLerpFrame();
  }

  // -- functions --

  const setScene = function() {
    console.log('setScene')
    _setScene.apply(this, arguments);
  }

  function onOpen(file) {
    var fr = new FileReader();
    fr.onloadend = (a,b,c) => {
      if (fr.readyState != FileReader.DONE) throw 'status bad';
      var buf = fr.result;
      const mdl = Mdl.fromBuffer(buf);

      scene.entities[0].model = mdl;

      const newScene = {};
      Object.assign(newScene, scene);

      setScene(newScene);
      setActiveSkin(0);
    }
    fr.readAsArrayBuffer(file);
  }

  function onSave() {
    var mdlbuf = scene.entities[0].model.toBuffer();
    var mdlblob = new Blob([mdlbuf], {type: 'application/octet-stream'});
    window.location = URL.createObjectURL(mdlblob);
  }

  function onClickPlay() {
    play();
  }

  function onClickStop() {
    stop();
  }

  function onToolSelected(toolName) {
    const toolClass = tools[toolName];

    if (!toolClass) {
      console.log(`no tool class found for "${toolName}"`);
      return;
    }

    console.log(`setting tool to new ${toolClass.name}`);
    setTool(new toolClass());
  }

  function onChangeFrame(newFrame) {
    scene.entities.forEach((ent) => ent.frame = newFrame)
  }

  function onPickSkin(i) {
    setActiveSkin(i);
  }

  function onChangeFrameset(evt) {
    const select = evt.target;
    const frame = parseInt(select.value);
    const ent = scene.entities[0];
    ent.frame = frame;
    ent.nextFrame = decideNextFrame(frame, ent.model);
    // TODO stop having to set nextFrame everywhere we set frame
    // seems like we should have some "model" layer, distinct from this "view model" code, allowing outsiders like the view model to make a single call to set the current frameset, and the model internally handles setting nextFrame etc
  }

  function play() {
    console.log('play')
    if (playing) return;
    setPlaying(true);
  }

  function stop() {
    console.log('stop')
    setPlaying(false);
  }

  function lerpFrame() {
    const now = Date.now();
    const dLerp = !lastTickTime ? 0 : (now - lastTickTime) / 100;

    scene.entities.forEach((ent) => {
      ent.lerp += dLerp;

      while (ent.lerp > 1) {
        ent.frame = ent.nextFrame;
        ent.nextFrame = decideNextFrame(ent.frame, ent.model);
        ent.lerp -= 1;
      }
    });

    lastTickTime = now;
    lerpFrameRequest.current = requestAnimationFrame(lerpFrame);
  }

  function decideNextFrame(frame, model) {
    let nextFrame = (frame + 1) % model.frames.length;
    let setname = getSetname(frame, model);

    if (getSetname(nextFrame, model) != setname) {
      while (nextFrame > 0 && getSetname(nextFrame - 1, model) == setname) {
        nextFrame -= 1;
      }
    }

    return nextFrame;
  }

  function getSetname(frame, model) {
    return model.frames[frame].simpleFrame.name.match(/^([^\d])*/)[0];
  }

  function cancelLerpFrame() {
    scene.entities.forEach((ent) => {
      ent.frame = Math.floor(ent.frame);
    });

    lastTickTime = null;
    cancelAnimationFrame(lerpFrameRequest.current);
    lerpFrameRequest.current = null;
  }

  return (
    <>
      <Controls scene={scene}
        activeSkin={activeSkin}
        playing={playing} tool={tool}
        onOpen={onOpen} onSave={onSave} onClickPlay={onClickPlay}
        onClickStop={onClickStop} onToolSelected={onToolSelected}
        onChangeFrame={onChangeFrame}
        onChangeFrameset={onChangeFrameset}
        onPickSkin={onPickSkin}
      />
      <QuadView scene={scene} activeSkin={activeSkin} tool={tool}
        onToolSelected={onToolSelected}
      />
    </>
  )
}
