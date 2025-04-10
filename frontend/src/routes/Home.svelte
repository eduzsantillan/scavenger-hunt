<script lang="ts">
  import link from 'svelte-spa-router/active';
  import { onMount } from 'svelte';
  // import { push } from 'svelte-spa-router';
  import { userStore } from '../stores/userStore';
  import { categoryService, teamService } from '../services/api';
  import type { Category, Team } from '../services/api';
  
  let categories: Category[] = [];
  let loading = true;
  let error = '';
  let userTeams: Team[] = [];
  let checkingTeams = false;
  
  onMount(async () => {
    userStore.initialize();
    try {
      // Load categories
      categories = await categoryService.getAllCategories();
      loading = false;
      
      // Check if user is logged in and has teams
      if ($userStore.isLoggedIn && $userStore.currentUser) {
        checkingTeams = true;
        try {
          const userId = $userStore.currentUser.user_id;
          if (userId) {
            userTeams = await teamService.getUserTeams(userId);
            console.log("here is the teams", userTeams);
            // If user has at least one team, redirect to the first team's dashboard
            // if (userTeams && userTeams.length > 0 && userTeams[0]?.team_id) {
            //   push(`/team/${userTeams[0].team_id}`);
            // }
          }
        } catch (teamErr) {
          console.error('Error fetching user teams:', teamErr);
        } finally {
          checkingTeams = false;
        }
      }
    } catch (err) {
      error = 'Failed to load categories. Please try again later.';
      loading = false;
    }
  });
</script>

<div class="home-container">
  <div class="hero">
    <h1>Welcome to Scavenger Hunt</h1>
    <p>Create teams, find items, and compete with friends!</p>
    
    {#if $userStore.isLoggedIn}
      {#if checkingTeams}
        <div class="loading-teams">Checking your teams...</div>
      {:else}
        <div class="action-buttons">
          <a href="#/team/create" use:link class="btn primary">Create a Team</a>
          <a href="#/team/join" use:link class="btn secondary">Join a Team</a>
        </div>
      {/if}
    {:else}
      <a href="#/login" use:link class="btn primary">Get Started</a>
    {/if}
  </div>
  
  <div class="categories-section">
    <h2>Available Categories</h2>
    
    {#if loading}
      <p>Loading categories...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if categories.length === 0}
      <p>No categories available at the moment.</p>
    {:else}
      <div class="categories-grid">
        {#each categories as category}
          <div class="category-card">
            <h3>{category.name}</h3>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .home-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .hero {
    text-align: center;
    padding: 3rem 1rem;
    background-color: #3498db;
    color: white;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .btn {
    display: inline-block;
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
    transition: background-color 0.3s;
  }
  
  .primary {
    background-color: #2ecc71;
    color: white;
  }
  
  .primary:hover {
    background-color: #27ae60;
  }
  
  .secondary {
    background-color: white;
    color: #3498db;
  }
  
  .secondary:hover {
    background-color: #f8f9fa;
  }
  
  .categories-section {
    padding: 1rem;
  }
  
  .categories-section h2 {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .category-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .error {
    color: #e74c3c;
    text-align: center;
  }
</style>
