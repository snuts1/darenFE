<script>
    let showMenu = false;
    function toggleMenu() {
        showMenu = !showMenu;
        console.log("Toggle menu:", showMenu);
    }
</script>

<div class="menu-box">
    <h1> <em>PAYBACK</em></h1>
    <button on:click={toggleMenu}><b>≡</b></button>
</div>
{#if showMenu}
<nav class="mobile-menu">
    <a href="/">Home</a>
    <a href="/other">Other</a>
</nav>
{/if}

<style>
    .menu-box {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 10px 15px;
        color: #FFFFFF;
        background-color: #ea2852;
    }
    h1 {
        margin: 0;
        text-align: center;
    }
    button {
        position: absolute;
        right: 15px;
        margin: 0;
        color: #FFFFFF;
        background-color: #515151;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        padding: 5px 8px;
        cursor: pointer;
        font-size: 1.5em; /* Make icon larger */
        line-height: 1; /* Ensure consistent height */
    }
    .mobile-menu {
        position: absolute;
        right:15px;
        z-index: 10;
        border: 1px solid #333;
        min-width: 120px;
        background-color: #f8f8f8; /* ADDED: Make the menu visible */
    }
    .mobile-menu a {
        padding: 8px;
        text-decoration: none;
        color: #333;
        display: block;
    }
</style>