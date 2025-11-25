// config.js
// Verifica se o ENV foi carregado corretamente
if (typeof ENV === 'undefined') {
    console.error("ERRO CRÍTICO: Arquivo 'env.js' não foi carregado! Verifique seus arquivos HTML.");
}
const SUPABASE_CONFIG = {
    url: 'https://nbaoripzckjnqwpsnxnz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYW9yaXB6Y2tqbnF3cHNueG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTc3ODUsImV4cCI6MjA1Nzg5Mzc4NX0.gQvrFh9U34r2w07J9aCCcKfIBJt531zeHVO0_9nRv3g'
};