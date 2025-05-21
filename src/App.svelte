<script>
	import Menu from './Menu.svelte'
	import Events from './Trips.svelte'
	export let name;
</script>
<Menu />
<Events />
<main>
</main>
<div>

</div>
<style global lang="scss">
	// Import Carbon Design System global styles
	// This requires svelte-preprocess and sass to be configured
	// in your svelte.config.js or bundler config.
	@import "@carbon/charts-svelte/styles.css";

	/* Your other global styles can go here */
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 2em auto 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>