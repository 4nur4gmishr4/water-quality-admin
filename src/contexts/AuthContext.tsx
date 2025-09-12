import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  UserCredential 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { supabase, User } from '../config/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateLastLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo credentials for easy access
  const demoCredentials = [
    {
      email: 'admin@waterquality.gov.in',
      password: 'admin123',
      profile: {
        id: 'demo-admin-1',
        firebase_uid: 'demo-admin-1',
        email: 'admin@waterquality.gov.in',
        full_name: 'Dr. Rajesh Kumar',
        role: 'super_admin' as const,
        district: 'Central Delhi',
        state: 'Delhi',
        permissions: ['all'],
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-09-11T00:00:00Z',
        last_login: '2025-09-11T00:00:00Z'
      }
    },
    {
      email: 'demo',
      password: 'demo',
      profile: {
        id: 'demo-admin-2',
        firebase_uid: 'demo-admin-2',
        email: 'demo@waterquality.gov.in',
        full_name: 'Demo Administrator',
        role: 'state_admin' as const,
        district: 'Guwahati',
        state: 'Assam',
        permissions: ['water_quality', 'alerts', 'reports'],
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-09-11T00:00:00Z',
        last_login: '2025-09-11T00:00:00Z'
      }
    }
  ];

  const login = async (email: string, password: string): Promise<UserCredential> => {
    // Check for demo credentials first
    const demoUser = demoCredentials.find(cred => 
      cred.email === email && cred.password === password
    );

    if (demoUser) {
      // Create a mock Firebase user object
      const mockUser = {
        uid: demoUser.profile.firebase_uid,
        email: demoUser.profile.email,
        displayName: demoUser.profile.full_name,
        emailVerified: true
      } as FirebaseUser;

      setCurrentUser(mockUser);
      setUserProfile(demoUser.profile);
      toast.success(`Welcome back, ${demoUser.profile.full_name}!`);
      
      // Return a mock credential object
      return {
        user: mockUser,
        operationType: 'signIn'
      } as UserCredential;
    }

    // Fall back to Firebase authentication for real credentials
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await updateLastLogin();
      toast.success('Successfully logged in!');
      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to log in';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message || 'Failed to log in';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Check if this is a demo user (no actual Firebase user)
      const isDemoUser = currentUser && currentUser.uid.startsWith('demo-');
      
      if (isDemoUser) {
        // For demo users, just clear the state without calling Firebase
        setCurrentUser(null);
        setUserProfile(null);
      } else {
        // For real Firebase users, sign out properly
        await signOut(auth);
        setUserProfile(null);
      }
      
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
      throw error;
    }
  };

  const updateLastLogin = async (): Promise<void> => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('firebase_uid', currentUser.uid);

      if (error) {
        console.error('Error updating last login:', error);
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If user doesn't exist in Supabase, create a basic profile
        if (error.code === 'PGRST116') {
          const newUser = {
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'health_officer' as const,
            state: 'Unknown',
            permissions: ['view_data'],
            is_active: true,
            last_login: new Date().toISOString()
          };

          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            toast.error('Failed to create user profile');
            return;
          }

          setUserProfile(createdUser);
          toast.success('Welcome! Your profile has been created.');
        }
        return;
      }

      if (!data.is_active) {
        toast.error('Your account has been deactivated. Please contact administrator.');
        await logout();
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user && !user.uid.startsWith('demo-')) {
        // Only fetch profile from Supabase for real Firebase users
        await fetchUserProfile(user);
      } else if (!user) {
        setUserProfile(null);
      }
      // For demo users, profile is already set in login function
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    updateLastLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
