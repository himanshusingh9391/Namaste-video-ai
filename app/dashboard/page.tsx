import { privatePage } from '../lib/private-page';
import Link from 'next/link';

function Dashboard() {
  return <><header className="section-head"><p>My workspace</p><h1>Overview</h1></header>
    <section className="feature"><div><p className="eyebrow">Featured explainer</p><h2>Where does the<br/>rain come from?</h2><p>Follow a drop of water from the ground to the clouds and back in our narrated motion-graphics example.</p><a className="action" href="#sample">Watch the example ↓</a></div>
    <div className="cover"><img src="/samples/water-cycle.png" alt="Illustrated landscape from the water-cycle film"/></div></section>
    <section className="block"><h2>Your workspace</h2><div className="tiles">
    <Link href="/projects/new"><strong>Create video</strong><span>Start with a topic or teaching notes.</span></Link>
    <Link href="/ideas"><strong>Idea notebook</strong><span>Keep a thought for your next explainer.</span></Link></div></section>
    <section className="block" id="sample"><h2>The water cycle</h2><p>English narration · Portrait video</p><video controls playsInline preload="none" poster="/samples/water-cycle.png" src="/samples/water-cycle.mp4"/></section></>;
}

export default privatePage('/dashboard', Dashboard);
