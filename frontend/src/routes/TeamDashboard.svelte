<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { userStore } from '../stores/userStore';
  import { teamService, uploadService, itemService } from '../services/api';
  import type { Item, TeamItem, ItemDetails } from '../services/api';
  
  export let params: { teamId?: string } = {};
  
  let teamData: TeamItem | null = null;
  let loading = true;
  let error = '';
  let uploadingItemId = '';
  let uploadError = '';
  let uploadSuccess = '';
  let selectedItem: ItemDetails | null = null;
  let showItemDetails = false;
  
  onMount(async () => {
    userStore.initialize();
    
    if (!$userStore.isLoggedIn) {
      push('/login');
      return;
    }
    
    await loadTeamData();
  });
  
  async function loadTeamData() {
    loading = true;
    error = '';
    
    try {
      const teamId = params.teamId;
      if (!teamId) {
        throw new Error('Team ID is required');
      }
      console.log('Loading team data for team ID:', teamId);
      teamData = await teamService.getTeamItems(teamId);

      console.log('Team data:', teamData);
      loading = false;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        error = 'Team not found';
      } else {
        error = 'Failed to load team data. Please try again later.';
      }
      loading = false;
    }
  }
  
  async function handleImageUpload(event: Event, item: Item) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    console.log('Uploading image for item:', item);
    const file = input.files[0];
    if (!file) {
      return;
    }
    uploadingItemId = item.itemId;
    uploadError = '';
    uploadSuccess = '';
    
    try {
      const teamId = params.teamId;
      if (!teamId) {
        throw new Error('Team ID is required');
      }
      
      await uploadService.uploadImage(teamId, item.itemId, file);
      uploadSuccess = 'Image uploaded successfully! Item matched!';
      await loadTeamData();
    } catch (err: any) {
      if (err.response && err.response.data) {
        uploadError = err.response.data.message || 'Failed to upload image';
      } else {
        uploadError = 'An error occurred during upload. Please try again.';
      }
    } finally {
      uploadingItemId = '';
    }
  }

  async function viewItemDetails(itemId: string) {
    try {
      selectedItem = await itemService.getItemDetails(itemId);
      showItemDetails = true;
    } catch (err) {
      error = 'Failed to load item details';
    }
  }

  function closeItemDetails() {
    showItemDetails = false;
    selectedItem = null;
  }
</script>

<div class="team-dashboard">
  {#if loading}
    <div class="loading">Loading team data...</div>
  {:else if error}
    <div class="error-message">{error}</div>
  {:else if teamData}
    <div class="team-header">

    </div>
    
    {#if uploadSuccess}
      <div class="success-message">{uploadSuccess}</div>
    {/if}
    
    {#if uploadError}
      <div class="error-message">{uploadError}</div>
    {/if}
    
    <div class="items-container">
      <h2>Scavenger Hunt Items</h2>
      
      {#if teamData.items.length === 0}
        <p>No items assigned to this team yet.</p>
      {:else}
        <div class="items-grid">
          {#each teamData.items as item}
            <div class="item-card" class:found={item.isCollected}>
              <div class="item-status">
                {#if item.isCollected}
                  <span class="status-badge found">Found</span>
                {:else}
                  <span class="status-badge not-found">Not Found</span>
                {/if}
              </div>
              
              <h3>{item.name}</h3>
              
              {#if item.isCollected}
                <button class="view-details-btn" on:click={() => viewItemDetails(item.itemId)}>
                  View Details
                </button>
              {:else}
                <div class="upload-container">
                  <label for={`file-${item.itemId}`} class="upload-btn">
                    {uploadingItemId === item.itemId ? 'Uploading...' : 'Upload Image'}
                  </label>
                  <input 
                    type="file" 
                    id={`file-${item.itemId}`} 
                    accept="image/*"
                    on:change={(e) => handleImageUpload(e, item)}
                    disabled={uploadingItemId !== ''}
                    style="display: none;"
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  
  {#if showItemDetails && selectedItem}
    <div class="modal-overlay">
      <div class="modal-content">
        <button class="close-btn" on:click={closeItemDetails}>×</button>
        <h2>{selectedItem.name}</h2>
        <p><strong>Scientific Name:</strong> {selectedItem.sciName}</p>
        <p><strong>Habitat:</strong> {selectedItem.habitat}</p>
        <p><strong>Diet:</strong> {selectedItem.diet}</p>
        <p><strong>Biology:</strong> {selectedItem.biology}</p>
        <p><strong>Fun Fact:</strong> {selectedItem.funFact}</p>
        {#if selectedItem.synonyms && selectedItem.synonyms.length > 0}
          <div>
            <strong>Synonyms:</strong>
            <ul>
              {#each selectedItem.synonyms as synonym}
                <li>{synonym}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .team-dashboard {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #7f8c8d;
  }
  
  .team-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ecf0f1;
  }
  
  .team-header h1 {
    margin: 0;
    color: #2c3e50;
  }
  
  .team-code {
    background-color: #f8f9fa;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .team-code span {
    color: #7f8c8d;
    margin-right: 0.5rem;
  }
  
  .items-container {
    margin-top: 2rem;
  }
  
  .items-container h2 {
    margin-bottom: 1.5rem;
    color: #2c3e50;
  }
  
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .item-card {
    position: relative;
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .item-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .item-card.found {
    background-color: #f1f9f1;
    border-left: 4px solid #2ecc71;
  }
  
  .item-status {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .status-badge.found {
    background-color: #2ecc71;
    color: white;
  }
  
  .status-badge.not-found {
    background-color: #f39c12;
    color: white;
  }
  
  .item-card h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }
  
  .item-card p {
    color: #7f8c8d;
    margin-bottom: 1rem;
  }
  
  .points {
    font-weight: bold;
    color: #e74c3c !important;
  }
  
  .upload-container {
    margin-top: 1rem;
  }
  
  .upload-btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #3498db;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .upload-btn:hover {
    background-color: #2980b9;
  }
  
  .error-message {
    background-color: #ffebee;
    color: #e74c3c;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .success-message {
    background-color: #e8f5e9;
    color: #2ecc71;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .view-details-btn {
    display: block;
    width: 100%;
    padding: 0.5rem 1rem;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 1rem;
    font-weight: 500;
  }
  
  .view-details-btn:hover {
    background-color: #27ae60;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    padding: 2rem;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  
  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #7f8c8d;
    transition: color 0.2s;
  }
  
  .close-btn:hover {
    color: #34495e;
  }
  
  .modal-content p {
    margin: 0.5rem 0;
  }
  
  .modal-content ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  
  .full-description {
    margin: 1.5rem 0;
    line-height: 1.6;
    color: #34495e;
  }
  
  .status, .category {
    margin-top: 0.75rem;
    color: #7f8c8d;
  }
</style>
