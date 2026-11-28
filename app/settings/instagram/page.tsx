import { privatePage } from '../../lib/private-page';
function Page() {
  return <><header className="section-head"><p>Connections</p><h1>Instagram connection</h1></header><section className="panel"><h2>No connected account</h2><p>Personal Instagram authorization will be available after creator sign-in is connected.</p></section></>;
}

export default privatePage('/settings/instagram', Page);
