// src/services/userService.js
import { supabase } from './supabase';

export const userService = {
  // Get profile by ID
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Update profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get all users (admin only)
  async getAllUsers({ search = '', role = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    let query = supabase.from('profiles').select('*');

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get user with their ratings
  async getUserWithRatings(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        ratings (
          id,
          rating,
          created_at,
          stores (id, name, address)
        )
      `)
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Delete user (admin only — deletes from auth too via cascade)
  async deleteUser(userId) {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },
};