'use server'
 
import { revalidatePath } from 'next/cache'
 
export async function revalidateLayout() {
  revalidatePath('/', 'layout')
}