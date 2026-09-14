import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";
import { remarkMermaid } from './src/plugins/remark-mermaid.js';

// https://astro.build/config
export default defineConfig({
  site: "https://renierricardo.dev/",
  integrations: [
    tailwind(),
  ],
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
});
