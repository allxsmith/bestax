import { Heading } from 'react-bulma-components';

export function Titles() {
  return (
    <div>
      <Heading subtitle={true}>a</Heading>
      <Heading subtitle={false}>b</Heading>
      <Heading heading={false}>c</Heading>
      <Heading size={3}>d</Heading>
    </div>
  );
}
