<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { userStore } from '../stores/userStore';
  import { categoryService, teamService } from '../services/api';
  import type { Category } from '../services/api';
  

  
  let teamName = '';
  let selectedCategoryId = '';
  let categories: Category[] = [];
  let loading = false;
  let categoriesLoading = true;
  let error = '';
  
  onMount(async () => {
    userStore.initialize();
    
    if (!$userStore.isLoggedIn) {
      push('/login');
      return;
    }
    
    try {
      categories = await categoryService.getAllCategories();
      categoriesLoading = false;
    } catch (err) {
      error = 'Failed to load categories. Please try again later.';
      categoriesLoading = false;
    }
  });
  
  async function handleSubmit() {
    if (!teamName || !selectedCategoryId) {
      console.log (teamName, selectedCategoryId);
      error = 'Please fill in all fields';
      return;
    }
    
    if (!$userStore.currentUser) {
      error = 'You must be logged in to create a team';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const team = await teamService.createTeam(
        teamName,
        $userStore.currentUser.user_id,
        selectedCategoryId
      );
      
      push(`/team/${team.team_id}`);
    } catch (err: any) {
      if (err.response && err.response.data) {
        error = err.response.data.message || 'Failed to create team';
      } else {
        error = 'An error occurred. Please try again.';
      }
      loading = false;
    }
  }
</script>

<div class="create-team-container">
  <div class="create-team-card">
    <h2>Create a New Team</h2>
    
    {#if categoriesLoading}
      <p>Loading categories...</p>
    {:else if categories.length === 0}
      <p>No categories available. Please try again later.</p>
    {:else}
      <form on:submit|preventDefault={handleSubmit}>
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        <div class="form-group">
          <label for="teamName">Team Name</label>
          <input 
            type="text" 
            id="teamName" 
            bind:value={teamName} 
            placeholder="Enter team name"
            disabled={loading}
          />
        </div>
        
        <div class="form-group">
          <label for="category">Category</label>
          <select 
            id="category" 
            bind:value={selectedCategoryId}
            disabled={loading}
          >
            <option value="">Select a category</option>
            {#each categories as category}
              <option value={category.category_id}>{category.name}</option>
            {/each}
          </select>
        </div>
        
        <button type="submit" class="submit-btn" disabled={loading}>
          {loading ? 'Creating Team...' : 'Create Team'}
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .create-team-container {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
  }
  
  .create-team-card {
    background-color: white;
    border-radius: 8px;
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    margin-top: 0;
    color: #2c3e50;
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #2c3e50;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  .submit-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .submit-btn:hover:not(:disabled) {
    background-color: #27ae60;
  }
  
  .submit-btn:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  
  .error-message {
    background-color: #ffebee;
    color: #e74c3c;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
</style>
