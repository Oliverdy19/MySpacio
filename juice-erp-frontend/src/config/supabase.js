import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Registrar WebSocket globalmente para que Supabase Realtime funcione en Node.js
globalThis.WebSocket = WebSocket;

const supabaseUrl = 'https://lfushktvbhzrxinafymp.supabase.co'; 
const supabaseAnonKey = 'sb_publishable__gd_XM17RdsWX1m91h0UNA_LsrvIv_R';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);