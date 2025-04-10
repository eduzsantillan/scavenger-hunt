import { writable } from 'svelte/store';
import type { User } from '../services/api';

interface UserState {
  currentUser: User | null;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  currentUser: null,
  isLoggedIn: false
};

function createUserStore() {
  const { subscribe, set, update } = writable<UserState>(initialState);

  return {
    subscribe,
    login: (user: User) => {
      localStorage.setItem('currentUser', JSON.stringify(user));
      update(state => ({ ...state, currentUser: user, isLoggedIn: true }));
    },
    logout: () => {
      localStorage.removeItem('currentUser');
      set(initialState);
    },
    initialize: () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        update(state => ({ ...state, currentUser: user, isLoggedIn: true }));
      }
    }
  };
}

export const userStore = createUserStore();
