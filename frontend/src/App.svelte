<script lang="ts">
  import Router from 'svelte-spa-router';
  import Home from './routes/Home.svelte';
  import Login from './routes/Login.svelte';
  import TeamCreate from './routes/TeamCreate.svelte';
  import TeamJoin from './routes/TeamJoin.svelte';
  import TeamDashboard from './routes/TeamDashboard.svelte';
  import Navbar from './components/Navbar.svelte';
  
  const routes = {
    '/': Home,
    '/login': Login,
    '/team/create': TeamCreate,
    '/team/join': TeamJoin,
    '/team/:teamId': TeamDashboard
  };
</script>

<div class="app-container">
  <Navbar />
  <main>
    <Router {routes} />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f5f5;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
</style>
