import { defineConfig } from 'vite'
import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
import handlebars from 'vite-plugin-handlebars'

export default defineConfig(() => {

  const pagesPath = path.resolve(__dirname, 'src')
  const pageFiles = fs.readdirSync(pagesPath)
    .filter(file => file.endsWith('.html') && file !== 'link-page.html')

  const pageMetaList = pageFiles.map(file => {
    const filePath = path.join(pagesPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').slice(0, 10)
    const meta = {}

    lines.forEach(line => {
      const match = line.match(/@(\w+)\s+(.+?)\s*-->/)
      if (match) meta[match[1]] = match[2].trim()
    })

    return {
      name: file,
      title: meta.pageTitle || path.basename(file, '.html'),
      note: meta.pageNote || '',
      created: meta.pageCreated || '',
      updated: meta.pageUpdated || ''
    }
  })

  return {
    root: "src",
    // 로컬에서 dist를 루트 정적 서버로 열 때 깨지지 않도록 기본은 상대 경로.
    // GitHub Pages(서브패스) 배포는 CI에서 `npm run build -- --base /리포지토리명/` 로 덮어씀.
    base: "./",
    publicDir: "../public",

    build: {
      outDir: "../dist",
      emptyOutDir: true,
      cssCodeSplit: false,
      minify: false,

      rollupOptions: {
        input: Object.fromEntries(
          glob.sync("*.html", { cwd: "src" }).map((file) => {
            return [file, path.resolve(__dirname, "src", file)];
          }),
        ),

        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name.split(".").pop();

            if (ext === "css") {
              return "assets/[name].css";
            }

            if (/(png|jpe?g|gif|svg|webp)/.test(ext)) {
              return "assets/images/[name][extname]";
            }

            return "assets/[name][extname]";
          },
        },
      },
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    plugins: [
      handlebars({
        partialDirectory: path.resolve(__dirname, "src/components"),
        context: { pages: pageMetaList },
      }),

      {
        name: "cleanup-html",
        closeBundle() {
          const distPath = path.resolve(__dirname, "dist");
          const htmlFiles = fs
            .readdirSync(distPath)
            .filter((f) => f.endsWith(".html"));

          htmlFiles.forEach((file) => {
            const filePath = path.join(distPath, file);
            let content = fs.readFileSync(filePath, "utf-8");
            content = content.replace(/ crossorigin/g, "");
            content = content.replace(/<link rel="modulepreload" [^>]+?>/g, "");
            fs.writeFileSync(filePath, content);
          });
        },
      },
    ],
  };
})
