import { useState, useEffect } from 'react'
import headerLogo from './assets/page_header.svg'
import './App.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://erbulwjhmkqngeqbkyot.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnVsd2pobWtxbmdlcWJreW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTU0OTUsImV4cCI6MjEwNjUzMTQ5NX0.AygQZOelYRQFa9Hs3kOGXQ24D0gitjdDcfIpQThfybA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Placeholder views for Framer and Admin
export function FramerDashboard({ profile, onLogout }) {
    const [activeTab, setActiveTab] = useState('new') // 'new' or 'list'
    const [sites, setSites] = useState([])
    const [mySubmissions, setMySubmissions] = useState([])
    const [loadingSites, setLoadingSites] = useState(true)

    // Form state
    const [selectedSite, setSelectedSite] = useState('')
    const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0])
    const [ppeChecked, setPpeChecked] = useState(false)
    const [fallProtectionChecked, setFallProtectionChecked] = useState(false)
    const [laddersInspected, setLaddersInspected] = useState(false)
    const [toolsOk, setToolsOk] = useState(false)
    const [notes, setNotes] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

    // Fetch active sites on mount
    useEffect(() => {
        fetchSites()
    }, [])

    // Fetch user's submissions when switching to 'list' tab
    useEffect(() => {
        if (activeTab === 'list') {
            fetchMySubmissions()
        }
    }, [activeTab])

    const fetchSites = async () => {
        setLoadingSites(true)
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('name', { ascending: true })

        if (error) {
            console.error('Error loading sites:', error.message)
        } else {
            setSites(data || [])
            if (data && data.length > 0) setSelectedSite(data[0].id)
        }
        setLoadingSites(false)
    }

    const fetchMySubmissions = async () => {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                id,
                submission_date,
                ppe_checked,
                fall_protection_checked,
                ladders_inspected,
                tools_ok,
                notes,
                created_at,
                sites ( name ),
                photos ( photo_url )
            `)
            .eq('framer_id', profile.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching submissions:', error.message)
        } else {
            setMySubmissions(data || [])
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // File validation (type and max size 5MB)
        if (!file.type.startsWith('image/')) {
            setStatusMessage({ type: 'error', text: 'Please upload a valid image file.' })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setStatusMessage({ type: 'error', text: 'File size must be less than 5MB.' })
            return
        }
        setSelectedFile(file)
        setStatusMessage({ type: '', text: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setStatusMessage({ type: '', text: '' })

        try {
            let uploadedPhotoUrl = ''

            // 1. Upload photo if selected
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${profile.id}/${Date.now()}.${fileExt}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('safety-photos')
                    .upload(fileName, selectedFile)

                if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

                const { data: publicUrlData } = supabase.storage
                    .from('safety-photos')
                    .getPublicUrl(fileName)

                uploadedPhotoUrl = publicUrlData.publicUrl
            }

            // 2. Insert Safety Form Submission
            const { data: submission, error: subError } = await supabase
                .from('submissions')
                .insert([
                    {
                        framer_id: profile.id,
                        site_id: selectedSite,
                        submission_date: submissionDate,
                        ppe_checked: ppeChecked,
                        fall_protection_checked: fallProtectionChecked,
                        ladders_inspected: laddersInspected,
                        tools_ok: toolsOk,
                        notes: notes,
                    },
                ])
                .select()
                .single()

            if (subError) throw new Error(`Submission failed: ${subError.message}`)

            // 3. Store Photo Reference in database if uploaded
            if (uploadedPhotoUrl && submission) {
                const { error: photoError } = await supabase
                    .from('photos')
                    .insert([{ submission_id: submission.id, photo_url: uploadedPhotoUrl }])

                if (photoError) console.error('Error linking photo:', photoError.message)
            }

            // Reset Form on Success
            setStatusMessage({ type: 'success', text: 'Safety form submitted successfully!' })
            setPpeChecked(false)
            setFallProtectionChecked(false)
            setLaddersInspected(false)
            setToolsOk(false)
            setNotes('')
            setSelectedFile(null)
            e.target.reset()
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.message })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="dashboard framer-dashboard">
            <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                <h2>Welcome, {profile?.full_name || 'Worker'}</h2>
                <button onClick={onLogout} className="logout-btn">Sign Out</button>
            </header>

            {/* Navigation Links */}
            <nav className="dashboard-nav" style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('new')}
                    style={{
                        padding: '8px 16px',
                        fontWeight: activeTab === 'new' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'new' ? '3px solid #0056b3' : 'none',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    New Daily Submit
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        padding: '8px 16px',
                        fontWeight: activeTab === 'list' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'list' ? '3px solid #0056b3' : 'none',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    List My Daily Safety Submits
                </button>
            </nav>

            {/* TAB 1: New Daily Submit Form */}
            {activeTab === 'new' && (
                <section className="form-section">
                    <h3>Site Safety Form</h3>

                    {statusMessage.text && (
                        <div style={{ padding: '10px', marginBottom: '1rem', color: statusMessage.type === 'error' ? '#721c24' : '#155724', backgroundColor: statusMessage.type === 'error' ? '#f8d7da' : '#d4edda', borderRadius: '4px' }}>
                            {statusMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold' }}>Job Site:</label>
                            {loadingSites ? (
                                <p>Loading active sites...</p>
                            ) : (
                                <select
                                    value={selectedSite}
                                    onChange={(e) => setSelectedSite(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '8px' }}
                                >
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name} {site.location ? `(${site.location})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold' }}>Submission Date:</label>
                            <input
                                type="date"
                                value={submissionDate}
                                onChange={(e) => setSubmissionDate(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <fieldset style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem' }}>
                            <legend style={{ fontWeight: 'bold' }}>Safety Checklist</legend>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={ppeChecked}
                                        onChange={(e) => setPpeChecked(e.target.checked)}
                                    />
                                    PPE worn (Hard hat, high-vis vest, boots, eye protection)
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={fallProtectionChecked}
                                        onChange={(e) => setFallProtectionChecked(e.target.checked)}
                                    />
                                    Fall protection in place and inspected
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={laddersInspected}
                                        onChange={(e) => setLaddersInspected(e.target.checked)}
                                    />
                                    Ladders and scaffolding inspected
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={toolsOk}
                                        onChange={(e) => setToolsOk(e.target.checked)}
                                    />
                                    Power tools & power cords in good condition
                                </label>
                            </div>
                        </fieldset>

                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold' }}>Safety & Hazard Notes:</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Detail any site hazards or daily observations..."
                                rows={3}
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold' }}>Upload Photo:</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || loadingSites}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#0056b3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {submitting ? 'Submitting Form...' : 'Submit Safety Form'}
                        </button>
                    </form>
                </section>
            )}

            {/* TAB 2: List My Daily Safety Submits */}
            {activeTab === 'list' && (
                <section className="submissions-list-section">
                    <h3>My Previous Submissions</h3>
                    {mySubmissions.length === 0 ? (
                        <p>No safety forms submitted yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {mySubmissions.map((sub) => (
                                <div key={sub.id} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '1rem', backgroundColor: '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                        <span>Site: {sub.sites?.name || 'N/A'}</span>
                                        <span>Date: {sub.submission_date}</span>
                                    </div>
                                    <hr style={{ margin: '0.5rem 0' }} />
                                    <ul>
                                        <li>PPE Worn: {sub.ppe_checked ? 'Yes' : 'No'}</li>
                                        <li>Fall Protection: {sub.fall_protection_checked ? 'Yes' : 'No'}</li>
                                        <li>Ladders/Scaffolding Inspected: {sub.ladders_inspected ? 'Yes' : 'No'}</li>
                                        <li>Tools Condition OK: {sub.tools_ok ? 'Yes' : 'No'}</li>
                                    </ul>
                                    {sub.notes && <p><strong>Notes:</strong> {sub.notes}</p>}
                                    {sub.photos && sub.photos.length > 0 && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <strong>Attached Photo:</strong><br />
                                            <img
                                                src={sub.photos[0].photo_url}
                                                alt="Safety submission"
                                                style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
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