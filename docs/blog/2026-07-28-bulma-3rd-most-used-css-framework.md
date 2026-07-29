---
title: 'Bulma Is the #3 CSS Framework — and AI Will Never Tell You About It'
description: 'Bulma is the #3 CSS framework, behind Tailwind and Bootstrap. Here is why third place is the best place to be, why your AI assistant will never suggest it, and how to scaffold a React + Bulma site in one command with create-bestax.'
sidebar_label: 'Bulma: The #3 CSS Framework'
tags: [bulma, css, react, create-bestax, opensource]
authors: [asmith]
hide_table_of_contents: false
# dev.to specific
publish_to_devto: false
published: false
canonical_url: https://bestax.io/blog/2026/07/28/bulma-3rd-most-used-css-framework
---

Tailwind is first. Bootstrap is second. Bulma is third.

That's the whole leaderboard, and it has been remarkably stable for years. Every survey, every npm download chart, every "what CSS framework should I use in 2026" thread lands in the same order.

So let's talk about third place — because third place is the interesting place to be.

**Congrats on being different.** Now here's what to do.

<!-- truncate -->

## Third Place Is Not Second Loser

There's a certain kind of developer who reads "third most used" and hears "the one that lost." I'd like to gently push back on that.

First place in a popularity contest tells you almost nothing about fit. It tells you about momentum, marketing budget, and the gravitational pull of defaults. Tailwind is genuinely excellent and deserves its adoption. Bootstrap earned its position over a decade of being the safe answer. Neither of those facts makes them the right answer for _your_ project.

Here's what third place actually means for Bulma:

- **Big enough to be safe.** Millions of downloads, a decade of production use, active v1 development. This isn't a weekend project you're betting your app on.
- **Small enough to still have a point of view.** Bulma didn't chase the utility-first trend. It didn't bolt on a JavaScript runtime. It stayed a CSS framework.
- **Boring in the good way.** No build step required. No config file with 400 lines. No plugin ecosystem you have to keep in sync.

Bulma is what you pick when you want your HTML to be readable six months from now.

Here's the leaderboard, rendered in the framework that placed third. Every code block in this post is **live and editable** — change it and watch it re-render:

```tsx live
<Panel color="primary">
  <Panel.Heading>CSS Framework Leaderboard</Panel.Heading>
  <Panel.Block>
    <Panel.Icon name="trophy" variant="solid" />
    Tailwind CSS — utility-first, enormous, deserved
  </Panel.Block>
  <Panel.Block>
    <Panel.Icon name="medal" variant="solid" />
    Bootstrap — the safe answer for over a decade
  </Panel.Block>
  <Panel.Block active>
    <Panel.Icon name="heart" variant="solid" />
    Bulma — third place, on purpose
  </Panel.Block>
</Panel>
```

## What Bulma Actually Gives You

Bulma v1 (2024) was not a maintenance release. It was a rebuild of the foundations:

- **CSS variables throughout** — theming without a Sass pipeline
- **HSL-based color system** — derive an entire palette from a few values
- **CSS Grid support** — modern layouts, not just flexbox columns
- **Native dark mode** — first-class, not an afterthought
- **Skeleton loaders** — built into the components you already use
- **Prefixed distribution** — run Bulma next to another framework without class collisions

And the thing that hasn't changed since 2016: `class="button is-primary is-large"` means exactly what it looks like it means. You can read a Bulma template out loud. Try that with a wall of utility classes.

### Semantic Colors, Everywhere

One color vocabulary — `primary`, `link`, `info`, `success`, `warning`, `danger` — applied consistently across every component. Learn it once:

```tsx live
<Buttons>
  <Button color="primary">Primary</Button>
  <Button color="link">Link</Button>
  <Button color="info">Info</Button>
  <Button color="success">Success</Button>
  <Button color="warning">Warning</Button>
  <Button color="danger">Danger</Button>
</Buttons>
```

The same six words work on tags:

```tsx live
<Tags>
  <Tag color="primary">bulma</Tag>
  <Tag color="link">react</Tag>
  <Tag color="info">typescript</Tag>
  <Tag color="success">vite</Tag>
  <Tag color="warning" isRounded>
    open source
  </Tag>
  <Tag color="danger" isRounded>
    please star
  </Tag>
</Tags>
```

