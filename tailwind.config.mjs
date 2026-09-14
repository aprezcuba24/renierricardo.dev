/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				surface: {
					DEFAULT: '#09090b', // zinc-950
					raised: '#18181b', // zinc-900
					border: '#27272a', // zinc-800
				},
				ink: {
					DEFAULT: '#f4f4f5', // zinc-100
					muted: '#a1a1aa', // zinc-400
				},
				accent: {
					DEFAULT: '#fbbf24', // amber-400
					strong: '#f59e0b', // amber-500
				},
			},
			fontFamily: {
				sans: ['Outfit', 'system-ui', 'sans-serif'],
			},
			maxWidth: {
				content: '72rem', // 6xl
				article: '48rem', // 3xl
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
