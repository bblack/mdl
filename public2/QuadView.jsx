import PerspectiveProjection from './PerspectiveProjection.jsx';
import OrthoWireProjection from './OrthoWireProjection.jsx';

export default function QuadView({ scene, toolState }) {
  return (
    <div id='quadview'>
      <div className='pane n w'>
        <OrthoWireProjection scene={scene} toolState={toolState}
          mv={[1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,40,1]}
        />
      </div>
      <div className='pane n e'>
        <OrthoWireProjection scene={scene} toolState={toolState}
          mv={[0,0,1,0,  1,0,0,0,  0,1,0,0,  0,0,40,1]}
        />
      </div>
      <div className='pane s w'>
        <OrthoWireProjection scene={scene} toolState={toolState}
          mv={[0,1,0,0,  -1,0,0,0,  0,0,1,0,  0,0,40,1]}
        />
      </div>
      <div className='pane s e'>
        <PerspectiveProjection scene={scene} toolState={toolState}
          mv={[1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,40,1]}
        />
      </div>
    </div>
  )
}
