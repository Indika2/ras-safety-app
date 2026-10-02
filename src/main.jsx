import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://erbulwjhmkqngeqbkyot.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnVsd2pobWtxbmdlcWJreW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTU0OTUsImV4cCI6MjEwNjUzMTQ5NX0.AygQZOelYRQFa9Hs3kOGXQ24D0gitjdDcfIpQThfybA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
