import { privatePage } from '../../lib/private-page';
import { DraftField } from '../../draft-field';

function CreateProject() {
  return <><header className="section-head"><p>My workspace</p><h1>Create video</h1></header><DraftField storageKey="nv:local:brief" label="Topic or teaching notes" example="Explain how clouds form over the Western Ghats."/><p className="hint">This local draft is the starting point for storyboard generation in a later feature.</p></>;
}

export default privatePage('/projects/new', CreateProject);
