
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdmin(email: string) {
    console.log(`Checking role for email: ${email}...`)

    // 1. Get User ID from Auth
    // Service role can list users, but simple way is maybe searching?
    // Actually, listUsers is cleaner.
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('Error listing users:', error)
        return
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
        console.error('User not found in Auth!')
        return
    }

    console.log('User Found. ID:', user.id)

    // 2. Check Profile Role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError)
    } else {
        console.log('Profile Data:', profile)
        console.log('Current Role:', profile.role)
        console.log('Is Admin?', profile.role === 'admin')
    }
}

// Replace with your email if needed, or pass as arg
const targetEmail = process.argv[2] || 'leminhhoangtk2000@gmail.com'
checkAdmin(targetEmail)
