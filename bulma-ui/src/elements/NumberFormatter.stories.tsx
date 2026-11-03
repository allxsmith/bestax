import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { NumberFormatter } from './NumberFormatter';
import { DescriptionList } from './DescriptionList';
import { Paragraph } from './Paragraph';
import { Title } from './Title';
import { Input } from '../form/Input';
import { LocaleProvider } from '../helpers/LocaleProvider';
import { useNumberFormat } from '../helpers/localeFormat';
import { validColors } from '../helpers/useBulmaClasses';

const meta: Meta<typeof NumberFormatter> = {
  title: 'Elements/NumberFormatter',
  component: NumberFormatter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A number written the way a locale writes it, through Intl.NumberFormat, in a <data> element that keeps the number itself in its value. Its own locale wins, then a LocaleProvider’s, then the runtime’s. useNumberFormat gives the same formatting as a function, for text outside JSX.',
      },
    },
  },
  args: {
    value: 8456.4,
    format: { style: 'currency', currency: 'USD' },
  },
  argTypes: {
    value: {
      control: 'number',
      description: 'The number, written into the <data> element’s value',
    },
    format: {
      control: 'object',
      description:
        'Intl.NumberFormat options: a currency, a percentage, a unit, compact notation, the fraction digits, the sign',
    },
    locale: {
      control: 'text',
      description:
        'BCP 47 locale tag; unset, the LocaleProvider’s, else the runtime’s',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NumberFormatter>;

export const Default: Story = {
  args: { locale: 'en-US' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const number = canvas.getByText('$8,456.40');
    await expect(number.tagName).toBe('DATA');
    await expect(number).toHaveAttribute('value', '8456.4');
  },
};

export const Formats: Story = {
  render: function FormatsExample() {
    return (
      <DescriptionList>
        <DescriptionList.Item
          label="Currency"
          value={
            <NumberFormatter
              value={8456.4}
              locale="en-US"
              format={{ style: 'currency', currency: 'USD' }}
            />
          }
        />
        <DescriptionList.Item
          label="Percentage"
          value={
            <NumberFormatter
              value={0.125}
              locale="en-US"
              format={{ style: 'percent', maximumFractionDigits: 1 }}
            />
          }
        />
        <DescriptionList.Item
          label="Compact"
          value={
            <NumberFormatter
              value={123456}
              locale="en-US"
              format={{ notation: 'compact' }}
            />
          }
        />
        <DescriptionList.Item
          label="Unit"
          value={
            <NumberFormatter
              value={12}
              locale="en-US"
              format={{ style: 'unit', unit: 'kilometer-per-hour' }}
            />
          }
        />
        <DescriptionList.Item
          label="Signed change"
          value={
            <NumberFormatter
              value={-0.019}
              locale="en-US"
              format={{ style: 'percent', signDisplay: 'exceptZero' }}
            />
          }
        />
      </DescriptionList>
    );
  },
};

export const Locales: Story = {
  render: function LocalesExample() {
    const locales = ['en-US', 'de-DE', 'fr-FR', 'en-IN', 'ar-EG', 'ja-JP'];
    return (
      <DescriptionList>
        {locales.map(locale => (
          <DescriptionList.Item
            key={locale}
            label={locale}
            value={
              <NumberFormatter
                value={1234567.891}
                locale={locale}
                format={{ maximumFractionDigits: 2 }}
              />
            }
          />
        ))}
      </DescriptionList>
    );
  },
};

export const InALocaleProvider: Story = {
  render: function InALocaleProviderExample() {
    return (
      <LocaleProvider locale="fr-FR">
        <Paragraph>
          Vitesse moyenne :{' '}
          <NumberFormatter
            value={1234.5}
            format={{ style: 'unit', unit: 'kilometer-per-hour' }}
          />
        </Paragraph>
      </LocaleProvider>
    );
  },
};

export const HelperProps: Story = {
  render: function HelperPropsExample() {
    return (
      <Title as="p" size="3">
        <NumberFormatter
          value={0.986}
          locale="en-US"
          format={{ style: 'percent', maximumFractionDigits: 1 }}
          textColor="success"
          colorShade="on-scheme"
          textWeight="semibold"
        />
      </Title>
    );
  },
};

function BudgetField() {
  const format = useNumberFormat('de-DE');
  return (
    <Input
      label="Monatliches Budget"
      placeholder={format(1500, { style: 'currency', currency: 'EUR' })}
    />
  );
}

export const TheHook: Story = {
  render: function TheHookExample() {
    return <BudgetField />;
  },
};
