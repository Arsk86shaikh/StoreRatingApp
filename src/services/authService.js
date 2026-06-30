// src/services/authService.js
import { supabase } from './supabase';

export const authService = {
  async signUp({ email, password, full_name, address, role = 'user' }) {
    console.log('📝 Starting signup process...');
    console.log('📋 Input:', { full_name, email, role });

    if (!full_name || full_name.trim().length < 20) {
      throw new Error('Full name must be at least 20 characters');
    }
    if (!address || !address.trim()) {
      throw new Error('Address is required');
    }

    console.log('🔐 Creating auth user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: full_name.trim(), address: address.trim(), role },
      },
    });

    if (error) {
      console.error('❌ Auth error:', error.message);
      // Surface common Supabase error codes with clearer wording
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('This email is already registered.');
      }
      throw new Error(error.message);
    }

    if (!data.user?.id) {
      throw new Error('Failed to create user account.');
    }

    console.log('✅ Auth user created:', data.user.id);
    console.log('ℹ️ Profile row will be created automatically by the database trigger.');

    // data.session exists only if email confirmation is disabled in Supabase.
    // Signup.jsx checks this to decide whether to log the user straight in
    // or show a "confirm your email" screen.
    return data;
  },

  async signIn({ email, password }) {
    console.log('🔐 Starting signin...');
    console.log('📧 Email:', email);

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('❌ Signin error:', error.message);
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('confirm')) {
        throw new Error('Please confirm your email before signing in.');
      }
      if (msg.includes('invalid login credentials')) {
        throw new Error('Incorrect email or password.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed — user not found.');
    }

    console.log('✅ Auth successful, user ID:', data.user.id);
    return data; // { user, session }
  },

  async signOut() {
    console.log('🚪 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Signout error:', error.message);
      throw error;
    }
    console.log('✅ Signed out');
  },

  async updatePassword(newPassword) {
    console.log('🔑 Updating password...');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('❌ Password update error:', error.message);
      throw error;
    }
    console.log('✅ Password updated');
  },
};

export default authService;