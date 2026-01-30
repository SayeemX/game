import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.me();
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
    wallet: {
      mainBalance: 0,
      bonusBalance: 0,
      spinCredits: {
        BRONZE: 0,
        SILVER: 0,
        GOLD: 0,
        DIAMOND: 0
      },
      totalWon: 0,
      totalSpent: 0
    },
    stats: {
      totalSpins: 0,
      totalWins: 0,
      biggestWin: 0,
      favoriteGame: 'spin'
    }
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.isAuthenticated = false;
      state.wallet = {
        mainBalance: 0,
        bonusBalance: 0,
        spinCredits: {
          BRONZE: 0,
          SILVER: 0,
          GOLD: 0,
          DIAMOND: 0
        },
        totalWon: 0,
        totalSpent: 0
      };
    },
    updateBalance: (state, action) => {
      const { type, amount, tier = 'BRONZE' } = action.payload;
      if (type === 'mainBalance') {
        state.wallet.mainBalance += amount;
      } else if (type === 'bonusBalance') {
        state.wallet.bonusBalance += amount;
      } else if (type === 'spinCredits') {
        if (typeof state.wallet.spinCredits === 'object') {
          state.wallet.spinCredits[tier] += amount;
        } else {
          state.wallet.spinCredits += amount;
        }
      } else {
          state.wallet.mainBalance += (action.payload.amount || action.payload);
      }
    },
    awardPrize: (state, action) => {
      const prize = action.payload;
      state.stats.totalWins += 1;
      if (prize.value > state.stats.biggestWin) {
        state.stats.biggestWin = prize.value;
      }
      state.wallet.totalWon += prize.value;
    },
    setUserData: (state, action) => {
        state.user = action.payload;
        state.wallet = action.payload.wallet || state.wallet;
        state.stats = action.payload.stats || state.stats;
        state.isAuthenticated = true;
    },
    updateWallet: (state, action) => {
        state.wallet = { ...state.wallet, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.wallet = action.payload.user.wallet || state.wallet;
        state.stats = action.payload.user.stats || state.stats;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.wallet = action.payload.user.wallet || state.wallet;
        state.stats = action.payload.user.stats || state.stats;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.wallet = action.payload.wallet || state.wallet;
        state.stats = action.payload.stats || state.stats;
      });
  }
});

export const { logout, updateBalance, awardPrize, setUserData, updateWallet } = userSlice.actions;
export default userSlice.reducer;
