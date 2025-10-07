// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Bestax-Bulma',
  tagline: 'A Bulma React Component Libary',
  favicon: 'img/logo.svg',

  // Set the production url of your site here
  url: 'https://bestax.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'allxsmith', // Usually your GitHub org/user name.
  projectName: 'bestax', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/allxsmith/bestax/edit/main/docs',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/allxsmith/bestax',
          // Useful options to enforce blogging best practices
          onInlineTags: 'ignore',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  // stylesheets: [
  //   {
  //     href: '/css/ionicons.min.css',
  //     type: 'text/css',
  //   },
  // ],
  plugins: [],
  themes: [
    '@docusaurus/theme-live-codeblock',
    // '@docusaurus/theme-mermaid',
    // '@docusaurus/theme-search-algolia',
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      announcementBar: {
        id: 'support_v1',
        content: 'Full support for Bulma v1 !!!',
        backgroundColor: '#fafbfc',
        textColor: '#091E42',
        isCloseable: true,
      },
      // Replace with your project's social card
      image: 'img/bestax-social-card.jpg',
      metadata: [
        {
          name: 'keywords',
          content:
            'bulma, bulma-react, bulma components, bulma ui, react, react components, react bulma, react-bulma-components, react ui, typescript, component library, ui library, ui kit, design system, frontend, web components, css framework, bootstrap alternative, material alternative, storybook',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        // { name: 'algolia-site-verification', content: '23EA554671D943E3' },
      ],
      algolia: {
        appId: 'O2KH2Y2NMJ',
        apiKey: '18510063a0a75567625bf05512573ad6',
        indexName: 'docs_bestax.io',
        contextualSearch: true, // Recommended for multi-language or multi-version sites
        searchPagePath: 'search', // Enables a dedicated search page at /search
      },

      navbar: {
        title: 'Bestax',
        logo: {
          alt: 'Bestax Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'guideSidebar',
            position: 'left',
            label: 'Getting Started',
          },
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'componentSidebar',
          //   position: 'left',
          //   label: 'Components',
          // },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'left',
            label: 'Components',
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/allxsmith/bestax',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/bestax',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/zehJrQGtKu',
              },
              {
                label: 'X',
                href: 'https://x.com/asmith62378',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/allxsmith/bestax',
              },
              {
                label: 'NPM',
                href: 'https://www.npmjs.com/package/@allxsmith/bestax-bulma',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Bestax.  <br/>Source code licensed <a href="https://opensource.org/licenses/mit-license.php">MIT</a>. Website content licensed <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>)`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
