import PerspectiveProjection from './PerspectiveProjection.jsx';
import OrthoWireProjection from './OrthoWireProjection.jsx';
import tools from './tools.js';

export default function QuadView({ scene, activeSkin, tool, onToolSelected }) {

  function onOrthoMouseDown(evt) {
    tool.onMouseDown?.(evt);
  }

  function onOrthoMouseMove(evt) {
    tool.onMouseMove?.(evt);
  }

  function onOrthoMouseUp(evt) {
    tool.onMouseUp?.(evt);
  }

  return (
    <div id='quadview'>
      <div className='pane n w'>
        <OrthoWireProjection scene={scene} tool={tool}
          onMouseDown={onOrthoMouseDown}
          onMouseMove={onOrthoMouseMove}
          onMouseUp={onOrthoMouseUp}
          onToolSelected={onToolSelected}
          mv={[1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,40,1]}
        />
      </div>
      <div className='pane n e'>
        <OrthoWireProjection scene={scene} tool={tool}
          onMouseDown={onOrthoMouseDown}
          onMouseMove={onOrthoMouseMove}
          onMouseUp={onOrthoMouseUp}
          onToolSelected={onToolSelected}
          mv={[0,0,1,0,  1,0,0,0,  0,1,0,0,  0,0,40,1]}
        />
      </div>
      <div className='pane s w'>
        <OrthoWireProjection scene={scene} tool={tool}
          onMouseDown={onOrthoMouseDown}
          onMouseMove={onOrthoMouseMove}
          onMouseUp={onOrthoMouseUp}
          onToolSelected={onToolSelected}
          mv={[0,1,0,0,  -1,0,0,0,  0,0,1,0,  0,0,40,1]}
        />
      </div>
      <div className='pane s e'>
        <PerspectiveProjection scene={scene} activeSkin={activeSkin} tool={tool}
          mv={[1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,40,1]}
        />
      </div>
    </div>
  )
}
