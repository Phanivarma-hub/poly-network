import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Multi-tenant login: validate college code and find user across collections
    async function login(collegeCode, userId, password) {
        // 1. Resolve college from code
        const collegeQuery = query(collection(db, 'colleges'), where('code', '==', collegeCode.toUpperCase()));
        const collegeSnapshot = await getDocs(collegeQuery);

        if (collegeSnapshot.empty) {
            throw new Error('Invalid College Code');
        }

        const collegeId = collegeSnapshot.docs[0].id;

        // 2. Find user in admins, teachers, or students collection with matching college_id
        let userDoc = null;
        let userRole = null;
        let userEmail = null;

        // Check admins
        const adminQuery = query(
            collection(db, 'admins'),
            where('college_id', '==', collegeId)
        );
        const adminSnapshot = await getDocs(adminQuery);
        for (const doc of adminSnapshot.docs) {
            const data = doc.data();
            if (data.uid === userId || data.email === userId || data.name === userId) {
                userDoc = { id: doc.id, ...data };
                userRole = 'admin';
                userEmail = data.email;
                break;
            }
        }

        // Check teachers
        if (!userDoc) {
            const teacherQuery = query(
                collection(db, 'teachers'),
                where('college_id', '==', collegeId)
            );
            const teacherSnapshot = await getDocs(teacherQuery);
            for (const doc of teacherSnapshot.docs) {
                const data = doc.data();
                if (data.uid === userId || data.email === userId) {
                    userDoc = { id: doc.id, ...data };
                    userRole = 'teacher';
                    userEmail = data.email;
                    break;
                }
            }
        }

        // Check students
        if (!userDoc) {
            const studentQuery = query(
                collection(db, 'students'),
                where('college_id', '==', collegeId)
            );
            const studentSnapshot = await getDocs(studentQuery);
            for (const doc of studentSnapshot.docs) {
                const data = doc.data();
                if (data.pin === userId || data.uid === userId || data.email === userId) {
                    userDoc = { id: doc.id, ...data };
                    userRole = 'student';
                    userEmail = data.email;
                    break;
                }
            }
        }

        if (!userDoc) {
            throw new Error('User not found. Check your User ID and College Code.');
        }

        // 3. Sign in with Firebase Auth using the resolved email
        await signInWithEmailAndPassword(auth, userEmail, password);

        return { userDoc, userRole };
    }

    // Standard Firebase Auth login (for direct email login)
    async function loginWithEmail(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Create new user with Firebase Auth
    async function register(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                // Try to fetch user data from Firestore across all role collections
                let userDoc = null;

                // Check admins
                const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
                if (adminDoc.exists()) {
                    userDoc = { id: adminDoc.id, ...adminDoc.data() };
                }

                // Check teachers
                if (!userDoc) {
                    const teacherDoc = await getDoc(doc(db, 'teachers', currentUser.uid));
                    if (teacherDoc.exists()) {
                        userDoc = { id: teacherDoc.id, ...teacherDoc.data() };
                    }
                }

                // Check students
                if (!userDoc) {
                    const studentDoc = await getDoc(doc(db, 'students', currentUser.uid));
                    if (studentDoc.exists()) {
                        userDoc = { id: studentDoc.id, ...studentDoc.data() };
                    }
                }

                // If not found by UID, search by email
                if (!userDoc) {
                    // Try to find by email in admins
                    const adminQuery = query(collection(db, 'admins'), where('email', '==', currentUser.email));
                    const adminSnapshot = await getDocs(adminQuery);
                    if (!adminSnapshot.empty) {
                        const data = adminSnapshot.docs[0].data();
                        userDoc = { id: adminSnapshot.docs[0].id, ...data };
                    }
                }

                if (!userDoc) {
                    // Try to find by email in teachers
                    const teacherQuery = query(collection(db, 'teachers'), where('email', '==', currentUser.email));
                    const teacherSnapshot = await getDocs(teacherQuery);
                    if (!teacherSnapshot.empty) {
                        const data = teacherSnapshot.docs[0].data();
                        userDoc = { id: teacherSnapshot.docs[0].id, ...data };
                    }
                }

                if (!userDoc) {
                    // Try to find by email in students
                    const studentQuery = query(collection(db, 'students'), where('email', '==', currentUser.email));
                    const studentSnapshot = await getDocs(studentQuery);
                    if (!studentSnapshot.empty) {
                        const data = studentSnapshot.docs[0].data();
                        userDoc = { id: studentSnapshot.docs[0].id, ...data };
                    }
                }

                setUser(currentUser);
                setUserData(userDoc);
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
        loginWithEmail,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
