import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                // Try to fetch supplemental user data from Firestore (admins, teachers, or students)
                // Note: In a real multi-tenant app, we might check multiple collections or use a custom claim
                let userDoc = await getDoc(doc(db, 'admins', currentUser.uid));
                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, 'teachers', currentUser.uid));
                }
                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, 'students', currentUser.uid));
                }

                setUser(currentUser);
                setUserData(userDoc.exists() ? userDoc.data() : null);
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        userData,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
