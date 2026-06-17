import { supabase } from './supabase';

export const authService = {
  async signUp(data) {
    try {
      console.log('📝 Starting signup process...');
      console.log('📋 Input data:', {
        full_name: data.full_name,
        email: data.email,
        role: data.role,
      });

      // Validate data before sending
      if (!data.full_name || data.full_name.length < 20) {
        throw new Error('Full name must be at least 20 characters');
      }

      // 1. Create auth user with Supabase
      console.log('🔐 Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            address: data.address || '',
            role: data.role,
          },
        },
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user?.id) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // 2. Wait for auth to complete
      console.log('⏳ Waiting for auth to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Create profile in database
      console.log('📊 Creating profile in database...');
      
      const profileData = {
        id: authData.user.id,
        full_name: data.full_name,
        email: data.email,
        address: data.address || null,
        role: data.role,
      };

      console.log('📤 Profile data to insert:', profileData);

      // Use a simple insert without .select() to avoid RLS issues
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('❌ Profile creation error:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });
        
        // Handle specific database errors
        if (profileError.code === '23505') {
          throw new Error('This email is already registered');
        } else if (profileError.code === '23514') {
          throw new Error('Invalid data. Check that full name is 20-60 characters and address is under 400 characters.');
        } else if (profileError.code === '42501') {
          throw new Error('Permission denied. RLS policies issue.');
        } else if (profileError.message.includes('infinite recursion')) {
          throw new Error('Database policy error. Please contact support.');
        } else {
          throw new Error(`Database error: ${profileError.message}`);
        }
      }

      console.log('✅ Profile created successfully');

      return {
        success: true,
        user: authData.user,
        message: 'Account created successfully!',
      };
    } catch (error) {
      console.error('❌ Signup error:', error.message);
      return {
        success: false,
        error: error.message || 'Signup failed. Please try again.',
      };
    }
  },

  async signIn(data) {
    try {
      console.log('🔐 Starting signin...');
      console.log('📧 Email:', data.email);

      if (!data.email || !data.password) {
        throw new Error('Email and password are required');
      }

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.error('❌ Signin error:', signInError);
        throw new Error(signInError.message);
      }

      if (!authData.user) {
        throw new Error('Login failed. User not found.');
      }

      console.log('✅ Auth successful, user ID:', authData.user.id);

      // Fetch profile
      console.log('🔍 Fetching user profile...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch warning:', profileError.message);
      } else {
        console.log('✅ Profile fetched:', profileData);
      }

      return {
        success: true,
        user: authData.user,
        profile: profileData || null,
        session: authData.session,
      };
    } catch (error) {
      console.error('❌ Signin error:', error.message);
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.',
      };
    }
  },
};