import { createClient } from "@supabase/supabase-js"
import {
  type Database,
  type Enums,
  type Tables,
  type TablesInsert,
  type TablesUpdate,
} from "@/types/supabase.types"

export type { Database, Enums, Tables, TablesInsert, TablesUpdate }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
