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

	<h2>TEST</h2>

</div>
<style>
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