import { useState } from 'react'
import headerLogo from './assets/page_header.svg'
import './App.css'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://erbulwjhmkqngeqbkyot.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnVsd2pobWtxbmdlcWJreW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTU0OTUsImV4cCI6MjEwNjUzMTQ5NX0.AygQZOelYRQFa9Hs3kOGXQ24D0gitjdDcfIpQThfybA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    
    /*
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevents page refresh on form submit

        const { data, error } = await supabase.auth.signInWithPassword({
            // Uses state variables directly, or email/password depending on your Supabase config
            email: username,
            password,
        });

        if (error) console.error('Login error:', error.message);
        else console.log('Logged in user:', data.user);
    };
*/

    const handleSubmit = async (e) => {
        e.preventDefault();
        var email = 'farmer2@yahoo.ca';
        var password = 'examplepw';
        var fullName = 'farmer Doe';
        var role = 'Farmer';

        const signUpUser = async (email, password, fullName, role) => {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            });

            return { data, error };
        };

        // Execute the function and capture the output
        const { data, error } = await signUpUser(email, password, fullName, role);

        if (error) {
            console.error('Sign up error:', error.message);
        } else {
            console.log('User registered and profile automatically created:', data.user);
        }
    };

    

    return (
        <div className="app-container">
            <header className="app-header">
                <img
                    src={headerLogo}
                    alt="RAS Logo"
                    className="header-logo"
                    style={{ maxWidth: '580px', width: '100%', height: 'auto' }}
                />
            </header>

            <main className="login-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Login</h2>

                    <div className="form-group">
                        <label htmlFor="username">Username </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Sign In
                    </button>
                </form>
            </main>
        </div>
    )
}

export default App