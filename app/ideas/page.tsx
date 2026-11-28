import { privatePage } from '../lib/private-page';
import { DraftField } from '../draft-field';

function Ideas() {
  return <><header className="section-head"><p>My workspace</p><h1>Idea notebook</h1></header><DraftField storageKey="nv:local:ideas" label="Your ideas" example="Why does the air smell different after rain?"/></>;
}

export default privatePage('/ideas', Ideas);
