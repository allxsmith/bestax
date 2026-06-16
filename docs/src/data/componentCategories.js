// Component catalog for the homepage "Bulma Supported Components" cards.
// Source: docs/docs/guides/intro.md
const categories = [
  {
    heading: 'Elements',
    icon: 'elements',
    blurb:
      'Basic Bulma elements made available as React components for fast, consistent UIs.',
    items: [
      { name: 'Block', link: '/docs/api/elements/block' },
      { name: 'Box', link: '/docs/api/elements/box' },
      { name: 'Button', link: '/docs/api/elements/button' },
      { name: 'Buttons', link: '/docs/api/elements/buttons' },
      { name: 'Content', link: '/docs/api/elements/content' },
      { name: 'Delete', link: '/docs/api/elements/delete' },
      { name: 'Icon', link: '/docs/api/elements/icon' },
      { name: 'IconText', link: '/docs/api/elements/icontext' },
      { name: 'Image', link: '/docs/api/elements/image' },
      { name: 'Notification', link: '/docs/api/elements/notification' },
      { name: 'Progress', link: '/docs/api/elements/progress' },
      { name: 'Skeleton', link: '/docs/api/elements/skeleton' },
      { name: 'Table', link: '/docs/api/elements/table' },
      { name: 'Tag', link: '/docs/api/elements/tag' },
      { name: 'Tags', link: '/docs/api/elements/tags' },
      { name: 'Title', link: '/docs/api/elements/title' },
      { name: 'SubTitle', link: '/docs/api/elements/subtitle' },
    ],
  },
  {
    heading: 'Components',
    icon: 'components',
    blurb:
      'Reusable UI widgets and navigation components for building interactive applications.',
    items: [
      { name: 'Breadcrumb', link: '/docs/api/components/breadcrumb' },
      { name: 'Card', link: '/docs/api/components/card' },
      { name: 'Dropdown', link: '/docs/api/components/dropdown' },
      { name: 'Menu', link: '/docs/api/components/menu' },
      { name: 'Message', link: '/docs/api/components/message' },
      { name: 'Modal', link: '/docs/api/components/modal' },
      { name: 'Navbar', link: '/docs/api/components/navbar' },
      { name: 'Pagination', link: '/docs/api/components/pagination' },
      { name: 'Panel', link: '/docs/api/components/panel' },
      { name: 'Tabs/Tab', link: '/docs/api/components/tabs' },
    ],
  },
  {
    heading: 'Form',
    icon: 'form',
    blurb:
      'Accessible, fully styled form controls and layout, supporting all Bulma modifiers.',
    items: [
      { name: 'Field', link: '/docs/api/form/field' },
      { name: 'Control', link: '/docs/api/form/control' },
      { name: 'Input', link: '/docs/api/form/input' },
      { name: 'TextArea', link: '/docs/api/form/textarea' },
      { name: 'Select', link: '/docs/api/form/select' },
      { name: 'File', link: '/docs/api/form/file' },
      { name: 'Radio & Radios', link: '/docs/api/form/radio' },
      { name: 'Checkbox & Checkboxes', link: '/docs/api/form/checkbox' },
    ],
  },
  {
    heading: 'Layout',
    icon: 'layout',
    blurb: 'High-level layout primitives for structuring your app and pages.',
    items: [
      { name: 'Container', link: '/docs/api/layout/container' },
      { name: 'Section', link: '/docs/api/layout/section' },
      { name: 'Hero', link: '/docs/api/layout/hero' },
      { name: 'Level', link: '/docs/api/layout/level' },
      { name: 'Media', link: '/docs/api/layout/media' },
      { name: 'Footer', link: '/docs/api/layout/footer' },
    ],
  },
  {
    heading: 'Columns',
    icon: 'columns',
    blurb:
      'Responsive and flexible row-column layouts using Bulma’s columns system.',
    items: [
      { name: 'Columns', link: '/docs/api/columns' },
      { name: 'Column', link: '/docs/api/columns/column' },
    ],
  },
  {
    heading: 'Grid',
    icon: 'grid',
    blurb:
      'CSS Grid support, using Bulma’s new grid utilities for advanced layouts.',
    items: [
      { name: 'Grid', link: '/docs/api/grid' },
      { name: 'Cell', link: '/docs/api/grid/cell' },
    ],
  },
  {
    heading: 'Helpers',
    icon: 'helpers',
    blurb:
      'Little helpers for translating properties to Bulma classes, recommended for custom Bulma-powered components.',
    items: [
      { name: 'classNames', link: '/docs/api/helpers/classnames' },
      { name: 'ConfigProvider', link: '/docs/api/helpers/config' },
      { name: 'Theme', link: '/docs/api/helpers/theme' },
      { name: 'useBulmaClasses', link: '/docs/api/helpers/usebulmaclasses' },
    ],
  },
];

// Semantic HTML elements Bulma never styled, wrapped as React components with
// the same Bulma helper props. Rendered as monospace <tag> chips on the
// homepage (see components/GapElements) — `tag` is the HTML element each one
// renders, verified against bulma-ui/src/elements/*.tsx.
export const gapElements = [
  { name: 'Paragraph', tag: '<p>', link: '/docs/api/elements/paragraph' },
  { name: 'Span', tag: '<span>', link: '/docs/api/elements/span' },
  { name: 'Strong', tag: '<strong>', link: '/docs/api/elements/strong' },
  { name: 'Emphasis', tag: '<em>', link: '/docs/api/elements/emphasis' },
  { name: 'Code', tag: '<code>', link: '/docs/api/elements/code' },
  { name: 'Pre', tag: '<pre>', link: '/docs/api/elements/pre' },
  {
    name: 'UnorderedList',
    tag: '<ul>',
    link: '/docs/api/elements/unorderedlist',
  },
  { name: 'OrderedList', tag: '<ol>', link: '/docs/api/elements/orderedlist' },
  { name: 'ListItem', tag: '<li>', link: '/docs/api/elements/listitem' },
  { name: 'Link', tag: '<a>', link: '/docs/api/elements/link' },
  { name: 'Divider', tag: '<hr>', link: '/docs/api/elements/divider' },
  { name: 'Figure', tag: '<figure>', link: '/docs/api/elements/figure' },
];

export default categories;
