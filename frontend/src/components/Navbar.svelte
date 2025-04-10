<script lang="ts">
  import { push } from 'svelte-spa-router';
  import link from 'svelte-spa-router/active';
  import { userStore } from '../stores/userStore';
  import { teamService } from '../services/api';
  import type { Team } from '../services/api';
  
  let userTeams: Team[] = [];
  let loadingTeams = false;
  let showTeamsDropdown = false;
  
  // onMount(async () => {
  //   await loadUserTeams();
  // });

  $: if ($userStore.isLoggedIn && $userStore.currentUser) {
    loadUserTeams();
  }

  async function loadUserTeams() {
    console.log('Loading user teams...');
    if ($userStore.isLoggedIn && $userStore.currentUser) {
      loadingTeams = true;
      try {
        const userId = $userStore.currentUser.user_id;
        if (userId) {
          userTeams = await teamService.getUserTeams(userId);
        } else {
          console.error('User ID is undefined or null');
        }
      } catch (err) {
        console.error('Error loading user teams:', err);
      } finally {
        loadingTeams = false;
      }
    } else {
      console.log('User not logged in or currentUser is null');
    }
  }
  
  function toggleTeamsDropdown() {
    showTeamsDropdown = !showTeamsDropdown;
  }
  
  function handleLogout() {
    userStore.logout();
    push('/');
  }

  function selectTeam(teamId: string) {
    push(`/team/${teamId}`);
    showTeamsDropdown = false;
  }
</script>

<nav>
  <div class="logo">
    <a href="#/" use:link>Scavenger Hunt</a>
  </div>
  <div class="nav-links">
    {#if $userStore.isLoggedIn}
      <a href="#/team/create" use:link>Create Team</a>
      <a href="#/team/join" use:link>Join Team</a>
      
      <div class="teams-dropdown">
        <button class="dropdown-btn" on:click={toggleTeamsDropdown}>
          My Teams {#if loadingTeams}<span class="loading-dot">...</span>{/if}
        </button>

        {#if showTeamsDropdown}
          <div class="dropdown-content">
            {#if userTeams && userTeams.length > 0}
              {#each userTeams as team}
                <a href="#/team/{team.team_id}" on:click|preventDefault={() => selectTeam(team.team_id)}>{team.name}</a>
              {/each}
            {:else}
              <div class="no-teams">No teams yet</div>
            {/if}
          </div>
        {/if}
      </div>
      
      <span class="user-name">Hello, {$userStore.currentUser?.name}</span>
      <button class="logout-btn" on:click={handleLogout}>Logout</button>
    {:else}
      <a href="#/login" use:link>Login</a>
    {/if}
  </div>
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #2c3e50;
    color: white;
  }
  
  .logo a {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    text-decoration: none;
  }
  
  .nav-links {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .nav-links a {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
  }
  
  .nav-links a:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .teams-dropdown {
    position: relative;
    display: inline-block;
  }
  
  .dropdown-btn {
    background-color: #3498db;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .dropdown-btn:hover {
    background-color: #2980b9;
  }
  
  .dropdown-content {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: #34495e;
    min-width: 200px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    z-index: 1;
    border-radius: 4px;
    margin-top: 0.5rem;
  }
  
  .dropdown-content a {
    color: white;
    padding: 0.75rem 1rem;
    text-decoration: none;
    display: block;
    transition: background-color 0.3s;
    text-align: left;
  }
  
  .dropdown-content a:hover {
    background-color: #2c3e50;
  }
  
  .no-teams {
    padding: 0.75rem 1rem;
    color: #95a5a6;
    text-align: center;
  }
  
  .loading-dot {
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }
  
  .user-name {
    margin-left: 0.5rem;
    color: #ecf0f1;
  }
  
  .logout-btn {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .logout-btn:hover {
    background-color: #c0392b;
  }
  
  button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  button:hover {
    background-color: #c0392b;
  }
</style>
