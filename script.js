// 1. Configuração do Cliente Supabase
// As chaves agora vêm do objeto 'SUPABASE_CONFIG' (do arquivo config.js)

// Verifica se o objeto SUPABASE_CONFIG foi carregado
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error("Erro: Arquivo 'config.js' não foi carregado ou está vazio.");
    document.getElementById('dashboard-container').innerHTML = 
        "<p>Erro fatal de configuração. Verifique o console.</p>";
}

const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

// Verifica se as chaves foram preenchidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'SEU_URL_SUPABASE') {
     console.error("Erro: Por favor, preencha suas credenciais do Supabase no arquivo 'config.js'.");
     document.getElementById('dashboard-container').innerHTML = 
        "<p>Erro de configuração. Conexão com o banco de dados falhou.</p>";
}

// ---- CORREÇÃO AQUI ----
// 'supabase' (minúsculo) é o objeto global do CDN.
// 'supabaseClient' (nome novo) é o nosso cliente de conexão.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Elemento HTML onde os cards serão inseridos
const dashboardContainer = document.getElementById('dashboard-container');

// 3. Função para carregar e exibir os colaboradores
async function carregarColaboradores() {
    
    // ---- CORREÇÃO AQUI ----
    // Usamos o 'supabaseClient' que acabamos de criar.
    const { data, error } = await supabaseClient
        .from('QLP')
        .select('*');

    if (error) {
        console.error('Erro ao buscar dados:', error);
        dashboardContainer.innerHTML = "<p>Erro ao carregar dados. Verifique o console.</p>";
        return;
    }

    if (data.length === 0) {
        dashboardContainer.innerHTML = "<p>Nenhum colaborador encontrado.</p>";
        return;
    }

    // Limpa o container antes de adicionar novos cards
    dashboardContainer.innerHTML = '';

    // 4. Cria um card para cada colaborador
    data.forEach(colaborador => {
        const cardHTML = criarCardColaborador(colaborador);
        dashboardContainer.innerHTML += cardHTML;
    });
}

// 5. Função para criar o HTML de um único card
function criarCardColaborador(colaborador) {
    
    // ---- Mapeamento dos dados (COM OS NOMES CORRIGIDOS DO PRINT) ----
    const status = colaborador.SITUACAO || 'Indefinido'; // COM TIL
    const nome = colaborador.NOME || '';
    const cpf = colaborador.CPF || '';
    const funcao = colaborador.CARGO_ATUAL || '';
    const area = colaborador.ATIVIDADE || '';
    const tempoEmpresa = colaborador.TEMPO_DE_EMPRESA || '';
    const escolaridade = colaborador.Escolaridade || ''; // COM 'E' MAIÚSCULO
    const salario = colaborador.SALARIO || ''; // COM ACENTO
    const pcd = colaborador.PCD || 'NÃO'; 
    const telefone = colaborador.CONTATO || ''; 
    const telEmergencia = colaborador.CONT_FAMILIAR || '';
    const turno = colaborador.TURNO || '';
    const lider = colaborador.LIDER || '';
    const dataPromocao = colaborador.DATA_PROMOCAO || '';

    // ---- Lógica para Estilos CSS ----
    
    let statusClass = '';
    // Adicionamos os status que vimos no seu print (Afastamento, Despedida)
    if (status.toUpperCase() === 'ATIVO') {
        statusClass = 'status-ativo';
    } else if (status.toUpperCase() === 'AFASTADO' || status.toUpperCase() === 'AFASTAMENTO') {
        statusClass = 'status-afastado';
    } else if (status.toUpperCase() === 'DESLIGADOS' || status.toUpperCase() === 'DESPEDIDA') {
        statusClass = 'status-desligados';
    }

    const pcdClass = (pcd.toUpperCase() === 'SIM') ? 'pcd-sim' : 'pcd-nao';

    // ---- Retorna o HTML do Card ----
    return `
        <div class="employee-card ${statusClass}">
            <div class="card-header">
                <img src="avatar-placeholder.png" alt="Foto">
                <div class="header-info">
                    <h3>${nome}</h3>
                    <span class="status-badge ${statusClass}">${status}</span>
                </div>
            </div>
            <div class="card-body">
                <p><strong>NOME:</strong> <span>${nome}</span></p>
                <p><strong>CPF:</strong> <span>${cpf}</span></p>
                <p><strong>FUNÇÃO ATUAL:</strong> <span>${funcao}</span></p>
                <p><strong>AREA:</strong> <span>${area}</span></p>
                <p><strong>TEMPO DE EMPRESA:</strong> <span>${tempoEmpresa}</span></p>
                <p><strong>ESCOLARIDADE:</strong> <span>${escolaridade}</span></p>
                <p><strong>SALARIO:</strong> <span>${salario}</span></p>
                <p><strong>PCD:</strong> <span class="pcd-badge ${pcdClass}">${pcd}</span></p>
                <p><strong>PLANO DE SAÚDE:</strong> <span></span></p>
                <p><strong>ENDEREÇO COMPLETO:</strong> <span></span></p>
                <p><strong>TELEFONE DO COLABORADOR:</strong> <span>${telefone}</span></p>
                <p><strong>TELEFONE DE EMERGENCIA:</strong> <span>${telEmergencia}</span></p>
                <p><strong>TURNO:</strong> <span>${turno}</span></p>
                <p><strong>LIDER IMEDIATO:</strong> <span>${lider}</span></p>
                <p><strong>ULTIMA FUNÇÃO:</strong> <span></span></p>
                <p><strong>DATA ULTIMA PROMOÇÃO:</strong> <span>${dataPromocao}</span></p>
                <p><strong>CLASSIFICAÇÃO CICLO DE GENTE:</strong> <span></span></p>
                <p><strong>HISTORICO DE ADVERTENCIAS:</strong> <span></span></p>
                <p><strong>HISTORICO DE SUSPENSÃO:</strong> <span></span></p>
                <p><strong>BANCO DE HORAS TOTAL:</strong> <span></span></p>
                <p><strong>QTD INTERJORNADA:</strong> <span></span></p>
                <p><strong>QTD INTRAJORNADA:</strong> <span></span></p>
                <p><strong>PROGRAMAÇÃO FÉRIAS:</strong> <span></span></p>
            </div>
        </div>
    `;
}

// 6. Chama a função principal quando a página carrega
document.addEventListener('DOMContentLoaded', carregarColaboradores);