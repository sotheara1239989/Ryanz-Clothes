import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { getUserProfile, syncUserProfile, updateUserProfile } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Fetch or sync user document from Firestore
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            profile = await syncUserProfile(user);
          }
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          // Fallback basic profile
          setUserProfile({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Customer',
            email: user.email,
            role: 'customer'
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    // Create initial user document in Firestore
    await syncUserProfile(userCredential.user, { 
      name: displayName || email.split('@')[0],
      role: 'customer'
    });
    return userCredential;
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result;
  };

  const logout = async () => {
    return signOut(auth);
  };

  const updateProfileData = async (data) => {
    if (!currentUser) throw new Error("No authenticated user");
    const updated = await updateUserProfile(currentUser.uid, data);
    setUserProfile(prev => ({ ...prev, ...updated }));
    if (updated.role) {
      setIsAdmin(updated.role === 'admin');
    }
    return updated;
  };

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    login,
    register,
    resetPassword,
    loginWithGoogle,
    logout,
    updateProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
