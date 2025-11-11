import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

/**
 * Validates email format using regex
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password - Password string to validate
 * @returns boolean indicating if password meets requirements
 */
const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Handles user login with email and password
 * @param req - Express request object containing email and password
 * @param res - Express response object
 */
export const login = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Handles user signup with email, password, and full name
 * Creates a new user account in Supabase Auth with proper validation
 * @param req - Express request object containing email, password, and fullName
 * @param res - Express response object
 */
export const signup = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Validation failed: Email and password are required' });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Validation failed: Invalid email format' });
      return;
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'Validation failed: Password must be at least 8 characters' });
      return;
    }

    // Create user in Supabase Auth (password is automatically hashed by Supabase)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    // Handle Supabase errors
    if (error) {
      console.error('Signup error from Supabase:', error);
      
      // Check if user already exists
      if (error.message.toLowerCase().includes('already registered') || 
          error.message.toLowerCase().includes('already exists')) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }
      
      res.status(400).json({ error: error.message });
      return;
    }

    // Check if user was created successfully
    if (!data.user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    // Return success response
    res.status(201).json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
};

/**
 * Handles user logout
 * @param _req - Express request object (unused, but typed as AuthRequest)
 * @param res - Express response object
 */
export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Gets the current user session
 * @param req - Express request object with user data
 * @param res - Express response object
 */
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({ user: req.user });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

/**
 * Initiates Google OAuth authentication
 * @param _req - Express request object (unused)
 * @param res - Express response object
 */
export const googleAuth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ url: data.url });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};
