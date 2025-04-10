<script lang="ts">
  import { onMount } from 'svelte';
  import { push as navigate } from 'svelte-spa-router';
  import { userService } from '../services/api';
  import { userStore } from '../stores/userStore';

  let email = '';
  let name = '';
  let loading = false;
  let error = '';

  onMount(() => {
    // Check if user is already logged in
    userStore.initialize();
    const unsubscribe = userStore.subscribe(state => {
      if (state.isLoggedIn) {
        navigate('/');
      }
    });

    return unsubscribe;
  });

  async function handleLogin() {
    if (!email) {
      error = 'Please enter your email';
      return;
    }

    try {
      loading = true;
      error = '';
      
      let user;
      try {
        // Try to get user by email first
        user = await userService.getUserByEmail(email);
        // Login successful with existing user
        userStore.login(user);
        navigate('/');
      } catch (err) {
        // If user doesn't exist, check if we're registering
        if (name) {
          // Create a new user
          user = await userService.createUser(name, email);
          userStore.login(user);
          navigate('/');
        } else {
          // Show registration form
          error = 'User not found. Please enter your name to register.';
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      error = 'Failed to login. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>Scavenger Hunt</h1>
    <h2>Login or Sign Up</h2>
    
    {#if error}
      <div class="error-message">{error}</div>
    {/if}
    
    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="name">Name {#if !error.includes('name')}(for new users){/if}</label>
        <input 
          type="text" 
          id="name" 
          bind:value={name} 
          placeholder="Enter your name"
          class:required={error.includes('name')}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {#if loading}
          Logging in...
        {:else}
          Login / Sign Up
        {/if}
      </button>
    </form>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 80px);
    padding: 20px;
  }
  
  .login-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 30px;
    width: 100%;
    max-width: 400px;
  }
  
  h1 {
    text-align: center;
    color: #4a4a4a;
    margin-bottom: 10px;
  }
  
  h2 {
    text-align: center;
    color: #666;
    font-size: 1.2rem;
    margin-bottom: 30px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #4a4a4a;
  }
  
  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  
  input:focus {
    border-color: #4a90e2;
    outline: none;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }
  
  input.required {
    border-color: #e74c3c;
  }
  
  button {
    width: 100%;
    padding: 12px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: #3a80d2;
  }
  
  button:disabled {
    background-color: #a0c4f0;
    cursor: not-allowed;
  }
  
  .error-message {
    background-color: #fdecea;
    color: #e74c3c;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
    font-size: 14px;
  }
</style>