And on messages:

```tsx live
<>
  <Message color="info" title="Third place">
    Big enough to trust, small enough to still have opinions.
  </Message>
  <Message color="success" title="Zero JavaScript">
    Bulma ships CSS. You bring the behavior.
  </Message>
</>
```

### HSL Theming Without a Sass Pipeline

Bulma v1 derives its whole palette from hue, saturation, and lightness. Change three numbers, get a new theme — at runtime, no rebuild. Edit the `primaryH` value below:

```tsx live
function ThemeDemo() {
  const [hue, setHue] = useState(270);
  return (
    <Block>
      <Slider value={hue} onChange={setHue} min={0} max={360} />
      <Paragraph mb="3">
        primaryH: <Strong>{hue}</Strong>
      </Paragraph>
      <Theme primaryH={String(hue)} primaryS="90%" primaryL="50%">
        <Box>
          <Title size="5">One variable, whole palette</Title>
          <Buttons>
            <Button color="primary">Primary</Button>
            <Button color="primary" isLight>
              Light
            </Button>
            <Button color="primary" isOutlined>
              Outlined
            </Button>
          </Buttons>
          <Tag color="primary" size="medium">
            Themed tag
          </Tag>
        </Box>
      </Theme>
    </Block>
  );
}
```

That's the entire theming story. No `tailwind.config.js`, no Sass variables file, no build step.

### Skeleton Loaders, Built In

Loading states used to be a component library's job. Bulma v1 ships them:

```tsx live
<Box>
  <Skeleton />
  <Skeleton />
</Box>
```

### Columns That Just Work

```tsx live
<Columns>
  <Column>
    <Notification color="primary">First</Notification>
  </Column>
  <Column>
    <Notification color="link">Second</Notification>
  </Column>
  <Column>
    <Notification color="info">Third — the good one</Notification>
  </Column>
</Columns>
```

:::note Pure CSS, no JavaScript

Bulma ships zero JavaScript. That's a feature. It means the framework never fights your React state, never needs a wrapper to initialize, and never breaks when your bundler changes. You bring the behavior; Bulma brings the styles.

:::

## Now: Scaffold a Site

Enough theory. Let's build something. One command:

```bash
npm create bestax@latest my-app
```

Answer four short questions and you have a working React + Bulma application. Then:

```bash
cd my-app
npm install
npm run dev
```

That's a running dev server with hot reload, Bulma v1 wired up, and the [@allxsmith/bestax-bulma](https://bestax.io) component library ready to import.

### The Prompts

Four questions, in order. Click through them:

```tsx live
function ScaffoldSteps() {
  const [step, setStep] = useState(0);
  const labels = ['Project name', 'Framework', 'Bulma flavor', 'Icon library'];
  return (
    <Block>
      <Steps
        value={step}
        color="primary"
        onStepClick={setStep}
        items={labels.map(label => ({ label, clickable: true }))}
      />
      <Notification color="info" isLight mt="4">
        Step {step + 1} of 4: <Strong>{labels[step]}</Strong>
      </Notification>
    </Block>
  );
}
```

**1. Project name** — validated to be npm-compatible.

```
? Project name: my-app
```

**2. Framework** — JavaScript or TypeScript, both on Vite.

```
? Select a framework:
  ❯ Vite
    Vite + TypeScript
```

**3. Bulma flavor** — this is the part nobody else automates.

```
? Which Bulma CSS flavor would you like to use?
  ❯ Complete (Recommended) - Full Bulma CSS with all components and helpers
    Prefixed - All classes prefixed with "bulma-" to avoid conflicts
    No Helpers - Core components only, no utility classes
    No Helpers, Prefixed - Core components only with "bulma-" prefix
    No Dark Mode - Light mode only, smaller bundle size
```

Bulma v1 publishes several CSS distributions. Figuring out which one you want — and how to import it correctly — is exactly the kind of yak-shave that kills a Saturday. create-bestax picks the file, wires the import, and moves on.

**4. Icon library** — installed and configured, not just mentioned in a README.

```
? Would you like to add an icon library?
  ❯ None (I'll add icons later)
    Font Awesome
    Material Design Icons
    Ionicons
    Google Material Icons
    Material Symbols
```

### Skip the Prompts

Every answer has a flag:

