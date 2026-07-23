import { useState } from 'react';
import { Box, Pre, Tabs } from '@allxsmith/bestax-bulma';

export interface CodeTab {
  label: string;
  icon?: string;
  code: string;
}

interface CodeSampleProps {
  tabs: CodeTab[];
}

/** A tabbed code block — one language per tab. */
export function CodeSample({ tabs }: CodeSampleProps) {
  const [active, setActive] = useState(0);

  return (
    <Box p="0" overflow="clipped">
      <Tabs boxed value={active} onChange={setActive} mb="0">
        <Tabs.List>
          {tabs.map((tab, index) => (
            <Tabs.Tab key={tab.label} index={index} icon={tab.icon}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Pre p="5" m="0" textSize="7">
        {tabs[active].code}
      </Pre>
    </Box>
  );
}
