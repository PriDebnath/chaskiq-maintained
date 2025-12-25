import esbuild from 'esbuild';
import babel from './babel-esbuild.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Plugin to handle Node.js built-in modules
const nodeBuiltinsPlugin = {
  name: 'node-builtins',
  setup(build) {
    // Handle 'buffer' module - intercept all resolutions
    build.onResolve({ filter: /^buffer$/ }, (args) => {
      return { 
        path: args.path,
        namespace: 'buffer-shim'
      };
    });
    
    build.onLoad({ filter: /.*/, namespace: 'buffer-shim' }, () => {
      // Return inline buffer shim
      return {
        contents: `
          // Browser Buffer polyfill
          function Buffer(data, encoding) {
            if (!(this instanceof Buffer)) {
              return new Buffer(data, encoding);
            }
            if (typeof data === 'string') {
              const encoder = new TextEncoder();
              this._data = encoder.encode(data);
            } else if (data instanceof ArrayBuffer) {
              this._data = new Uint8Array(data);
            } else if (data instanceof Uint8Array) {
              this._data = data;
            } else if (Array.isArray(data)) {
              this._data = new Uint8Array(data);
            } else if (typeof data === 'number') {
              this._data = new Uint8Array(data);
            } else {
              this._data = new Uint8Array(0);
            }
            this.length = this._data.length;
          }
          Buffer.from = function(data, encoding) {
            if (typeof data === 'string') {
              const encoder = new TextEncoder();
              return new Buffer(encoder.encode(data));
            }
            return new Buffer(data);
          };
          Buffer.alloc = function(size, fill) {
            const buf = new Uint8Array(size);
            if (fill !== undefined) buf.fill(fill);
            return new Buffer(buf);
          };
          Buffer.allocUnsafe = Buffer.alloc;
          Buffer.isBuffer = function(obj) {
            return obj instanceof Buffer;
          };
          Buffer.concat = function(buffers, length) {
            if (!Array.isArray(buffers)) return new Buffer(0);
            const totalLength = length || buffers.reduce((sum, buf) => sum + (buf.length || 0), 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const buf of buffers) {
              const data = buf._data || buf;
              result.set(data, offset);
              offset += data.length;
            }
            return new Buffer(result);
          };
          if (typeof global !== 'undefined') global.Buffer = Buffer;
          if (typeof window !== 'undefined') window.Buffer = Buffer;
          module.exports = { Buffer };
          module.exports.Buffer = Buffer;
        `,
        loader: 'js',
      };
    });
  },
};

const watch = process.argv.includes('--watch')
const minify = process.argv.includes('--minify')
const metafile = process.argv.includes('--metafile')

console.log("WATCH: ", watch)
console.log("MINIFY: ", minify)
console.log("METAFILE: ", metafile)

let ctx = await esbuild.context({
  logLevel: 'info',
  target: 'es2020',
  sourcemap: watch ? 'inline' : false,
  define: { 
    'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    'global': 'window',
    'process.env.NODE_DEBUG': '""',
    'define': 'undefined'
  },
  platform: 'browser',
  inject: ['./esbuild/process-shim.js'],
  entryPoints: [
    "app/javascript/application.js", 
    "app/javascript/embed.js",
    "app/javascript/article.js",
    "app/javascript/docs.js",
    "app/javascript/locales.js",
    "app/javascript/twilio_phone_package.js"
  ],
  bundle: true,
  loader: { 
    '.png': 'file',
    '.js': 'jsx',
  },
  metafile,
  minify,
  publicPath: "/assets",
  assetNames: '[name]-[hash].digested',
  //splitting: true,
  //chunkNames: '[name]-[hash].digested',
  //format: 'esm',
  banner: {
    js: `
      ${
        watch ?
          `
            (
              () => {
                const sse = new EventSource("http://localhost:3001/esbuild");
                sse.addEventListener("change", (e) => {
                  console.log("Esbuild message:", e.data);
                  location.reload();
                });
              }
            )();
          `
        : ''
      }
    `
  },
  outdir: 'app/assets/builds',
  plugins: [
    nodeBuiltinsPlugin,
    babel({
        filter: /\.([^cpj].*|c([^s].*)?|cs([^s].*)?|css.+|p([^n].*)?|pn([^g].*)?|png.+|j([^s].*)?|js([^o].*)?|jso([^n].*)?|json.+)$/,
      })
  ]
})

if( watch ){
  await ctx.watch()
  let { host, port } = await ctx.serve({
    port: 3001,
    servedir: 'app/assets/builds',
  })
} else {
  ctx.rebuild()
  ctx.dispose()
}


