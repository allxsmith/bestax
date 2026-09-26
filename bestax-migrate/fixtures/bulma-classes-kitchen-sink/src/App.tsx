import 'bulma/css/bulma.min.css';
import './styles.scss';
import { Elements } from './elements';
import { Helpers } from './helpers';
import { Layout } from './layout';
import { Leftovers } from './leftovers';

export function App() {
  return (
    <section className="section">
      <h1 className="title is-2">Kitchen sink</h1>
      <Layout />
      <Elements />
      <Helpers />
      <Leftovers />
    </section>
  );
}
