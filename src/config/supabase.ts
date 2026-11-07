import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://pxikqeaxhvyekhbvtobp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aWtxZWF4aHZ5ZWtoYnZ0b2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjcxNTIsImV4cCI6MjA5NTYwMzE1Mn0.1fBfJzL7RPrO3pItxR7UH28Rguc_5O2iHkADfqNFjZM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
