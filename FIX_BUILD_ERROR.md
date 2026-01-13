# How to Fix the Build Error

The error `Module not found: Can't resolve '@supabase/auth-helpers-nextjs'` is happening because a required package is not installed in your project.

## Solution

Please run the following command in your project's terminal to install the missing package:

```bash
npm install @supabase/auth-helpers-nextjs
```

After the installation is complete, restart your development server (`npm run dev`). The error should now be gone.