```bash
# All defaults, zero questions
npm create bestax@latest my-app -y

# TypeScript + Font Awesome
npm create bestax@latest my-app -t vite-ts -i fontawesome

# Prefixed Bulma (running alongside another framework) + Material Design Icons
npm create bestax@latest my-app -b prefixed -i mdi

# Everything specified
npm create bestax@latest my-app -t vite-ts -b complete -i fontawesome
```

| Flag             | Values                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| `-t, --template` | `vite`, `vite-ts`                                                              |
| `-b, --bulma`    | `complete`, `prefixed`, `no-helpers`, `no-helpers-prefixed`, `no-dark-mode`    |
| `-i, --icon`     | `none`, `fontawesome`, `mdi`, `ionicons`, `material-icons`, `material-symbols` |
| `-y, --yes`      | skip all prompts                                                               |

### Your First Component

The scaffold drops you into a project where this already works:

```tsx live
function ThirdPlace() {
  return (
    <Hero color="primary" size="medium">
      <Hero.Body>
        <Columns>
          <Column size="half">
            <Card>
              <Card.Content>
                <Title size="4">Third place never looked so good.</Title>
                <Button color="success">Ship it</Button>
              </Card.Content>
            </Card>
          </Column>
        </Columns>
      </Hero.Body>
    </Hero>
  );
}
```

