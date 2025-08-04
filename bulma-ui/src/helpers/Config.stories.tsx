import { ConfigProvider } from './Config';
import Box from '../elements/Box';
import Title from '../elements/Title';
import Button from '../elements/Button';
import { Notification } from '../elements/Notification';

export default {
  title: 'Helpers/ConfigProvider',
  component: ConfigProvider,
};

// Prefixed Bulma example
export const PrefixedBulma = () => (
  <div>
    <Title size="3">Prefixed Bulma Components</Title>
    <p>
      This demonstrates using ConfigProvider with{' '}
      <code>classPrefix=&quot;bulma-&quot;</code> to add the &quot;bulma-&quot;
      prefix to all component CSS classes. This is useful when integrating Bulma
      with other CSS frameworks or when you need to namespace Bulma classes to
      avoid conflicts.
    </p>

    <Notification color="info" mt="4">
      <strong>Tip:</strong> Open your browser&apos;s developer tools and inspect
      the DOM elements below. You&apos;ll see that all Bulma CSS classes have
      the &quot;bulma-&quot; prefix applied (e.g., &quot;bulma-box&quot;,
      &quot;bulma-title&quot;, &quot;bulma-button&quot;,
      &quot;bulma-notification&quot;).
    </Notification>

    <ConfigProvider classPrefix="bulma-">
      <Box mt="4" p="4">
        <Title size="4">Prefixed Components</Title>
        <p>
          All components inside this ConfigProvider will have their CSS classes
          prefixed with &quot;bulma-&quot;. This allows you to use Bulma
          alongside other CSS frameworks without class name conflicts.
        </p>
        <Button color="primary" mt="3">
          Bulma-Prefixed Button
        </Button>
      </Box>
    </ConfigProvider>

    <Box mt="4" p="4">
      <Title size="4">Standard Components (No Prefix)</Title>
      <p>
        Components outside the ConfigProvider use standard Bulma classes without
        any prefix.
      </p>
      <Button color="info">Standard Button</Button>
    </Box>
  </div>
);
