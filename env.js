// env.js
// Este arquivo simula um .env para ambiente estático.
// Se estivesse usando git, você adicionaria este arquivo ao .gitignore

const ENV = {
    // Configurações do Supabase
    SUPABASE_URL: 'https://nbaoripzckjnqwpsnxnz.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iYW9yaXB6Y2tqbnF3cHNueG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTc3ODUsImV4cCI6MjA1Nzg5Mzc4NX0.gQvrFh9U34r2w07J9aCCcKfIBJt531zeHVO0_9nRv3g',

    // Usuários de Teste (Login Local)
    USUARIOS_TESTE: {
        "11122233344": { senha: "123456", nome: "Admin" },
        "22233344455": { senha: "123456", nome: "Gestor" },
        "33344455566": { senha: "123456", nome: "Funcionário" }
    }
};