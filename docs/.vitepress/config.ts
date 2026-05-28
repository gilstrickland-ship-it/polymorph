import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Polymorph",
  description: "One SDK build, N design systems — an open, design-system-adaptive SDK framework.",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["meta", { name: "theme-color", content: "#1f5cff" }],
  ],
  themeConfig: {
    siteTitle: "Polymorph",
    nav: [
      { text: "Guide", link: "/guide/introduction", activeMatch: "/guide/" },
      { text: "Platforms", link: "/platforms/web", activeMatch: "/platforms/" },
      { text: "Adoption", link: "/guides/vendor", activeMatch: "/guides/" },
      { text: "Reference", link: "/reference/cli", activeMatch: "/reference/" },
      {
        text: "v0",
        items: [
          { text: "Changelog (specs)", link: "https://github.com/gilstrickland-ship-it/polymorph/tree/main/specs" },
          { text: "Constitution", link: "https://github.com/gilstrickland-ship-it/polymorph/blob/main/.specify/memory/constitution.md" },
        ],
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Concepts",
          items: [
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Quickstart", link: "/guide/quickstart" },
            { text: "The semantic vocabulary", link: "/guide/semantic-vocabulary" },
            { text: "Modes & component tokens", link: "/guide/modes-and-component-tokens" },
            { text: "Loaders", link: "/guide/loaders" },
            { text: "Advisory lint", link: "/guide/advisory-lint" },
          ],
        },
      ],
      "/platforms/": [
        {
          text: "Web",
          items: [
            { text: "Web (CSS variables)", link: "/platforms/web" },
            { text: "React", link: "/platforms/web-react" },
            { text: "Vue 3", link: "/platforms/web-vue" },
            { text: "Solid 1.x", link: "/platforms/web-solid" },
            { text: "Angular 18+", link: "/platforms/web-angular" },
          ],
        },
        {
          text: "Mobile",
          items: [
            { text: "React Native", link: "/platforms/react-native" },
            { text: "Flutter (Dart codegen)", link: "/platforms/flutter" },
            { text: "iOS (Swift codegen)", link: "/platforms/swift" },
            { text: "Android (Kotlin codegen)", link: "/platforms/kotlin" },
          ],
        },
      ],
      "/guides/": [
        {
          text: "Adoption",
          items: [
            { text: "Vendor: SDK authors", link: "/guides/vendor" },
            { text: "FI: theme authoring", link: "/guides/fi" },
            { text: "Tokens Studio import", link: "/guides/tokens-studio" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "CLI", link: "/reference/cli" },
            { text: "Contract", link: "/reference/contract" },
            { text: "Workspace packages", link: "/reference/packages" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/gilstrickland-ship-it/polymorph" },
    ],
    footer: {
      message: "Apache-2.0 licensed.",
      copyright: "Polymorph — open design-system-adaptive SDK framework.",
    },
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/gilstrickland-ship-it/polymorph/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
