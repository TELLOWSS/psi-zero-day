import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
// Isolated read-only browser test server: editing work cannot erase 10-minute telemetry.
export default defineConfig({base:'./',plugins:[react()],server:{host:'127.0.0.1',port:5204,strictPort:true,hmr:false,watch:null}});
