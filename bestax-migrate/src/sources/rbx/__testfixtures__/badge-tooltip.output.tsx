import React from "react";
import { Badge, Box, Button, Tooltip } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): bestax's `<Badge>` has no `badgeOutlined` equivalent; restyle by hand
// TODO(bestax-migrate): bestax's `<Badge>` has no `badgeRounded` equivalent; restyle by hand
// TODO(bestax-migrate): bestax's `<Badge>` has no `badgeSize` equivalent; restyle by hand
// TODO(bestax-migrate): bestax's `<Tooltip>` has no `tooltipResponsive` equivalent; restyle by hand
// TODO(bestax-migrate): `badgeColor` set without `badge`; bestax's `<Badge>` needs content — dropped
export const Decorated = () => (
  <Box>
    <Badge content="3" color="danger"><Button>
        Inbox
      </Button></Badge>
    <Tooltip label="Click me" position="bottom" color="info" multiline><Button>
        Hover
      </Button></Tooltip>
    <Tooltip label="Both at once"><Badge content={7}><Button>
          Combined
        </Button></Badge></Tooltip>
    <Badge content="9"><Button>
        Unsupported badge modifiers
      </Button></Badge>
    <Tooltip label="responsive"><Button>
        Unsupported tooltip modifier
      </Button></Tooltip>
    <Button>Modifier with no badge</Button>
  </Box>
);
