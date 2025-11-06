// 1. Elementos do DOM
const loginForm = document.getElementById('login-form');
const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

// ======== NOVO: Usuários de Teste (Login "no código") ========
// Senha "123456" para todos, como na sua imagem
const USUARIOS_TESTE = {
    "11122233344": { senha: "123456", nome: "Admin" },
    "22233344455": { senha: "123456", nome: "Gestor" },
    "33344455566": { senha: "123456", nome: "Funcionário" }
};
// ==========================================================

// 2. Verificação de Sessão
// Se o usuário já estiver logado (no sessionStorage), redireciona
if (sessionStorage.getItem('usuarioLogado') === 'true') {
    window.location.href = 'index.html';
}

// 3. Event Listener do Formulário
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    const cpf = cpfInput.value.trim();
    const senha = senhaInput.value.trim();

    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';
    errorMessage.textContent = '';

    // Verifica se o CPF existe e se a senha bate
    if (USUARIOS_TESTE[cpf] && USUARIOS_TESTE[cpf].senha === senha) {
        // Sucesso! Armazena na sessão do navegador
        sessionStorage.setItem('usuarioLogado', 'true');
        sessionStorage.setItem('usuarioNome', USUARIOS_TESTE[cpf].nome);
        
        // Redireciona para o dashboard
        window.location.href = 'index.html';
        
    } else {
        // Erro
        errorMessage.textContent = 'CPF ou Senha inválidos. Tente novamente.';
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    }
});