Typed props, Bulma helper props on every component, and no `style={{}}` in sight. Full reference at [bestax.io/docs/api](https://bestax.io/docs/api).

## A Tour in Live Code

This is the part where most framework posts show you a screenshot. Instead, here's the actual library, running in your browser, editable. Change anything you like — it re-renders as you type.

### Forms

Every form control is controlled or uncontrolled, typed, and accessible out of the box.

**Field, Control, Input** — the Bulma form primitives:

```tsx live
<Field label="Repository">
  <Control>
    <Input type="text" defaultValue="allxsmith/bestax" />
  </Control>
</Field>
```

**Select:**

```tsx live
<Select label="Which Bulma flavor?">
  <option value="complete">Complete (recommended)</option>
  <option value="prefixed">Prefixed</option>
  <option value="no-helpers">No helpers</option>
  <option value="no-dark-mode">No dark mode</option>
</Select>
```

**Switch** — controlled, with a color:

```tsx live
function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <Switch
      checked={on}
      onChange={e => setOn(e.target.checked)}
      color="success"
      isRounded
    >
      Support open source: {on ? 'yes' : 'also yes'}
    </Switch>
  );
}
```

**Slider** with a live output:

```tsx live
function SliderDemo() {
  const [value, setValue] = useState(72);
  return (
    <Block>
      <Slider
        value={value}
        onChange={setValue}
        color="primary"
        isRounded
        showOutput
      />
      <Paragraph mt="2">Enthusiasm: {value}%</Paragraph>
    </Block>
  );
}
```

**Numberinput** — increment/decrement without writing the handlers:

```tsx live
function NumberDemo() {
  const [count, setCount] = useState(3);
  return (
    <Block>
      <Numberinput value={count} onChange={setCount} min={0} />
      <Paragraph mt="2">Dependencies you've never starred: {count}</Paragraph>
    </Block>
  );
}
```

**Taginput** — multi-value entry, no third-party dependency:

```tsx live
function TagDemo() {
  const [tags, setTags] = useState(['bulma', 'react', 'vite']);
  return (
    <Block>
      <Taginput value={tags} onChange={setTags} placeholder="Add a tag..." />
      <Paragraph mt="2" textColor="grey">
        {tags.length} tags
      </Paragraph>
    </Block>
  );
}
```

### Feedback

**Notification**, dismissable:

```tsx live
function NotificationDemo() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Notification color="success" hasDelete onDelete={() => setOpen(false)}>
      Your project scaffolded successfully. Now go build something.
    </Notification>
  ) : (
    <Button color="success" isLight onClick={() => setOpen(true)}>
      Bring it back
    </Button>
  );
}
```

**Toast** — programmatic notifications with auto-dismiss:

```tsx live
function ToastDemo() {
  const [show, setShow] = useState(false);
  return (
    <Block>
      <Button color="primary" onClick={() => setShow(true)}>
        Star the repo (pretend)
      </Button>
      {show && (
        <Toast
          inline
          message="⭐ Thank you. That genuinely helped."
          duration={0}
          onClose={() => setShow(false)}
        />
      )}
    </Block>
  );
}
```

**Dialog** — confirmations without a modal library:

```tsx live
function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Block>
      <Button color="danger" isLight onClick={() => setOpen(true)}>
        Use only the most popular framework, forever
      </Button>
      <Dialog
        isOpen={open}
        title="Are you sure?"
        message="Monocultures are convenient right up until they aren't."
        type="warning"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </Block>
  );
}
```

**Tooltip:**

```tsx live
<Tooltip label="Costs nothing. Takes two seconds.">
  <Button color="warning">Why star a repo?</Button>
</Tooltip>
```

**Progress:**

```tsx live
<Block>
  <Progress value={95} max={100} color="primary" />
  <Progress value={70} max={100} color="info" />
  <Progress value={45} max={100} color="success" />
</Block>
```

### Navigation

**Tabs:**

```tsx live
function TabsDemo() {
  const [tab, setTab] = useState('Complete');
  const options = ['Complete', 'Prefixed', 'No helpers'];
  return (
    <Block>
      <Tabs align="centered">
        <Tabs.List>
          {options.map(o => (
            <Tabs.Item key={o} active={tab === o}>
              <a onClick={() => setTab(o)}>{o}</a>
            </Tabs.Item>
          ))}
        </Tabs.List>
      </Tabs>
      <Notification color="link" isLight>
        Selected flavor: <Strong>{tab}</Strong>
      </Notification>
    </Block>
  );
}
```

**Dropdown:**

```tsx live
<Dropdown label="Pick an icon library">
  <Dropdown.Item>Font Awesome</Dropdown.Item>
  <Dropdown.Item>Material Design Icons</Dropdown.Item>
  <Dropdown.Item>Ionicons</Dropdown.Item>
  <Dropdown.Divider />
  <Dropdown.Item>None, I'll add them later</Dropdown.Item>
</Dropdown>
```

**Menu:**

```tsx live
<Menu>
  <Menu.Label>Docs</Menu.Label>
  <Menu.List>
    <Menu.Item active>Getting started</Menu.Item>
    <Menu.Item>Components</Menu.Item>
    <Menu.Item>Theming</Menu.Item>
    <Menu.Item>For AI agents</Menu.Item>
  </Menu.List>
</Menu>
```

**Breadcrumb:**

```tsx live
<Breadcrumb>
  <li>
    <a href="#">
      <Icon library="fa" name="home" ariaLabel="home icon" /> Home
    </a>
  </li>
  <li>
    <a href="#">CSS frameworks</a>
  </li>
  <li className="is-active">
    <a href="#">Third place</a>
  </li>
</Breadcrumb>
```

### Content & Layout

**Media object** — the classic comment/post layout:

```tsx live
<Media>
  <Media.Left>
    <Avatar name="Open Source" size="64x64" />
  </Media.Left>
  <Media.Content>
    <Content>
      <Paragraph>
        <Strong>Every maintainer</Strong> <small>@unpaid</small>{' '}
        <small>just now</small>
        <br />
        Someone opened a well-written issue with a reproduction today. I have
        never been happier.
      </Paragraph>
    </Content>
    <Level isMobile>
      <Level.Left>
        <Level.Item as="a">
          <Icon library="fa" name="star" variant="solid" size="small" />
        </Level.Item>
        <Level.Item as="a">
          <Icon library="fa" name="code-branch" variant="solid" size="small" />
        </Level.Item>
        <Level.Item as="a">
          <Icon library="fa" name="heart" variant="solid" size="small" />
        </Level.Item>
      </Level.Left>
    </Level>
  </Media.Content>
</Media>
```

**Table:**

```tsx live
<Table isStriped isHoverable isFullwidth>
  <Thead>
    <Tr>
      <Th>Framework</Th>
      <Th>Approach</Th>
      <Th>Ships JS</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Tailwind</Td>
      <Td>Utility-first</Td>
      <Td>No</Td>
    </Tr>
    <Tr>
      <Td>Bootstrap</Td>
      <Td>Component-first</Td>
      <Td>Yes</Td>
    </Tr>
    <Tr>
      <Td>
        <Strong>Bulma</Strong>
      </Td>
      <Td>Component-first, semantic</Td>
      <Td>No</Td>
    </Tr>
  </Tbody>
</Table>
```

**Avatars** — stacked contributor row:

```tsx live
<Avatars>
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
  <Avatar name="Alan Turing" />
</Avatars>
```

**Badge on an avatar:**

```tsx live
<Badge content={12} color="danger" overlap="circle">
  <Avatar name="Open Issues" size="64x64" />
</Badge>
```

**Collapse** — progressive disclosure:

```tsx live
<Collapse
  trigger={
    <Box p="3">
      <Strong>Why does third place matter? (click)</Strong>
    </Box>
  }
>
  <Box p="3">
    <Content>
      Because the alternative to third place is no third place. Once a category
      collapses to one option, the remaining option stops having to earn you.
    </Content>
  </Box>
</Collapse>
```

**Reveal** — scroll-triggered animation, no animation library:

```tsx live
<Reveal animation="fade-up">
  <Box>
    <Title size="4">This faded up on scroll</Title>
    <Content>Zero dependencies. It's in the box.</Content>
  </Box>
</Reveal>
```

**IconText:**

```tsx live
<IconText iconProps={{ library: 'fa', name: 'star', ariaLabel: 'star' }}>
  Free to give, worth a lot to receive
</IconText>
```

**Card, composed:**

```tsx live
<Columns>
  <Column size="half">
    <Card>
      <Card.Header>
        <Card.Header.Title>create-bestax</Card.Header.Title>
      </Card.Header>
      <Card.Content>
        <Content>One command. React, Bulma v1, Vite, icons, done.</Content>
        <Tags>
          <Tag color="info">CLI</Tag>
          <Tag color="success">MIT</Tag>
        </Tags>
      </Card.Content>
      <Card.Footer>
        <Card.FooterItem>Docs</Card.FooterItem>
        <Card.FooterItem>GitHub</Card.FooterItem>
      </Card.Footer>
    </Card>
  </Column>
</Columns>
```

That's a fraction of it. There are 87 documented components at [bestax.io/docs/api](https://bestax.io/docs/api), every one of them with live examples exactly like these.

## Thank You

Seriously — thank you.

If you're reading a post about the _third_ most popular CSS framework, you are already the kind of developer who evaluates tools instead of inheriting them. And if you use Bulma, or bestax-bulma, or create-bestax, you're using software that someone wrote and gave away.

That's true of most of your stack. The framework, the bundler, the test runner, the linter, the type checker, the package manager — free, maintained by people who mostly aren't paid for it, and used by companies that will never send them a dollar.

Open source works because people keep showing up. You showing up — filing the issue, reading the docs, choosing the smaller option — is what keeps the ecosystem from collapsing into three vendors and a pricing page.

So: thank you for supporting open source software. It's not a throwaway line. It's the actual business model.

```tsx live
<Message color="success" title="Thank you">
  <Content>
    For reading the docs before opening the issue. For the reproduction case.
    For the typo fix PR. For choosing a tool on its merits. For being here at
    all — genuinely, thank you.
  </Content>
</Message>
```

### Ways to Support, Ranked by Effort

```tsx live
<Table isStriped isFullwidth>
  <Thead>
    <Tr>
      <Th>What you can do</Th>
      <Th>Cost to you</Th>
      <Th>Value to the project</Th>
    </Tr>
  </Thead>
  <Tbody>
    <Tr>
      <Td>Star the repo</Td>
      <Td>2 seconds, $0</Td>
      <Td>
        <Tag color="success">Very high</Tag>
      </Td>
    </Tr>
    <Tr>
      <Td>Write about it</Td>
      <Td>20 minutes</Td>
      <Td>
        <Tag color="success">Very high</Tag>
      </Td>
    </Tr>
    <Tr>
      <Td>File a good issue</Td>
      <Td>10 minutes</Td>
      <Td>
        <Tag color="info">High</Tag>
      </Td>
    </Tr>
    <Tr>
      <Td>Fix a typo in the docs</Td>
      <Td>5 minutes</Td>
      <Td>
        <Tag color="info">High</Tag>
      </Td>
    </Tr>
    <Tr>
      <Td>Ship a component PR</Td>
      <Td>An afternoon</Td>
      <Td>
        <Tag color="primary">Enormous</Tag>
      </Td>
    </Tr>
  </Tbody>
</Table>
```

## Stars Cost Nothing. They're Worth a Lot.

Here's the most concrete thing you can do in the next ten seconds.

```tsx live
function StarDemo() {
  const [stars, setStars] = useState(0);
  const messages = [
    'Costs nothing.',
    'Still costs nothing.',
    'A real user, starring a real project.',
    'This is how projects get discovered.',
    'Now go do it on GitHub for real.',
    'You are the reason third place still exists. 💛',
  ];
  return (
    <Box>
      <Title size="5">Try it (no signup, no cost)</Title>
      <Rate value={stars} onChange={setStars} size="large" />
      <Notification color="warning" isLight mt="3">
        {messages[stars]}
      </Notification>
      <Buttons>
        <Button
          as="a"
          href="https://github.com/allxsmith/bestax"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
        >
          <Icon library="fa" name="star" ariaLabel="star" />
          <span>Star bestax on GitHub</span>
        </Button>
        <Button
          as="a"
          href="https://github.com/jgthms/bulma"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          isLight
        >
          <Icon library="fa" name="star" ariaLabel="star" />
          <span>Star Bulma on GitHub</span>
        </Button>
      </Buttons>
    </Box>
  );
}
```

Those stars above are a toy — they reset the moment you reload. **The ones that count are two clicks away.** Head over to [github.com/allxsmith/bestax](https://github.com/allxsmith/bestax) and hit the ⭐ in the top right, then do the same for [Bulma itself](https://github.com/jgthms/bulma). The buttons in the demo will take you straight there.

**Star the projects you actually use.** A GitHub star costs you nothing — no money, no email, no signup, no ongoing commitment. But for a legitimate open source project, stars are load-bearing:

- **Discovery.** GitHub search, trending pages, and "most starred" lists are ranked by stars. So are a lot of the "best X library" blog posts that developers actually read.
- **Trust.** Star count is the first thing an engineer checks before adopting a dependency, and the first thing they show their team lead when justifying it.
- **Training data and recommendations.** Popularity signals feed the tools that now answer "which library should I use?" for millions of developers.
- **Momentum.** Stars bring contributors, contributors bring features, features bring users. It compounds.

The important qualifier: **when legitimate projects receive them.** Bought stars, star-for-star rings, and engagement farms poison the signal for everyone — they're why the metric gets dismissed. The fix isn't to abandon stars; it's for real users to star real projects they've genuinely used. That's what makes the number mean something again.

:::tip Ten seconds, no cost, real impact

If Bulma, bestax-bulma, or create-bestax has saved you time:

⭐ **[github.com/allxsmith/bestax](https://github.com/allxsmith/bestax)**
⭐ **[github.com/jgthms/bulma](https://github.com/jgthms/bulma)**

And then go star the other five dependencies in your `package.json` that you've never thanked anyone for.

:::

I maintain this ecosystem — the component library, the CLI, the docs, the examples, the AI skills — largely on stars and Diet Coke. The Diet Coke I can buy myself.

## Diversity Is the Thing AI Is Quietly Eating

Now the part I actually want to talk about.

AI coding assistants are extraordinary. I use them daily; this project ships Agent Skills specifically so they can use bestax-bulma well. This is not an anti-AI post.

But there's a feedback loop forming, and it's worth naming.

An AI assistant recommends what's most represented in its training data. What's most represented is what's most popular. What gets recommended becomes more popular. Which means it's more represented next time. **Popularity now compounds automatically, without a human ever comparing two options.**

Before AI assistants, a developer picking a CSS framework read a few blog posts, skimmed three docs sites, and made a call. Some of them picked the third option because it fit better. That's how alternatives survived: a steady trickle of people actually evaluating.

Now the default path is "ask the assistant," and the assistant — reasonably, statistically — says the most popular thing. Multiply that by millions of scaffolded projects and the long tail stops getting watered. Not because it's worse. Because nobody's asking anymore.

Here's that loop, one step at a time:

```tsx live
function FeedbackLoop() {
  const [step, setStep] = useState(0);
  const stages = [
    {
      label: 'Popular',
      text: 'One option has the most tutorials, posts, and repos.',
      color: 'info',
    },
    {
      label: 'Represented',
      text: 'So it dominates what the assistants learned from.',
      color: 'info',
    },
    {
      label: 'Recommended',
      text: 'So it is what gets suggested, by default, every time.',
      color: 'warning',
    },
    {
      label: 'More popular',
      text: 'So it gets adopted more — and the loop tightens.',
      color: 'danger',
    },
  ];
  const current = stages[step];
  return (
    <Block>
      <Steps
        value={step}
        color={current.color}
        onStepClick={setStep}
        items={stages.map(s => ({ label: s.label, clickable: true }))}
      />
      <Notification color={current.color} isLight mt="4">
        {current.text}
      </Notification>
    </Block>
  );
}
```

The endpoint of that loop is a monoculture: one framework per category, permanently, because the recommendation engine can't recommend what nobody's writing about, and nobody writes about what nobody uses.

That's bad even if you like the winner:

- **Monocultures don't innovate.** Bulma didn't get CSS Grid support and HSL theming because it was winning. It got them because it had to stay worth choosing.
- **Monocultures are fragile.** One license change, one acquisition, one abandoned repo, and an entire category of the web has no plan B.
- **Monocultures set the price.** "Free and open" holds as long as there's somewhere else to go.

### What Actually Helps

None of this is fixed by complaining about AI. It's fixed by feeding the signal:

1. **Write about the tools you use.** A blog post, a Stack Overflow answer, a README, a comment in a thread. Text is the substrate now. If your framework isn't written about, it doesn't exist to the next model.
2. **Star and link.** Both are signals. Both are free. Both take seconds.
3. **Evaluate at least once.** Before you accept a scaffold recommendation, spend five minutes on the second and third options. You'll sometimes change your mind — and even when you don't, you've made a real choice instead of an inherited one.
4. **Teach your assistant.** Point it at real docs. This is why bestax publishes an [LLM index](https://bestax.io/docs/guides/llms) and ships Agent Skills: an assistant that has read the docs will happily use Bulma. The gap is availability, not capability.
5. **Contribute upstream.** Issues, docs fixes, examples. Every one of them is a durable artifact that outlives the conversation.

The two futures, side by side — `display="flex"` on each column and `flexGrow="1"` on the box keep the cards the same height no matter how much text they hold:

```tsx live
<Columns>
  <Column display="flex">
    <Box flexGrow="1">
      <Title size="5" textColor="danger">
        Monoculture
      </Title>
      <Content>
        <Tags>
          <Tag color="danger">One option</Tag>
        </Tags>
        No pressure to improve. No fallback if it changes. No leverage when the
        license does.
      </Content>
    </Box>
  </Column>
  <Column display="flex">
    <Box flexGrow="1">
      <Title size="5" textColor="success">
        Ecosystem
      </Title>
      <Content>
        <Tags>
          <Tag color="success">Tailwind</Tag>
          <Tag color="success">Bootstrap</Tag>
          <Tag color="success">Bulma</Tag>
          <Tag color="success">…and the long tail</Tag>
        </Tags>
        Every option has to stay worth choosing.
      </Content>
    </Box>
  </Column>
</Columns>
```

Third place stays on the board because people keep choosing it on purpose. That's the whole mechanism. It doesn't survive on merit alone.

## Get Started

```bash
npm create bestax@latest my-app
cd my-app
npm install
npm run dev
```

- **Docs**: [bestax.io](https://bestax.io)
- **Components**: [bestax.io/docs/api](https://bestax.io/docs/api)
- **Getting started**: [bestax.io/docs/guides/getting-started](https://bestax.io/docs/guides/getting-started)
- **For AI agents**: [bestax.io/docs/guides/llms](https://bestax.io/docs/guides/llms)
- **npm**: [create-bestax](https://www.npmjs.com/package/create-bestax) · [@allxsmith/bestax-bulma](https://www.npmjs.com/package/@allxsmith/bestax-bulma)
- **Star it**: [github.com/allxsmith/bestax](https://github.com/allxsmith/bestax)

---

**Questions?** [Open an issue](https://github.com/allxsmith/bestax/issues) or [start a discussion](https://github.com/allxsmith/bestax/discussions).

**Want to contribute?** PRs welcome — see the [contributing guide](https://github.com/allxsmith/bestax/blob/main/CONTRIBUTING.md).

Congrats on being different. Now go build something.
