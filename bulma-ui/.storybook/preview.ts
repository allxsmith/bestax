import type { Preview } from '@storybook/react-vite';
import 'bulma/css/bulma.min.css';
import 'bulma/css/versions/bulma-prefixed.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@mdi/font/css/materialdesignicons.min.css';
import 'ionicons/dist/css/ionicons.min.css';
import 'material-icons/iconfont/material-icons.css';
import 'material-symbols/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
