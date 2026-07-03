import { copyFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyScaffoldingPlugin() {
	return {
		name: 'copy-scaffolding',
		buildStart() {
			const scaffoldingDir = path.resolve(__dirname, 'node_modules/@turbowarp/scaffolding');
			const skipInstall = process.env.SKIP_SCAFFOLDING_INSTALL === 'true';
			const skipBuild = process.env.SKIP_SCAFFOLDING_BUILD === 'true';

			if (!skipInstall) {
				console.log('[copy-scaffolding] installing scaffolding dependencies...');
				execSync('npm install', {
					cwd: scaffoldingDir,
					stdio: 'inherit'
				});
			} else {
				console.log('[copy-scaffolding] skipping dependency install (SKIP_SCAFFOLDING_INSTALL=true)');
			}

			if (!skipBuild) {
				console.log('[copy-scaffolding] building scaffolding...');
				execSync('npm run build', {
					cwd: scaffoldingDir,
					stdio: 'inherit'
				});
			} else {
				console.log('[copy-scaffolding] skipping scaffolding building (SKIP_SCAFFOLDING_BUILD=true)');
			}

			const src = path.join(scaffoldingDir, 'dist/scaffolding-min.js');
			const destDir = path.resolve(__dirname, 'static/scaffolding');
			mkdirSync(destDir, { recursive: true });
			copyFileSync(src, path.join(destDir, 'scaffolding-min.js'));
			console.log('[copy-scaffolding] copied latest scaffolding-min.js to static/scaffolding/');
		}
	};
}

export default defineConfig({
	plugins: [
		copyScaffoldingPlugin(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	build: {
		sourcemap: false
	},
	server: {
		allowedHosts: ['gratuity-saved-sedate.ngrok-free.dev']
	}
});