import { useState, useEffect } from 'react'
import headerLogo from './assets/page_header.svg'
import './App.css'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://erbulwjhmkqngeqbkyot.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnVsd2pobWtxbmdlcWJreW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTU0OTUsImV4cCI6MjEwNjUzMTQ5NX0.AygQZOelYRQFa9Hs3kOGXQ24D0gitjdDcfIpQThfybA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Placeholder views for Framer and Admin
function FramerDashboard({ profile, onLogout }) {
    return (
        <div className="dashboard">
            <h2>Welcome Framer, {profile?.full_name || 'Worker'}</h2>
            <p>Fill out your daily site safety form below.</p>
            {/* Insert Safety Form Component Here */}
            <button onClick={onLogout}>Sign Out</button>
        </div>
    )
}

function AdminDashboard({ profile, onLogout }) {
    return (
        <div className="dashboard">
            <h2>Admin Dashboard - Welcome, {profile?.full_name || 'Admin'}</h2>
            <p>Review site safety form submissions across all sites.</p>
            {/* Insert Admin Submissions Table Component Here */}
            <button onClick={onLogout}>Sign Out</button>
        </div>
    )
}

function App() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Fetch profile details from the database using user UUID
    const fetchUserProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error.message)
            return null
        }
        return data
    }

    useEffect(() => {
        // 1. Check existing session on component mount
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                const userProfile = await fetchUserProfile(session.user.id)
                setProfile(userProfile)
            }
            setLoading(false)
        })

        // 2. Listen for auth changes (login, logout, sign up)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            if (session?.user) {
                const userProfile = await fetchUserProfile(session.user.id)
                setProfile(userProfile)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setErrorMessage(error.message)
            setLoading(false)
        } else if (data.user) {
            const userProfile = await fetchUserProfile(data.user.id)
            setProfile(userProfile)
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
    }

    // Verify loading status
    if (loading) {
        return <div className="app-container"><p>Loading application...</p></div>
    }

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

            <main className="main-content">
                {!session ? (
                    /* Show Login Form if not authenticated */
                    <form onSubmit={handleLogin} className="login-form">
                        <h2>Login</h2>
                        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

                        <div className="form-group">
                            <label htmlFor="email">Email </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                ) : profile?.role === 'Admin' ? (
                    /* Render Admin Page */
                    <AdminDashboard profile={profile} onLogout={handleLogout} />
                ) : (
                    /* Render Framer Page (Default) */
                    <FramerDashboard profile={profile} onLogout={handleLogout} />
                )}
            </main>
        </div>
    )
}

export default App