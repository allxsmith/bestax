import type { Meta, StoryObj } from '@storybook/react-vite';
import { LocaleProvider, useLocale } from './LocaleProvider';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Title } from '../elements/Title';
import { Paragraph } from '../elements/Paragraph';
import { Stat } from '../elements/Stat';
import { Steps } from '../components/Steps';
import { Popover } from '../components/Popover';
import { DateInput } from '../form/DateInput';
import { Columns } from '../columns/Columns';
import { Column } from '../columns/Column';

const meta: Meta<typeof LocaleProvider> = {
  title: 'Helpers/LocaleProvider',
  component: LocaleProvider,
  parameters: {
    docs: {
      description: {
        component:
          'Sets the language and writing direction for the part of the app inside it, on a wrapper `<div>` and on what the library portals out of it. The date pickers inside take its locale and start the week on its first day.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    locale: {
      control: 'text',
      description:
        'A BCP 47 language tag such as `de` or `ar-EG`: the wrapper’s `lang`, the pickers’ default `locale`, and, with no `dir`, the direction of its script.',
    },
    dir: {
      control: 'select',
      options: [undefined, 'ltr', 'rtl'],
      description:
        'The direction, whatever the locale. Unset, it follows the locale, else an outer provider, else the page.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocaleProvider>;

/** Shows what the nearest provider sets, as `useLocale` returns it. */
const Settings = () => {
  const { locale, dir } = useLocale();
  return (
    <Paragraph textSize="7" textColor="grey">
      useLocale(): locale {locale ?? 'unset'}, dir {dir ?? 'unset'}
    </Paragraph>
  );
};

/**
 * An Arabic section. The wrapper carries `dir="rtl"` and `lang="ar-EG"`, so
 * Steps lays out from the right, the calendar names its days in Arabic and
 * starts the week on Saturday, and the Popover's panel, portaled to the end
 * of `document.body`, reads right to left too. Change `locale` or `dir` to
 * see each follow.
 */
export const Default: Story = {
  args: { locale: 'ar-EG' },
  render: args => (
    <LocaleProvider {...args}>
      <Box>
        <Settings />
        <Steps
          value={1}
          items={[{ label: 'السلة' }, { label: 'الشحن' }, { label: 'الدفع' }]}
          completedLabel="مكتملة"
          upcomingLabel="قادمة"
          mb="5"
        />
        <Popover
          trigger={<Button>تفاصيل</Button>}
          appendToBody
          ariaLabel="تفاصيل"
        >
          <Popover.Body>
            يُعرض هذا في نهاية الصفحة، ويبقى من اليمين.
          </Popover.Body>
        </Popover>
        <DateInput inline label="تاريخ التسليم" mt="5" />
      </Box>
    </LocaleProvider>
  ),
};

/**
 * A Chinese section. The wrapper carries `lang="zh-CN"`, so where Chinese and
 * Japanese draw a character differently, the browser draws the Chinese form.
 * The Stat writes the yuan as ¥, where English writes CN¥, and the calendar
 * names its months and days in Chinese and starts the week on Monday. Change
 * `locale` to see each follow.
 */
export const Chinese: Story = {
  args: { locale: 'zh-CN' },
  render: args => (
    <LocaleProvider {...args}>
      <Box>
        <Settings />
        <Steps
          value={1}
          items={[{ label: '购物车' }, { label: '配送' }, { label: '付款' }]}
          completedLabel="已完成"
          upcomingLabel="未开始"
          mb="5"
        />
        <Stat
          label="订单金额"
          value={8456.4}
          format={{ style: 'currency', currency: 'CNY' }}
        />
        <DateInput inline label="送达日期" mt="5" />
      </Box>
    </LocaleProvider>
  ),
};

/**
 * A Japanese section. The wrapper carries `lang="ja-JP"`, so where Chinese
 * and Japanese draw a character differently, the browser draws the Japanese
 * form. The Stat writes the yen with the full-width ￥, and the calendar names
 * its months and days in Japanese and starts the week on Sunday. Change
 * `locale` to see each follow.
 */
export const Japanese: Story = {
  args: { locale: 'ja-JP' },
  render: args => (
    <LocaleProvider {...args}>
      <Box>
        <Settings />
        <Steps
          value={1}
          items={[
            { label: 'カート' },
            { label: 'お届け先' },
            { label: 'お支払い' },
          ]}
          completedLabel="完了"
          upcomingLabel="未着手"
          mb="5"
        />
        <Stat
          label="ご注文金額"
          value={8456}
          format={{ style: 'currency', currency: 'JPY' }}
        />
        <DateInput inline label="お届け日" mt="5" />
      </Box>
    </LocaleProvider>
  ),
};

/**
 * `dir` alone: an English section laid out right to left, with no `lang`
 * and the pickers left on the runtime's own locale.
 */
export const DirectionOnly: Story = {
  args: { dir: 'rtl' },
  render: args => (
    <LocaleProvider {...args}>
      <Box>
        <Settings />
        <Steps
          value={0}
          items={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Pay' }]}
        />
      </Box>
    </LocaleProvider>
  ),
};

/**
 * A nested provider keeps what it leaves unset. The inner one sets only a
 * locale, so it takes that locale's direction: a French quote, left to
 * right, inside a Hebrew section.
 */
export const Nested: Story = {
  render: () => (
    <LocaleProvider locale="he">
      <Box>
        <Title size="5">ציטוט</Title>
        <Settings />
        <LocaleProvider locale="fr">
          <Box bgColor="scheme-main-bis" mb="0">
            <Settings />
            <Paragraph>
              « La simplicité est la sophistication suprême. »
            </Paragraph>
          </Box>
        </LocaleProvider>
      </Box>
    </LocaleProvider>
  ),
};

/**
 * The pickers under a German provider name the days in German and start
 * the week on Monday. One with its own `firstDayOfWeek` keeps it. Outside
 * a provider, a picker starts on Sunday whatever its `locale`, as it always
 * has.
 */
export const Pickers: Story = {
  render: () => (
    <Columns>
      <Column>
        <LocaleProvider locale="de">
          <DateInput inline label="Unter LocaleProvider de" />
        </LocaleProvider>
      </Column>
      <Column>
        <LocaleProvider locale="de">
          <DateInput inline label="firstDayOfWeek={3}" firstDayOfWeek={3} />
        </LocaleProvider>
      </Column>
      <Column>
        <DateInput inline label='locale="de", no provider' locale="de" />
      </Column>
    </Columns>
  ),
};
