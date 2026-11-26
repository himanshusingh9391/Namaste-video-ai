import React from 'react';
import {AbsoluteFill, Audio, Composition, interpolate, registerRoot, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import fixture from './water-cycle.json';
import {Landscape} from './landscape';

const fps = 30;
const ink = '#091e2c';
const teal = '#8bebda';
const paper = '#f3faf8';


type Scene = (typeof fixture.scenes)[number] & {audioSrc?: string; dropletCloseup?: boolean};
type Storyboard = Omit<typeof fixture, 'scenes'> & {scenes: Scene[]};

function VideoScene({scene, title}: {scene: Scene; title: string}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const second = frame / fps;
  const caption = scene.captions.findLast(({at}) => at <= second);
  const reveal = interpolate(second, [scene.reveal, scene.reveal + 0.65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: 'linear-gradient(165deg, #102b40 0%, #0a1725 85%)', color: paper, fontFamily: 'Arial, sans-serif', padding: '114px 74px 145px', gap: 31}}>
      {scene.audioSrc && <Audio src={staticFile(scene.audioSrc)}/>}
      <div style={{fontSize: 36, color: teal, fontWeight: 700}}>{title}</div>
      <h1 style={{margin: 0, fontSize: 102, lineHeight: 1.02, letterSpacing: -5, minHeight: 213}}>{scene.title}</h1>
      <div style={{borderRadius: 56, border: '2px solid #477381', overflow: 'hidden', boxShadow: '0 34px 84px #030b174d'}}>
        <Landscape active={scene.active} time={second} reveal={reveal} dropletCloseup={scene.dropletCloseup}/>
      </div>
      <div style={{marginTop: 'auto', minHeight: 200, display: 'grid', placeItems: 'center', borderRadius: 28, background: ink, color: '#ffffff', border: '2px solid #355563', padding: '26px 44px', textAlign: 'center', fontSize: 48, lineHeight: 1.24}}>
        {caption?.text}
      </div>
    </AbsoluteFill>
  );
}

const duration = (storyboard: Storyboard) => storyboard.scenes.reduce((sum, scene) => sum + Math.round(scene.duration * fps), 0);

function Video({storyboard}: {storyboard: Storyboard}) {
  return (
    <Series>
      {storyboard.scenes.map((scene, index) => (
        <Series.Sequence key={index} durationInFrames={Math.round(scene.duration * fps)}>
          <VideoScene scene={scene} title={storyboard.title}/>
        </Series.Sequence>
      ))}
    </Series>
  );
}

function Root() {
  return <Composition id="NamasteWaterCycle" component={Video} fps={fps} width={1080} height={1920} durationInFrames={duration(fixture)} defaultProps={{storyboard: fixture as Storyboard}} calculateMetadata={({props}) => ({durationInFrames: duration(props.storyboard)})}/>;
}

registerRoot(Root);
