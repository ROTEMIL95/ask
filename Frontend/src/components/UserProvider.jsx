import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/lib/supabase';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { user: loggedInUser, error } = await auth.getCurrentUser();
                if (error) {

                    setUser(null);
                } else {
                    setUser(loggedInUser);
                }
            } catch (e) {

                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading }}>
            {children}
        </UserContext.Provider>
    );
}