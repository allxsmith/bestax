import 'bulma/css/bulma.min.css';
import { Elements } from './elements';
import { Grid } from './columns';
import { Widgets } from './components';
import { SignupForm } from './form';
import { Layout } from './layout';
import { Helpers } from './helpers';

export default function App() {
  return (
    <div>
      <Layout />
      <Elements />
      <Grid />
      <Widgets />
      <SignupForm />
      <Helpers />
    </div>
  );
}
