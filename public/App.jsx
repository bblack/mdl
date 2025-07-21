import { useEffect, useRef, useState } from 'react';
import './components/buffer/buffer.js';
import Controls from './Controls.jsx';
import QuadView from './QuadView.jsx';
import Mdl from './Mdl.js';

function fetchModel() {
  return fetch('/player.mdl')
    .then((res) => res.arrayBuffer())
    .then((buf) => new buffer.Buffer(new Uint8Array(buf))) // redundant?
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


export default function App({ }) {
  // -- members --
  var lastTickTime;
  const selectedVerts = [];
  const [toolState, setToolState] = useState('single');
  const [scene, _setScene] = useState(
    {
      selectedVerts: selectedVerts,
      entities: []
    }
  );
  const [playing, setPlaying] = useState(false);
  const lerpFrameRequest = useRef(null);

  // -- doin stuff --

  useEffect(() => {
    Promise.all([fetchPalette(), fetchModel()])
      .then((values) => {
        const _palette = values[0];
        const _model = values[1];
        scene.palette = _palette;
        scene.entities = [
          {model: _model, frame: 0}
        ];
        setScene(Object.assign({}, scene));
      });
    return function cleanup() {
      cancelAnimationFrame(lerpFrameRequest.current);
    }
  }, [true]); // constant "true" so's we only do this once

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
        var arraybuffer = fr.result;
        var buf = new buffer.Buffer(new Uint8Array(arraybuffer));
        $scope.$apply(() => $scope.$emit('modelbuffer', buf));
    }
    fr.readAsArrayBuffer(file);
  }

  function onSave() {
    var mdlbuf = $scope.model.toBuffer();
    var mdlblob = new Blob([mdlbuf], {type: 'application/octet-stream'});
    window.location = URL.createObjectURL(mdlblob);
  }

  function onClickPlay() {
    play();
  }

  function onClickStop() {
    stop();
  }

  function onToolSelected(tool) {
    setToolState(tool)
  }

  function onChangeFrame(evt) {
    const newFrame = evt.target.value;

    scene.entities.forEach((ent) => ent.frame = newFrame)
  }

  function play() {
    console.log('play')
    if (playing) return;
    setPlaying(true);
    // lerpFrame();
  }

  function stop() {
    console.log('stop')
    setPlaying(false);
  }

  function lerpFrame() {
    console.log('lerpFrame; playing=' + playing);

    const now = Date.now();
    const lerp = !lastTickTime ? 0 : (now - lastTickTime) / 100;

    scene.entities.forEach((ent) => {
      ent.frame = (ent.frame + lerp) % ent.model.frames.length;
      // console.log("set entity frame to " + ent.frame);
    });

    lastTickTime = now;
    lerpFrameRequest.current = requestAnimationFrame(lerpFrame);
  }

  function cancelLerpFrame() {
    console.log('cancelLerpFrame; playing=' + playing);

    scene.entities.forEach((ent) => {
      ent.frame = Math.floor(ent.frame);
    });

    lastTickTime = null;
    cancelAnimationFrame(lerpFrameRequest.current);
    lerpFrameRequest.current = null;
  }

  return (
    <>
      <Controls scene={scene} playing={playing} toolState={toolState}
        onOpen={onOpen} onSave={onSave} onClickPlay={onClickPlay}
        onClickStop={onClickStop} onToolSelected={onToolSelected}
        onChangeFrame={onChangeFrame}
      />
      <QuadView scene={scene} toolState={toolState}
        onToolSelected={onToolSelected}
      />
    </>
  )
}
