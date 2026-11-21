import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
            "@wailsjs": path.resolve(import.meta.dirname, "./wailsjs"),
            'react': path.resolve(import.meta.dirname, 'node_modules/react'),
        },
    },
});
