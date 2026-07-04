<script>
    import DIYPlayer from "$lib/DIYPlayer.svelte";

    const projectLinks = [
		'https://file.garden/akimNmiAY2N-CCy0/projects/Add%20Yourself%20RIGHT%20NOW%20QUICK%20DO%20IT%20YOU%20HAVE%20SIX%20SECONDS.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/sweetboy.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/splode%20them%20rocks%203%20i%20gotta%20pee.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/poke.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/operation%20gurt.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/honse.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/grid.sb3',
		'https://file.garden/akimNmiAY2N-CCy0/projects/flap.sb3'
    ];
</script>

<main>
    <h1>DIYPlayer</h1>
    
	<div class="container">
    	<DIYPlayer projectUrls={projectLinks} />
	</div>
</main>

<style>
	.container {
		background-color: aqua;

		width: 50vw;
		height: 50vw;
	}
</style>