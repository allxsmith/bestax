import React from "react";
import { Button, Box } from "rbx";

export const Decorated = () => (
  <Box>
    <Button badge="3" badgeColor="danger">
      Inbox
    </Button>
    <Button tooltip="Click me" tooltipPosition="bottom" tooltipColor="info" tooltipMultiline>
      Hover
    </Button>
    <Button badge={7} tooltip="Both at once">
      Combined
    </Button>
    <Button badge="9" badgeOutlined badgeRounded badgeSize="large">
      Unsupported badge modifiers
    </Button>
    <Button tooltip="responsive" tooltipResponsive={{ tablet: "left" }}>
      Unsupported tooltip modifier
    </Button>
    <Button badgeColor="info">Modifier with no badge</Button>
  </Box>
);
