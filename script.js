// 1. Configuração do Cliente Supabase
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error("Erro: Arquivo 'config.js' não foi carregado.");
}
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======== FUNÇÃO DE CORREÇÃO (VERSÃO 9 - GATILHO CORRIGIDO + NOVAS REGRAS) ========
function corrigirStringQuebrada(texto) {
    if (typeof texto !== 'string' || !texto) {
        return texto;
    }

    // ======== CORREÇÃO CRÍTICA DO GATILHO ========
    // Deve ser o caractere '' (Replacement Character), não ' ' (string vazia).
    if (texto.includes('')) { 
        
        // Caso 1: DISTRIBUIÇÃO (Ex: "DISTRIBUIO URBANA")
        if (texto.includes('DISTRIBUI') && texto.includes('URBANA')) {
            return 'DISTRIBUIÇÃO URBANA';
        }
        
        // Caso 2: Ajudante Distribuição (Ex: "Ajudante Distribuio")
        if (texto.includes('Ajudante') && texto.includes('Distribui')) {
            return 'Ajudante Distribuição';
        }
        
        // Caso 3: Operações (Ex: "Analista Operaes")
        if (texto.includes('Analista') && texto.includes('Opera')) {
            return 'Analista Operações';
        }
        
        // Caso 4: Negócios (Ex: "Representante de Negcios II")
        if (texto.includes('Representante') && texto.includes('Neg')) {
            if (texto.includes(' II')) { return 'Representante de Negócios II'; }
            if (texto.includes(' I')) { return 'Representante de Negócios I'; }
            return 'Representante de Negócios'; // Padrão
        }

        // Caso 5: Turno (Ex: "3 TURNO")
        if (texto.includes('3') && texto.includes('TURNO')) {
            return '3º TURNO';
        }

        // ======== NOVAS REGRAS (DA ÚLTIMA IMAGEM) ========
        // Caso 6: Armazém (Ex: "Ajudante De Armazm")
        if (texto.includes('Armaz') && texto.includes('m')) {
            if (texto.includes('Ajudante')) {
                return 'Ajudante De Armazém';
            }
            return 'Armazém'; // Padrão
        }

        // Caso 7: Caminhão (Ex: "Motorista Caminho")
        if (texto.includes('Caminh') && texto.includes('o')) {
            if (texto.includes('Motorista')) {
                return 'Motorista Caminhão';
            }
            return 'Caminhão'; // Padrão
        }
        // =================================================

        // Se tiver '' mas não for um caso conhecido, retorna o original (com o erro)
        return texto;
    }
    
    // Se não houver '', o texto está limpo.
    return texto;
}
// ================================================================

// ======== FUNÇÃO PARA FORMATAR SALÁRIO ========
function formatarSalario(valor) {
    if (!valor) {
        return '';
    }
    const numeroLimpo = String(valor)
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".");
        
    const numero = parseFloat(numeroLimpo);
    if (isNaN(numero)) {
        return valor;
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numero);
}
// =======================================================

