<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import link from 'svelte-spa-router/active';
  import { userStore } from '../stores/userStore';
  import { teamService } from '../services/api';
  import type { Team } from '../services/api';
  
  let teams: Team[] = [];
  let selectedTeamId: string = '';
  let teamCode = '';
  let loading = false;
  let teamsLoading = true;
  let error = '';
  
  onMount(async () => {
    userStore.initialize();
    
    if (!$userStore.isLoggedIn) {
      push('/#/login');
      return;
    }
    
    try {
      teams = await teamService.getAllTeams();
      teamsLoading = false;
    } catch (err) {
      error = 'Failed to load teams. Please try again later.';
      teamsLoading = false;
    }
  });

  async function handleSubmit() {

    const trimmedTeamCode = teamCode.trim();
    console.log(trimmedTeamCode);
    if (!$userStore.currentUser) {
      error = 'You must be logged in to join a team';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      await teamService.joinTeam(
        $userStore.currentUser.user_id,
        selectedTeamId,
        trimmedTeamCode
      );
      
      push(`/#/team/${selectedTeamId}`);
    } catch (err: any) {
      if (err.response && err.response.data) {
        error = err.response.data.message || 'Failed to join team';
      } else {
        error = 'An error occurred. Please try again.';
      }
      loading = false;
    }
  }
</script>

<div class="join-team-container">
  <div class="join-team-card">
    <h2>Join a Team</h2>
    
    {#if teamsLoading}
      <p>Loading teams...</p>
    {:else if teams.length === 0}
      <p>No teams available. <a href="#/team/create" use:link>Create a team</a> instead.</p>
    {:else}
      <form on:submit|preventDefault={handleSubmit}>
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        <div class="form-group">
          <label for="team-select">Select Team</label>
          <select 
            id="team-select"
            disabled={loading}
            class="team-select"
            bind:value={selectedTeamId}
          >
            <option value="" disabled>Select a team</option>
            {#each teams as team}
              <option value={team.team_id}>
                {team.name}
              </option>
            {/each}
          </select>
          <div class="debug-info">
            <small>Selected Team ID: {selectedTeamId || 'None'}</small>
          </div>
        </div>
        
        <div class="form-group">
          <label for="teamCode">Team Code</label>
          <input 
            type="text" 
            id="teamCode" 
            bind:value={teamCode} 
            placeholder="Enter team code"
            disabled={loading}
          />
        </div>
        
        <button type="submit" class="submit-btn" disabled={loading}>
          {loading ? 'Joining Team...' : 'Join Team'}
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .join-team-container {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
  }
  
  .join-team-card {
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
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  .team-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    background-color: white;
  }
  
  .team-select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  .debug-info {
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.8rem;
  }
  
  .submit-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .submit-btn:hover:not(:disabled) {
    background-color: #2980b9;
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
  
  a {
    color: #3498db;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
</style>