// ======== FUNÇÃO PARA FORMATAR CPF (CORRIGIDA) ========
function formatarCPF(cpf) {
    // Se o valor for nulo ou indefinido, retorna vazio.
    if (!cpf) {
        return '';
    }

    // ======== A CORREÇÃO ESTÁ AQUI ========
    // Converte o CPF (que pode ser um número) para string primeiro
    const cpfString = String(cpf);
    // ======================================
    
    // Remove qualquer caractere que não seja dígito
    const cpfLimpo = cpfString.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfLimpo.length !== 11) {
        return cpfString; // Retorna a string original se não for um CPF válido
    }

    // Aplica a máscara XXX.XXX.XXX-XX
    return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6, 9)}-${cpfLimpo.slice(9, 11)}`;
}
// =======================================================

// ======== FUNÇÃO PARA FORMATAR TEMPO DE EMPRESA (em dias) ========
function formatarTempoDeEmpresa(dias) {
    if (!dias) {
        return '';
    }
    const numDias = parseInt(dias, 10);
    if (isNaN(numDias) || numDias <= 0) {
        return ''; // Retorna vazio se não for um número válido
    }

    // Usamos 365.25 para uma média mais precisa (anos bissextos)
    const anos = Math.floor(numDias / 365.25);
    // 30.44 é a média de dias em um mês (365.25 / 12)
    const meses = Math.floor((numDias % 365.25) / 30.44); 

    let resultado = '';
    if (anos > 0) {
        resultado += `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    }
    if (meses > 0) {
        if (anos > 0) {
            resultado += ' e ';
        }
        resultado += `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    }
    // Caso tenha menos de 1 mês (ex: 15 dias)
    if (anos === 0 && meses === 0 && numDias > 0) {
        return "Menos de 1 mês";
    }
    
    return resultado;
}
// ================================================================


// 2. Elementos HTML (Globais - só declaração)
let dashboardContainer, loadingIndicator, searchBar, filterStatus, filterArea, filterLider, loadMoreButton;
let metaForm, metaAreaSelect, metaValorInput, metaSubmitButton, metaSuccessMessage, reportTableBody;

// ======== NOVO: Variável global para o Gráfico ========
let metaChart = null; 

// Constantes de Paginação
const ITENS_POR_PAGINA = 30;
let currentPage = 0;
const NOME_TABELA_QLP = 'QLP';
const NOME_TABELA_METAS = 'metas_qlp';


// 3. Função Principal de Setup (COM DEBUG)
function setupDashboard() {
    console.log("DEBUG: 1. setupDashboard() EXECUTADO!"); 

    // --- Elementos da "Visão Geral" ---
    dashboardContainer = document.getElementById('dashboard-container');
    loadingIndicator = document.getElementById('loading-indicator');
    searchBar = document.getElementById('search-bar');
    filterStatus = document.getElementById('filter-status');
    filterArea = document.getElementById('filter-area');
    filterLider = document.getElementById('filter-lider');
    loadMoreButton = document.getElementById('load-more-button');
    
    // --- Elementos do "Painel de Gestão" ---
    metaForm = document.getElementById('meta-form');
    metaAreaSelect = document.getElementById('meta-area');
    metaValorInput = document.getElementById('meta-valor');
    metaSubmitButton = document.getElementById('meta-submit-button');
    metaSuccessMessage = document.getElementById('meta-success-message');
    reportTableBody = document.getElementById('report-table-body');
    
    console.log("DEBUG: 2. Elementos do DOM capturados."); 

    // --- Event Listeners dos Filtros (Visão Geral) - COM CHECAGEM ---
    if (searchBar) {
        searchBar.addEventListener('input', carregarColaboradores);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', carregarColaboradores);
    }
    if (filterArea) {
        filterArea.addEventListener('change', carregarColaboradores);
    }
    if (filterLider) {
        filterLider.addEventListener('change', carregarColaboradores);
    }
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', carregarMais);
    }
    
    // --- Event Listeners do Painel de Gestão - COM CHECAGEM ---
    if (metaForm) {
        metaForm.addEventListener('submit', handleMetaSubmit);
    }
    
    // --- Event Listeners da Navegação ---
    setupNavigation();
    console.log("DEBUG: 3. Navegação e Listeners configurados."); 

    // --- Carga Inicial ---
    popularFiltrosDinamicos();
    popularDropdownMetas(); 

    // ======== MODIFICAÇÃO: Restaura a aba ativa ou define o padrão ========
    const activeTab = sessionStorage.getItem('activeTab');

    // Captura os elementos de navegação e conteúdo
    const navVisaoGeral = document.getElementById('nav-visao-geral');
    const navPainelGestao = document.getElementById('nav-painel-gestao');
    const navGraficos = document.getElementById('nav-graficos'); // NOVO
    const contentVisaoGeral = document.getElementById('visao-geral-content');
    const contentGestao = document.getElementById('gestao-content');
    const contentGraficos = document.getElementById('graficos-content'); // NOVO

    if (activeTab === 'gestao') {
        if (contentVisaoGeral) contentVisaoGeral.style.display = 'none';
        if (contentGraficos) contentGraficos.style.display = 'none'; // NOVO
        if (contentGestao) contentGestao.style.display = 'block';
        
        if (navVisaoGeral) navVisaoGeral.classList.remove('active');
        if (navGraficos) navGraficos.classList.remove('active'); // NOVO
        if (navPainelGestao) navPainelGestao.classList.add('active');
        
        carregarRelatorioMetas(); // Carrega o relatório
    
    } else if (activeTab === 'graficos') { // NOVO
        if (contentVisaoGeral) contentVisaoGeral.style.display = 'none';
        if (contentGestao) contentGestao.style.display = 'none';
        if (contentGraficos) contentGraficos.style.display = 'block';
        
        if (navVisaoGeral) navVisaoGeral.classList.remove('active');
        if (navPainelGestao) navPainelGestao.classList.remove('active');
        if (navGraficos) navGraficos.classList.add('active');

        carregarGraficoMetas(); // Carrega o gráfico

    } else {
        // Padrão: Carrega a Visão Geral
        if (contentGestao) contentGestao.style.display = 'none';
        if (contentGraficos) contentGraficos.style.display = 'none';
        carregarColaboradores(); // Carrega os cards
    }
    // ================== FIM DA MODIFICAÇÃO ==================
    
    console.log("DEBUG: 4. Carga inicial de dados disparada."); 
}

// 4. Função de Navegação da Sidebar (ATUALIZADA)
function setupNavigation() {
    const navVisaoGeral = document.getElementById('nav-visao-geral');
    const navPainelGestao = document.getElementById('nav-painel-gestao');
    const navGraficos = document.getElementById('nav-graficos'); // NOVO
    const navSair = document.getElementById('nav-sair');
    
    const contentVisaoGeral = document.getElementById('visao-geral-content');
    const contentGestao = document.getElementById('gestao-content');
    const contentGraficos = document.getElementById('graficos-content'); // NOVO

    if (navVisaoGeral) {
        navVisaoGeral.addEventListener('click', (e) => {
            e.preventDefault();
            contentVisaoGeral.style.display = 'block';
            contentGestao.style.display = 'none';
            contentGraficos.style.display = 'none'; // NOVO
            
            navVisaoGeral.classList.add('active');
            navPainelGestao.classList.remove('active');
            navGraficos.classList.remove('active'); // NOVO
            
            sessionStorage.setItem('activeTab', 'visao-geral'); 
        });
    }

    if (navPainelGestao) {
        navPainelGestao.addEventListener('click', (e) => {
            e.preventDefault();
            contentVisaoGeral.style.display = 'none';
            contentGestao.style.display = 'block';
            contentGraficos.style.display = 'none'; // NOVO

            navVisaoGeral.classList.remove('active');
            navPainelGestao.classList.add('active');
            navGraficos.classList.remove('active'); // NOVO
            
            // Carrega o relatório ao clicar na aba
            carregarRelatorioMetas();
            
            sessionStorage.setItem('activeTab', 'gestao'); 
        });
    }

    // ======== NOVO: Event listener para Gráficos ========
    if (navGraficos) {
        navGraficos.addEventListener('click', (e) => {
            e.preventDefault();
            contentVisaoGeral.style.display = 'none';
            contentGestao.style.display = 'none';
            contentGraficos.style.display = 'block';

            navVisaoGeral.classList.remove('active');
            navPainelGestao.classList.remove('active');
            navGraficos.classList.add('active');
            
            // Carrega o gráfico ao clicar na aba
            carregarGraficoMetas();
            
            sessionStorage.setItem('activeTab', 'graficos'); 
        });
    }

    if (navSair) {
        navSair.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('usuarioNome');
            sessionStorage.removeItem('activeTab'); 
            window.location.href = 'login.html';
        });
    }
}


// 5. Funções da "Visão Geral" (Cards de Colaboradores)
function buildQuery() {
    const searchTerm = searchBar ? searchBar.value.trim() : '';
    const status = filterStatus ? filterStatus.value : '';
    const area = filterArea ? filterArea.value : '';
    const lider = filterLider ? filterLider.value : '';

    let query = supabaseClient.from(NOME_TABELA_QLP).select('*');
    if (searchTerm) {
        query = query.ilike('NOME', `%${searchTerm}%`);
    }
    if (status) {
        if (status === 'AFASTADO') {
            query = query.or('SITUACAO.eq.AFASTADO,SITUACAO.eq.AFASTAMENTO');
        } else if (status === 'DESLIGADOS') {
            query = query.or('SITUACAO.eq.DESLIGADOS,SITUACAO.eq.DESPEDIDA');
        } else {
            query = query.eq('SITUACAO', status);
        }
    }
    if (area) {
        // 'area' aqui é o valor original (quebrado), o que é correto para o filtro
        query = query.eq('ATIVIDADE', area);
    }
    if (lider) {
        query = query.eq('LIDER', lider);
    }
    query = query.order('NOME', { ascending: true });
    return query;
}
async function carregarColaboradores() {
    console.log("DEBUG: 5. carregarColaboradores() chamado..."); 
    currentPage = 0; 
    
    // Verificação de segurança
    if (!loadingIndicator || !dashboardContainer || !loadMoreButton) {
        console.error("DEBUG: Elementos principais (loading, dashboard) são nulos! Verifique o HTML.");
        return;
    }
    
    loadingIndicator.style.display = 'block';
    dashboardContainer.innerHTML = ''; 
    loadMoreButton.style.display = 'none'; 
    loadMoreButton.disabled = false;
    const startIndex = 0;
    const endIndex = ITENS_POR_PAGINA - 1;
    let query = buildQuery();
    const { data, error } = await query.range(startIndex, endIndex);
    
    loadingIndicator.style.display = 'none';
    if (error) {
        console.error('Erro ao buscar dados:', error);
        dashboardContainer.innerHTML = "<p>Erro ao carregar dados. Verifique o console.</p>";
        return;
    }
    if (data.length === 0) {
        dashboardContainer.innerHTML = "<p>Nenhum colaborador encontrado.</p>";
        return;
    }
    let cardsHTML = '';
    data.forEach(colaborador => {
        cardsHTML += criarCardColaborador(colaborador);
    });
    dashboardContainer.innerHTML = cardsHTML;
    if (data.length === ITENS_POR_PAGINA) {
        loadMoreButton.style.display = 'block';
    }
    console.log("DEBUG: 6. Colaboradores carregados e desenhados."); 
}
async function carregarMais() {
    currentPage++;
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = 'Carregando...';
    const startIndex = currentPage * ITENS_POR_PAGINA;
    const endIndex = startIndex + ITENS_POR_PAGINA - 1;
    let query = buildQuery();
    const { data, error } = await query.range(startIndex, endIndex);
    if (error) {
        console.error('Erro ao buscar mais dados:', error);
        loadMoreButton.textContent = 'Erro ao carregar';
        return;
    }
    data.forEach(colaborador => {
        dashboardContainer.innerHTML += criarCardColaborador(colaborador);
    });
    loadMoreButton.disabled = false;
    loadMoreButton.textContent = 'Carregar Mais';
    if (data.length < ITENS_POR_PAGINA) {
        loadMoreButton.style.display = 'none';
    }
}
function criarCardColaborador(colaborador) {
    // MODIFICAÇÃO: Aplicando a função de correção nos campos
    const status = colaborador.SITUACAO || 'Indefinido'; 
    const nome = corrigirStringQuebrada(colaborador.NOME) || '';
    
    // ======== FORMATAÇÃO DE CPF APLICADA ========
    const cpf = formatarCPF(colaborador.CPF); // Removido '|| ""' pois a função já trata isso
    
    const funcao = corrigirStringQuebrada(colaborador['CARGO ATUAL']) || ''; 
    const area = corrigirStringQuebrada(colaborador.ATIVIDADE) || '';
    
    // ======== FORMATAÇÃO DE TEMPO DE EMPRESA APLICADA ========
    const tempoEmpresa = formatarTempoDeEmpresa(colaborador['TEMPO DE EMPRESA']); 
    
    const escolaridade = corrigirStringQuebrada(colaborador.Escolaridade) || ''; 
    const salario = formatarSalario(colaborador.SALARIO); 
    const pcd = colaborador.PCD || 'NÃO'; 
    const telefone = colaborador.CONTATO || ''; 
    const telEmergencia = colaborador['CONT FAMILIAR'] || ''; 
    
    const turno = corrigirStringQuebrada(colaborador.TURNO) || '';
    const lider = corrigirStringQuebrada(colaborador.LIDER) || '';
    const dataPromocao = colaborador.DATA_PROMOCAO || '';
    
    let statusClass = '';
    if (status.toUpperCase() === 'ATIVO') {
        statusClass = 'status-ativo';
    } else if (status.toUpperCase() === 'AFASTADO' || status.toUpperCase() === 'AFASTAMENTO') {
        statusClass = 'status-afastado';
    } else if (status.toUpperCase() === 'DESLIGADOS' || status.toUpperCase() === 'DESPEDIDA') {
        statusClass = 'status-desligados';
    }
    const pcdClass = (pcd.toUpperCase() === 'SIM') ? 'pcd-sim' : 'pcd-nao';
    
    return `
        <div class="employee-card ${statusClass}">
            <div class="card-header">
                <img src="avatar-placeholder.png" alt="Foto de ${nome}">
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

// 6. Funções de População de Filtros (Visão Geral)
async function popularFiltrosDinamicos() {
    if (!filterArea || !filterLider) { 
        console.warn("DEBUG: Dropdowns de filtro não encontrados.");
        return;
    }
    
    const { data, error } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('*'); 

    if (error) {
        console.error('Erro ao buscar dados para filtros:', error);
        return;
    }

    // MODIFICAÇÃO: Lógica de preenchimento dos filtros corrigida
    const areasMap = new Map();
    data.forEach(item => {
        if (item.ATIVIDADE) {
            // Salva o original (quebrado) e o corrigido
            areasMap.set(item.ATIVIDADE, corrigirStringQuebrada(item.ATIVIDADE));
        }
    });
    // Ordena pelos nomes corrigidos
    const sortedAreas = [...areasMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    
    // Limpa opções antigas (exceto a primeira)
    filterArea.innerHTML = '<option value="">Toda Área</option>';
    
    sortedAreas.forEach(([original, corrigido]) => {
        // O 'value' é o original (para o filtro funcionar)
        // O texto (innerHTML) é o corrigido (para o usuário ver)
        filterArea.innerHTML += `<option value="${original}">${corrigido}</option>`;
    });
    
    const lideresMap = new Map();
    data.forEach(item => {
        if (item.LIDER) {
            lideresMap.set(item.LIDER, corrigirStringQuebrada(item.LIDER));
        }
    });
    const sortedLideres = [...lideresMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    
    // Limpa opções antigas (exceto a primeira)
    filterLider.innerHTML = '<option value="">Todo Líder</option>';
    
    sortedLideres.forEach(([original, corrigido]) => {
        filterLider.innerHTML += `<option value="${original}">${corrigido}</option>`;
    });
}


// 7. Funções do "Painel de Gestão"
async function popularDropdownMetas() {
    if (!metaAreaSelect) {
        console.warn("DEBUG: Dropdown de metas não encontrado.");
        return;
    }
    
    const { data, error } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('*');
    
    if (error) {
        console.error('Erro ao buscar áreas para o dropdown de metas:', error);
        return;
    }
    
    // MODIFICAÇÃO: Lógica de preenchimento do dropdown corrigida
    const areasMap = new Map();
    data.forEach(item => {
        if (item.ATIVIDADE) {
            areasMap.set(item.ATIVIDADE, corrigirStringQuebrada(item.ATIVIDADE));
        }
    });
    
    metaAreaSelect.innerHTML = '<option value="">Selecione uma área...</option>';
    
    const sortedAreas = [...areasMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    sortedAreas.forEach(([original, corrigido]) => {
        // O 'value' é o original (quebrado) para salvar no banco
        // O texto (innerHTML) é o corrigido (para o usuário ver)
        metaAreaSelect.innerHTML += `<option value="${original}">${corrigido}</option>`;
    });
}

async function handleMetaSubmit(e) {
    e.preventDefault();
    const areaSelecionada = metaAreaSelect.value; // Isto vai pegar o valor original (quebrado), o que é CORRETO
    const metaValor = metaValorInput.value;
    if (!areaSelecionada || metaValor === '') {
        alert('Por favor, selecione uma área e preencha o valor da meta.');
        return;
    }
    metaSubmitButton.disabled = true;
    metaSubmitButton.textContent = 'Salvando...';
    metaSuccessMessage.style.visibility = 'hidden';
    
    // O upsert usará a string original (ex: 'DISTRIBUIO URBANA')
    // Isso é o correto, pois é como ela está salva no banco
    const { error } = await supabaseClient
        .from(NOME_TABELA_METAS)
        .upsert(
            { area: areaSelecionada, meta: parseInt(metaValor) },
            { onConflict: 'area' } 
        );
    metaSubmitButton.disabled = false;
    metaSubmitButton.textContent = 'Salvar Meta';
    if (error) {
        console.error('Erro ao salvar meta:', error);
        alert('Erro ao salvar a meta. Verifique o console.'); 
    } else {
        metaSuccessMessage.style.visibility = 'visible';
        setTimeout(() => { metaSuccessMessage.style.visibility = 'hidden'; }, 3000);
        metaForm.reset();
        carregarRelatorioMetas(); // Atualiza a tabela
    }
}

async function carregarRelatorioMetas() {
    if (!reportTableBody) {
        console.error("DEBUG: Tabela de relatório (reportTableBody) não encontrada.");
        return;
    }
    reportTableBody.innerHTML = '<tr><td colspan="3">Carregando relatório...</td></tr>';
    
    // Passo 1: Buscar as Metas
    const { data: metasData, error: metasError } = await supabaseClient
        .from(NOME_TABELA_METAS)
        .select('area, meta');
    if (metasError) {
        console.error('Erro ao buscar metas:', metasError);
        reportTableBody.innerHTML = '<tr><td colspan="3">Erro ao carregar metas.</td></tr>';
        return;
    }
    const metasMap = metasData.reduce((acc, item) => {
        acc[item.area] = item.meta; // Chaves aqui estão quebradas (ex: 'DISTRIBUIO URBANA')
        return acc;
    }, {});

    // Passo 2: Buscar o "Real"
    const { data: qlpData, error: qlpError } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('ATIVIDADE, SITUACAO'); 
    if (qlpError) {
        console.error('Erro ao buscar QLP para contagem:', qlpError);
        reportTableBody.innerHTML = '<tr><td colspan="3">Erro ao carregar dados reais.</td></tr>';
        return;
    }
    
    // Filtra apenas colaboradores "ATIVO" (com segurança)
    const ativos = qlpData.filter(col => col.SITUACAO && col.SITUACAO.toUpperCase() === 'ATIVO');
    
    const realCounts = ativos.reduce((acc, { ATIVIDADE }) => {
        if (ATIVIDADE) {
            acc[ATIVIDADE] = (acc[ATIVIDADE] || 0) + 1; // Chaves aqui também estão quebradas
        }
        return acc;
    }, {});

    // Passo 3: Combinar os dados
    // 'todasAreas' terá os nomes quebrados, o que é correto para o join
    const todasAreas = [...new Set([...Object.keys(metasMap), ...Object.keys(realCounts)])].sort();
    
    if (todasAreas.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="3">Nenhum dado de área encontrado.</td></tr>';
        return;
    }
    reportTableBody.innerHTML = ''; 
    todasAreas.forEach(area => {
        const meta = metasMap[area] || 0;
        const real = realCounts[area] || 0;
        
        // MODIFICAÇÃO: Aplicar correção APENAS na exibição do HTML
        const areaCorrigida = corrigirStringQuebrada(area);
        
        const linhaHTML = `
            <tr>
                <td>${areaCorrigida}</td> 
                <td>${meta}</td>
                <td>${real}</td>
            </tr>
        `;
        reportTableBody.innerHTML += linhaHTML;
    });
}


// ======== 8. NOVA FUNÇÃO DE GRÁFICO ========
async function carregarGraficoMetas() {
    console.log("DEBUG: 7. carregarGraficoMetas() chamado...");
    
    // Passo 1: Buscar os dados (igual ao carregarRelatorioMetas)
    const { data: metasData, error: metasError } = await supabaseClient
        .from(NOME_TABELA_METAS)
        .select('area, meta');
    
    if (metasError) {
        console.error('Erro ao buscar metas para gráfico:', metasError);
        return;
    }
    const metasMap = metasData.reduce((acc, item) => {
        acc[item.area] = item.meta;
        return acc;
    }, {});

    const { data: qlpData, error: qlpError } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('ATIVIDADE, SITUACAO'); 
    
    if (qlpError) {
        console.error('Erro ao buscar QLP para gráfico:', qlpError);
        return;
    }
    
    const ativos = qlpData.filter(col => col.SITUACAO && col.SITUACAO.toUpperCase() === 'ATIVO');
    const realCounts = ativos.reduce((acc, { ATIVIDADE }) => {
        if (ATIVIDADE) {
            acc[ATIVIDADE] = (acc[ATIVIDADE] || 0) + 1;
        }
        return acc;
    }, {});

    // Passo 2: Preparar os dados para o gráfico
    const todasAreas = [...new Set([...Object.keys(metasMap), ...Object.keys(realCounts)])].sort();
    
    const labels = [];
    const metaData = [];
    const realData = [];
    const gapData = []; // O "Gap" que você pediu

    todasAreas.forEach(area => {
        const meta = metasMap[area] || 0;
        const real = realCounts[area] || 0;
        
        // Calcula o Gap: quantos faltam (Meta - Real)
        // Usamos Math.max(0, ...) para que o Gap nunca seja negativo
        // Se o Real for 10 e a Meta 8, o Gap de "faltantes" é 0, não -2.
        const gap = Math.max(0, meta - real); 

        labels.push(corrigirStringQuebrada(area));
        metaData.push(meta);
        realData.push(real);
        gapData.push(gap);
    });

    // Passo 3: Desenhar o Gráfico
    const ctx = document.getElementById('grafico-metas-qlp').getContext('2d');
    
    // Destrói o gráfico antigo, se existir, para evitar sobreposição
    if (metaChart) {
        metaChart.destroy();
    }

    metaChart = new Chart(ctx, {
        type: 'bar', // Tipo de gráfico: Barras
        data: {
            labels: labels, // Nomes das Áreas no eixo X
            datasets: [
                {
                    label: 'Meta',
                    data: metaData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)', // Azul
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Real',
                    data: realData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)', // Verde
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Gap (Faltantes)',
                    data: gapData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)', // Vermelho
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top', // Legenda no topo
                },
                title: {
                    display: false, // Já temos um título no HTML
                }
            },
            scales: {
                y: {
                    beginAtZero: true, // Eixo Y começa no zero
                    title: {
                        display: true,
                        text: 'Nº de Colaboradores'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Áreas'
                    }
                }
            }
        }
    });
}


// ======== 9. Auth Guard (Proteção da Página com sessionStorage) ========
(function() {
    console.log("DEBUG: Auth Guard INICIADO."); 
    if (sessionStorage.getItem('usuarioLogado') !== 'true') {
        console.log("DEBUG: Usuário NÃO logado. Redirecionando para login.html");
        window.location.href = 'login.html';
    } else {
        console.log("DEBUG: Usuário LOGADO. Verificando DOM...");
        // Se houver sessão, o usuário está logado.
        if (document.readyState === 'loading') {
            console.log("DEBUG: DOM carregando. Aguardando DOMContentLoaded.");
            document.addEventListener('DOMContentLoaded', setupDashboard);
        } else {
            // DOM já está pronto!
            console.log("DEBUG: DOM pronto. Executando setupDashboard() agora.");
            setupDashboard();
        }
    }
})();