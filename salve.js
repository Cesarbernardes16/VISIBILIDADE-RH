// 1. Configuração do Cliente Supabase
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error("Erro: Arquivo 'config.js' não foi carregado.");
}
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======== FUNÇÃO DE CORREÇÃO ATUALIZADA (VERSÃO FINAL) ========
function corrigirStringQuebrada(texto) {
    if (typeof texto !== 'string' || !texto) return texto;

    // 1. Correção do BUG do "S" -> "ÀS" (Apenas S isolado)
    if (texto.includes(' S ')) {
        texto = texto.replace(/ S /g, ' ÀS ');
    }

    // Se tiver caracteres de erro () ou outros padrões quebrados
    // O regex /[\?]/ busca especificamente o losango com interrogação ou interrogação simples
    if (texto.match(/[\?]/)) {  

        // NOVAS CORREÇÕES (Baseadas nos seus exemplos)
        // O ponto (.) no regex funciona como coringa para pegar o  ou qualquer erro

        // COMPETÊNCIAS / SEGURANÇA
        if (texto.match(/COMPET.NCIAS/)) texto = texto.replace(/COMPET.NCIAS/g, 'COMPETÊNCIAS');
        if (texto.match(/SEGURAN.A/)) texto = texto.replace(/SEGURAN.A/g, 'SEGURANÇA');
        
        // CONFIANÇA / NÃO
        if (texto.match(/CONFIAN.A/)) texto = texto.replace(/CONFIAN.A/g, 'CONFIANÇA');
        if (texto.match(/ N.O /)) texto = texto.replace(/ N.O /g, ' NÃO '); // Com espaços para evitar palavras como "DOMINÓ"
        if (texto.match(/^N.O /)) texto = texto.replace(/^N.O /g, 'NÃO ');  // Começo de frase
        if (texto.match(/ N.O$/)) texto = texto.replace(/ N.O$/g, ' NÃO');  // Fim de frase
        
        // ANÁLISE / DECISÕES
        if (texto.match(/AN.LISE/)) texto = texto.replace(/AN.LISE/g, 'ANÁLISE');
        if (texto.match(/ANAL.TICA/)) texto = texto.replace(/ANAL.TICA/g, 'ANALÍTICA');
        if (texto.match(/DECIS.ES/)) texto = texto.replace(/DECIS.ES/g, 'DECISÕES');

        // NUMERAÇÃO
        if (texto.match(/3./)) texto = texto.replace(/3./g, '3°');
        if (texto.match(/2./)) texto = texto.replace(/2./g, '2°');
        if (texto.match(/1./)) texto = texto.replace(/1./g, '1°');

        // Correções Anteriores (Mantidas e Reforçadas)
        if (texto.match(/A..O/)) texto = texto.replace(/A..O/g, 'AÇÃO '); 
        if (texto.match(/A[^Z]O/)) texto = texto.replace(/A[^Z]O/g, 'AÇÃO ');

        
        if (texto.match(/GEST..O/)) texto = texto.replace(/GEST..O/g, 'GESTÃO ');
        if (texto.match(/GEST.O/)) texto = texto.replace(/GEST.O/g, 'GESTÃO ');

        if (texto.match(/PRIORIZA..O/)) texto = texto.replace(/PRIORIZA..O/g, 'PRIORIZAÇÃO');
        if (texto.match(/EMP.TICA/)) texto = texto.replace(/EMP.TICA/g, 'EMPÁTICA ');
        if (texto.match(/REUNI.ES/)) texto = texto.replace(/REUNI.ES/g, 'REUNIÕES ');
        if (texto.match(/EMO..ES /)) texto = texto.replace(/EMO..ES /g, 'EMOÇÕES ');
        if (texto.match(/COMUNICA..O/)) texto = texto.replace(/COMUNICA..O/g, 'COMUNICAÇÃO');
        if (texto.match(/Caminh.o/)) texto = texto.replace(/Caminh.o/g, 'Caminhão');
        if (texto.match(/Distribui..o/)) texto = texto.replace(/Distribui..o/g, 'Distribuição');
        
        // Correções de Cargos
        if (texto.includes('DISTRIBUI') && texto.includes('URBANA')) return 'DISTRIBUIÇÃO URBANA';
        if (texto.includes('Analista') && texto.includes('Opera')) return 'Analista Operações';
    }
    
    return texto;
}

// ======== FUNÇÕES DE FORMATAÇÃO ========
function formatarSalario(valor) {
    if (!valor) return '';
    const numeroLimpo = String(valor).replace("R$", "").replace(/\./g, "").replace(",", ".");
    const numero = parseFloat(numeroLimpo);
    if (isNaN(numero)) return valor;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
}

function formatarCPF(cpf) {
    if (!cpf) return '';
    let c = String(cpf).replace(/[^\d]/g, '');
    if (c.length === 10) c = '0' + c;
    if (c.length !== 11) return cpf;
    return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9, 11)}`;
}

function formatarDataExcel(valor) {
    if (!valor) return '';
    const serial = Number(valor);
    if (isNaN(serial) || serial < 20000) return String(valor);
    try {
        const d = new Date((serial - 25569) * 86400000);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        return d.toLocaleDateString('pt-BR');
    } catch (e) { return String(valor); }
}

function formatarTempoDeEmpresa(dias) {
    if (!dias) return '';
    const n = parseInt(dias, 10);
    if (isNaN(n) || n <= 0) return ''; 
    const a = Math.floor(n / 365.25);
    const m = Math.floor((n % 365.25) / 30.44); 
    let res = '';
    if (a > 0) res += `${a} ${a === 1 ? 'ano' : 'anos'}`;
    if (m > 0) {
        if (a > 0) res += ' e ';
        res += `${m} ${m === 1 ? 'mês' : 'meses'}`;
    }
    return (a === 0 && m === 0) ? "Menos de 1 mês" : res;
}

// 2. Variáveis Globais
let dashboardContainer, loadingIndicator, searchBar, filterStatus, filterArea, filterLider, loadMoreButton;
let metaForm, metaAreaSelect, metaValorInput, metaPCDInput, metaJovemInput, metaSubmitButton, metaSuccessMessage;
let filterClassificacao; 
let reportTableBodyQLP, reportTableBodyPCD, reportTableBodyJovem;
let metaChartQLP = null, metaChartPCD = null, metaChartJovem = null;
const ITENS_POR_PAGINA = 30;
let currentPage = 0;
let listaColaboradoresGlobal = []; 
const NOME_TABELA_QLP = 'QLP';
const NOME_TABELA_METAS = 'metas_qlp';

// 3. Setup Dashboard
function setupDashboard() {
    dashboardContainer = document.getElementById('dashboard-container');
    loadingIndicator = document.getElementById('loading-indicator');
    searchBar = document.getElementById('search-bar');
    filterStatus = document.getElementById('filter-status');
    filterArea = document.getElementById('filter-area');
    filterLider = document.getElementById('filter-lider');
    loadMoreButton = document.getElementById('load-more-button');
    filterClassificacao = document.getElementById('filter-classificacao');
    
    metaForm = document.getElementById('meta-form');
    metaAreaSelect = document.getElementById('meta-area');
    metaValorInput = document.getElementById('meta-valor');
    metaPCDInput = document.getElementById('meta-pcd-valor'); 
    metaJovemInput = document.getElementById('meta-jovem-valor'); 
    metaSubmitButton = document.getElementById('meta-submit-button');
    metaSuccessMessage = document.getElementById('meta-success-message');

    reportTableBodyQLP = document.getElementById('report-table-body-qlp');
    reportTableBodyPCD = document.getElementById('report-table-body-pcd');
    reportTableBodyJovem = document.getElementById('report-table-body-jovem');

    if (searchBar) searchBar.addEventListener('input', carregarColaboradores);
    if (filterStatus) filterStatus.addEventListener('change', carregarColaboradores);
    if (filterArea) filterArea.addEventListener('change', carregarColaboradores);
    if (filterLider) filterLider.addEventListener('change', carregarColaboradores);
    if (loadMoreButton) loadMoreButton.addEventListener('click', carregarMais);
    if (filterClassificacao) filterClassificacao.addEventListener('change', carregarColaboradores);
    if (metaForm) metaForm.addEventListener('submit', handleMetaSubmit);
    
    setupNavigation();
    popularFiltrosDinamicos();
    popularDropdownMetas(); 
    restaurarAbaAtiva();
}

function restaurarAbaAtiva() {
    const activeTab = sessionStorage.getItem('activeTab');
    const contentVisaoGeral = document.getElementById('visao-geral-content');
    const contentGestao = document.getElementById('gestao-content');
    const contentGraficos = document.getElementById('graficos-content');
    const navVisaoGeral = document.getElementById('nav-visao-geral');
    const navPainelGestao = document.getElementById('nav-painel-gestao');
    const navGraficos = document.getElementById('nav-graficos');

    if (activeTab === 'gestao') {
        if(contentVisaoGeral) contentVisaoGeral.style.display = 'none';
        if(contentGraficos) contentGraficos.style.display = 'none';
        if(contentGestao) contentGestao.style.display = 'block';
        if(navVisaoGeral) navVisaoGeral.classList.remove('active');
        if(navGraficos) navGraficos.classList.remove('active');
        if(navPainelGestao) navPainelGestao.classList.add('active');
        carregarRelatorioMetas();
    } else if (activeTab === 'graficos') {
        if(contentVisaoGeral) contentVisaoGeral.style.display = 'none';
        if(contentGestao) contentGestao.style.display = 'none';
        if(contentGraficos) contentGraficos.style.display = 'block';
        if(navVisaoGeral) navVisaoGeral.classList.remove('active');
        if(navPainelGestao) navPainelGestao.classList.remove('active');
        if(navGraficos) navGraficos.classList.add('active');
        carregarGraficoQLP();
        carregarGraficoPCD();
        carregarGraficoJovemAprendiz();
    } else {
        if(contentGestao) contentGestao.style.display = 'none';
        if(contentGraficos) contentGraficos.style.display = 'none';
        carregarColaboradores();
    }
}

// 4. Navegação
function setupNavigation() {
    const navVisaoGeral = document.getElementById('nav-visao-geral');
    const navPainelGestao = document.getElementById('nav-painel-gestao');
    const navGraficos = document.getElementById('nav-graficos');
    const navSair = document.getElementById('nav-sair');
    
    if (navVisaoGeral) navVisaoGeral.addEventListener('click', (e) => {
        trocarAba(e, 'visao-geral');
    });
    if (navPainelGestao) navPainelGestao.addEventListener('click', (e) => {
        trocarAba(e, 'gestao');
        carregarRelatorioMetas();
    });
    if (navGraficos) navGraficos.addEventListener('click', (e) => {
        trocarAba(e, 'graficos');
        carregarGraficoQLP();
        carregarGraficoPCD();
        carregarGraficoJovemAprendiz();
    });
    if (navSair) navSair.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
}

function trocarAba(e, aba) {
    e.preventDefault();
    const contents = {
        'visao-geral': document.getElementById('visao-geral-content'),
        'gestao': document.getElementById('gestao-content'),
        'graficos': document.getElementById('graficos-content')
    };
    const navs = {
        'visao-geral': document.getElementById('nav-visao-geral'),
        'gestao': document.getElementById('nav-painel-gestao'),
        'graficos': document.getElementById('nav-graficos')
    };
    
    for (let key in contents) {
        if (contents[key]) contents[key].style.display = (key === aba) ? 'block' : 'none';
        if (navs[key]) {
            if (key === aba) navs[key].classList.add('active');
            else navs[key].classList.remove('active');
        }
    }
    sessionStorage.setItem('activeTab', aba);
}

// 5. Visão Geral (Cards)
function buildQuery() {
    const searchTerm = searchBar ? searchBar.value.trim() : '';
    const status = filterStatus ? filterStatus.value : '';
    const area = filterArea ? filterArea.value : '';
    const lider = filterLider ? filterLider.value : '';
    const classificacao = filterClassificacao ? filterClassificacao.value : '';

    let query = supabaseClient.from(NOME_TABELA_QLP).select('*');
    if (searchTerm) query = query.ilike('NOME', `%${searchTerm}%`);
    if (status) {
        if (status === 'AFASTADO') query = query.or('SITUACAO.eq.AFASTADO,SITUACAO.eq.AFASTAMENTO');
        else if (status === 'DESLIGADOS') query = query.or('SITUACAO.eq.DESLIGADOS,SITUACAO.eq.DESPEDIDA');
        else query = query.eq('SITUACAO', status);
    }
    if (area) query = query.eq('ATIVIDADE', area);
    if (lider) query = query.eq('LIDER', lider);
    if (classificacao) query = query.eq('CLASSIFICACAO', classificacao);
    
    query = query.order('NOME', { ascending: true });
    return query;
}

async function carregarColaboradores() {
    currentPage = 0; 
    if (!loadingIndicator || !dashboardContainer || !loadMoreButton) return;
    loadingIndicator.style.display = 'block';
    dashboardContainer.innerHTML = ''; 
    listaColaboradoresGlobal = []; 
    loadMoreButton.style.display = 'none'; 
    
    const { data, error } = await buildQuery().range(0, ITENS_POR_PAGINA - 1);
    
    loadingIndicator.style.display = 'none';
    if (error || !data || data.length === 0) {
        dashboardContainer.innerHTML = error ? "<p>Erro ao carregar.</p>" : "<p>Nenhum colaborador encontrado.</p>";
        return;
    }
    
    data.forEach(colaborador => {
        const index = listaColaboradoresGlobal.push(colaborador) - 1;
        dashboardContainer.innerHTML += criarCardColaborador(colaborador, index);
    });
    
    if (data.length === ITENS_POR_PAGINA) loadMoreButton.style.display = 'block';
    loadMoreButton.disabled = false;
}

async function carregarMais() {
    currentPage++;
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = 'Carregando...';
    
    const start = currentPage * ITENS_POR_PAGINA;
    const { data, error } = await buildQuery().range(start, start + ITENS_POR_PAGINA - 1);
    
    if (error) {
        loadMoreButton.textContent = 'Erro';
        return;
    }
    
    data.forEach(colaborador => {
        const index = listaColaboradoresGlobal.push(colaborador) - 1;
        dashboardContainer.innerHTML += criarCardColaborador(colaborador, index);
    });
    
    loadMoreButton.disabled = false;
    loadMoreButton.textContent = 'Carregar Mais';
    if (data.length < ITENS_POR_PAGINA) loadMoreButton.style.display = 'none';
}

function criarCardColaborador(colaborador, index) {
    const status = colaborador.SITUACAO || 'Indefinido'; 
    const nome = corrigirStringQuebrada(colaborador.NOME) || '';
    const cpf = formatarCPF(colaborador.CPF); 
    const funcao = corrigirStringQuebrada(colaborador['CARGO ATUAL']) || ''; 
    const area = corrigirStringQuebrada(colaborador.ATIVIDADE) || '';
    const tempoEmpresa = formatarTempoDeEmpresa(colaborador['TEMPO DE EMPRESA']); 
    const escolaridade = corrigirStringQuebrada(colaborador.ESCOLARIDADE) || ''; 
    const salario = formatarSalario(colaborador.SALARIO); 
    const pcd = colaborador.PCD || 'NÃO'; 
    const telefone = colaborador.CONTATO || ''; 
    const telEmergencia = colaborador['CONT FAMILIAR'] || ''; 
    const turno = corrigirStringQuebrada(colaborador.TURNO) || '';
    const lider = corrigirStringQuebrada(colaborador.LIDER) || '';
    const ultimaFuncao = corrigirStringQuebrada(colaborador.CARGO_ANTIGO) || '';
    const dataPromocao = formatarDataExcel(colaborador['DATA DA PROMOCAO']);
    const classificacao = colaborador.CLASSIFICACAO || 'SEM';

    let classificacaoClass = 'classificacao-sem';
    if (classificacao) {
        const c = classificacao.toUpperCase();
        if (c === 'DESLIGAR') classificacaoClass = 'classificacao-desligar';
        else if (c === 'RECUPERAR') classificacaoClass = 'classificacao-recuperar';
        else if (c === 'BOM') classificacaoClass = 'classificacao-bom';
        else if (c === 'MUITO BOM') classificacaoClass = 'classificacao-muito-bom';
        else if (c === 'PREPARAR') classificacaoClass = 'classificacao-preparar';
    }
    
    let statusClass = '';
    if (status.toUpperCase() === 'ATIVO') statusClass = 'status-ativo';
    else if (status.toUpperCase().includes('AFASTADO')) statusClass = 'status-afastado';
    else if (status.toUpperCase().includes('DESLIGADO')) statusClass = 'status-desligados';

    const pcdClass = (pcd.toUpperCase() === 'SIM') ? 'pcd-sim' : 'pcd-nao';
    
    // RETORNA CARD COMPLETO
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
                <p><strong>ULTIMA FUNÇÃO:</strong> <span>${ultimaFuncao}</span></p>
                <p><strong>DATA ULTIMA PROMOÇÃO:</strong> <span>${dataPromocao}</span></p>
                <p><strong>CLASSIFICAÇÃO CICLO DE GENTE:</strong> <span class="classificacao-badge ${classificacaoClass}">${classificacao}</span></p>
                <p><strong>HISTORICO DE ADVERTENCIAS:</strong> <span></span></p>
                <p><strong>HISTORICO DE SUSPENSÃO:</strong> <span></span></p>
                <p><strong>BANCO DE HORAS TOTAL:</strong> <span></span></p>
                <p><strong>QTD INTERJORNADA:</strong> <span></span></p>
                <p><strong>QTD INTRAJORNADA:</strong> <span></span></p>
                <p><strong>PROGRAMAÇÃO FÉRIAS:</strong> <span></span></p>
            </div>
            <div class="card-footer" onclick="abrirModalDetalhes(${index})">
                <span class="material-icons-outlined expand-icon">keyboard_arrow_down</span>
            </div>
        </div>
    `;
}

// 6 a 10. Funções Auxiliares (Filtros, Metas, Gráficos)
async function popularFiltrosDinamicos() {
    if (!filterArea) return;
    const { data } = await supabaseClient.from(NOME_TABELA_QLP).select('ATIVIDADE, LIDER, CLASSIFICACAO');
    if (!data) return;

    const areas = [...new Set(data.map(d => d.ATIVIDADE).filter(Boolean))].sort();
    const lideres = [...new Set(data.map(d => d.LIDER).filter(Boolean))].sort();
    const classif = [...new Set(data.map(d => d.CLASSIFICACAO).filter(Boolean))].sort();

    filterArea.innerHTML = '<option value="">Toda Área</option>' + areas.map(a => `<option value="${a}">${corrigirStringQuebrada(a)}</option>`).join('');
    filterLider.innerHTML = '<option value="">Todo Líder</option>' + lideres.map(l => `<option value="${l}">${corrigirStringQuebrada(l)}</option>`).join('');
    filterClassificacao.innerHTML = '<option value="">Toda Classificação</option>' + classif.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function popularDropdownMetas() {
    if (!metaAreaSelect) return;
    const { data } = await supabaseClient.from(NOME_TABELA_QLP).select('ATIVIDADE');
    if (!data) return;
    const areas = [...new Set(data.map(d => d.ATIVIDADE).filter(Boolean))].sort();
    metaAreaSelect.innerHTML = '<option value="">Selecione...</option>' + areas.map(a => `<option value="${a}">${corrigirStringQuebrada(a)}</option>`).join('');
}

async function handleMetaSubmit(e) {
    e.preventDefault();
    metaSubmitButton.disabled = true;
    const { error } = await supabaseClient.from(NOME_TABELA_METAS).upsert({ 
        area: metaAreaSelect.value, 
        meta: metaValorInput.value || null,
        meta_pcd: metaPCDInput.value || null,
        meta_jovem: metaJovemInput.value || null
    }, { onConflict: 'area' });
    metaSubmitButton.disabled = false;
    if (!error) {
        metaSuccessMessage.style.visibility = 'visible';
        setTimeout(() => metaSuccessMessage.style.visibility = 'hidden', 3000);
        metaForm.reset();
        carregarRelatorioMetas();
    } else alert('Erro ao salvar.');
}

async function fetchProcessedData() {
    const { data: metas } = await supabaseClient.from(NOME_TABELA_METAS).select('*');
    const { data: qlp } = await supabaseClient.from(NOME_TABELA_QLP).select('ATIVIDADE, SITUACAO, PCD, "CARGO ATUAL"');
    if (!qlp) return { error: true };
    const metasMap = (metas || []).reduce((acc, m) => ({...acc, [m.area]: m}), {});
    const areas = [...new Set([...qlp.map(d => d.ATIVIDADE).filter(Boolean), ...Object.keys(metasMap)])].sort();
    const realMap = {};
    const ativos = qlp.filter(c => c.SITUACAO && c.SITUACAO.toUpperCase() === 'ATIVO');
    areas.forEach(a => realMap[a] = { qlp: 0, pcd: 0, jovem: 0 });
    ativos.forEach(c => {
        if (realMap[c.ATIVIDADE]) {
            realMap[c.ATIVIDADE].qlp++;
            if (c.PCD === 'SIM') realMap[c.ATIVIDADE].pcd++;
            if ((c['CARGO ATUAL']||'').includes('JOVEM APRENDIZ')) realMap[c.ATIVIDADE].jovem++;
        }
    });
    return { areas, metasMap, realMap, totalAtivos: ativos.length, error: null };
}

async function carregarRelatorioMetas() {
    if (!reportTableBodyQLP) return;
    reportTableBodyQLP.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
    const { areas, metasMap, realMap, totalAtivos, error } = await fetchProcessedData();
    if (error) return;
    document.getElementById('quota-pcd-value').textContent = Math.ceil(totalAtivos * (totalAtivos > 1000 ? 0.05 : 0.02));
    document.getElementById('quota-jovem-value').textContent = Math.ceil(totalAtivos * 0.05);
    let htmlQLP = '', htmlPCD = '', htmlJovem = '';
    areas.forEach(a => {
        const m = metasMap[a] || {};
        const r = realMap[a];
        const nome = corrigirStringQuebrada(a);
        htmlQLP += `<tr><td>${nome}</td><td>${m.meta||0}</td><td>${r.qlp}</td></tr>`;
        if (m.meta_pcd || r.pcd) htmlPCD += `<tr><td>${nome}</td><td>${m.meta_pcd||0}</td><td>${r.pcd}</td></tr>`;
        if (m.meta_jovem || r.jovem) htmlJovem += `<tr><td>${nome}</td><td>${m.meta_jovem||0}</td><td>${r.jovem}</td></tr>`;
    });
    reportTableBodyQLP.innerHTML = htmlQLP;
    reportTableBodyPCD.innerHTML = htmlPCD || '<tr><td colspan="3">Vazio</td></tr>';
    reportTableBodyJovem.innerHTML = htmlJovem || '<tr><td colspan="3">Vazio</td></tr>';
}

async function carregarGraficoQLP() {
    const { areas, metasMap, realMap, error } = await fetchProcessedData();
    if (error) return;
    renderChart('grafico-metas-qlp', areas, metasMap, realMap, 'meta', 'qlp', 'Colaboradores', metaChartQLP);
}
async function carregarGraficoPCD() {
    const { areas, metasMap, realMap, error } = await fetchProcessedData();
    if (error) return;
    renderChart('grafico-metas-pcd', areas, metasMap, realMap, 'meta_pcd', 'pcd', 'PCD', metaChartPCD, true);
}
async function carregarGraficoJovemAprendiz() {
    const { areas, metasMap, realMap, error } = await fetchProcessedData();
    if (error) return;
    renderChart('grafico-metas-jovem', areas, metasMap, realMap, 'meta_jovem', 'jovem', 'Jovem', metaChartJovem, true);
}

function renderChart(canvasId, areas, metas, reais, keyMeta, keyReal, label, chartInstance, filterEmpty=false) {
    const labels = [], dMeta = [], dReal = [], dGap = [];
    areas.forEach(a => {
        const m = (metas[a] && metas[a][keyMeta]) || 0;
        const r = reais[a][keyReal];
        if (!filterEmpty || m > 0 || r > 0) {
            labels.push(corrigirStringQuebrada(a));
            dMeta.push(m);
            dReal.push(r);
            dGap.push(Math.max(0, m - r));
        }
    });
    if (labels.length) {
        labels.push('TOTAL');
        dMeta.push(dMeta.reduce((a,b)=>a+b,0));
        dReal.push(dReal.reduce((a,b)=>a+b,0));
        dGap.push(dGap.reduce((a,b)=>a+b,0));
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (chartInstance) chartInstance.destroy();
    
    new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: labels,
            datasets: [
                { label: 'Meta', data: dMeta, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                { label: 'Real', data: dReal, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                { label: 'Gap', data: dGap, backgroundColor: 'rgba(255, 99, 132, 0.6)' }
            ]
        },
        options: {
            responsive: true,
            plugins: { datalabels: { anchor: 'end', align: 'top', formatter: v => v>0?v:'' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// ======== FUNÇÃO NOVA: GERAR HTML DO PDI ========
function gerarHtmlPDI(colab) {
    let html = `
        <div class="pdi-section">
            <h3>Ciclo de Gente - Plano de Desenvolvimento</h3>
            <div class="pdi-container">
    `;
    
    let encontrouAlgum = false;

    // Loop de 1 a 7 para verificar as colunas
    for (let i = 1; i <= 7; i++) {
        const competencia = corrigirStringQuebrada(colab[`COMPETENCIA_${i}`]); // Corrige nome da competência tb
        
        // Se tiver competência preenchida, cria o card
        if (competencia) {
            encontrouAlgum = true;
            const status = colab[`STATUS_${i}`] || 'Pendente';
            const situacao = corrigirStringQuebrada(colab[`SITUACAO_DA_ACAO_${i}`]) || '-';
            const acao = corrigirStringQuebrada(colab[`O_QUE_FAZER_${i}`]) || '-';
            const motivo = corrigirStringQuebrada(colab[`POR_QUE_FAZER_${i}`]) || '-';
            const quem = corrigirStringQuebrada(colab[`QUE_PODE_ME_AJUDAR_${i}`]) || '-';
            const como = corrigirStringQuebrada(colab[`COMO_VOU_FAZER_${i}`]) || '-';
            const dataFim = formatarDataExcel(colab[`DATA_DE_TERMINO_${i}`]);

            html += `
                <div class="pdi-card" data-status="${status.toUpperCase()}">
                    <h4>${i}. ${competencia}</h4>
                    <div class="pdi-details">
                        <div class="pdi-item"><strong>Situação Atual</strong> <span>${situacao}</span></div>
                        <div class="pdi-item"><strong>Ação (O que fazer)</strong> <span>${acao}</span></div>
                        <div class="pdi-item"><strong>Motivo (Por que)</strong> <span>${motivo}</span></div>
                        <div class="pdi-item"><strong>Apoio (Quem ajuda)</strong> <span>${quem}</span></div>
                        <div class="pdi-item"><strong>Método (Como)</strong> <span>${como}</span></div>
                        <div class="pdi-item"><strong>Prazo</strong> <span>${dataFim}</span></div>
                        <div class="pdi-item"><strong>Status</strong> <span>${status}</span></div>
                    </div>
                </div>
            `;
        }
    }

    if (!encontrouAlgum) {
        html += `<p style="color:#666; padding:10px;">Nenhum plano de ação cadastrado para este ciclo.</p>`;
    }

    html += `</div></div>`;
    return html;
}

// ======== FUNÇÃO DO MODAL ATUALIZADA ========
function abrirModalDetalhes(index) {
    const colab = listaColaboradoresGlobal[index];
    if (!colab) return;

    const modal = document.getElementById('modal-detalhes');
    const header = document.getElementById('modal-header');
    const grid = document.getElementById('modal-dados-grid');

    const nome = corrigirStringQuebrada(colab.NOME);
    const status = colab.SITUACAO || '';

    // Cabeçalho do Modal
    header.innerHTML = `
        <img src="avatar-placeholder.png" alt="${nome}">
        <div>
            <h2 style="margin:0; font-size:1.5em;">${nome}</h2>
            <span class="status-badge" style="background-color:rgba(255,255,255,0.2); border:1px solid #fff; margin-top:5px;">${status}</span>
        </div>
    `;

    // Dados Pessoais + PDI
    grid.innerHTML = `
        <div class="modal-item"><strong>CPF</strong> <span>${formatarCPF(colab.CPF)}</span></div>
        <div class="modal-item"><strong>Matrícula</strong> <span>${colab.MATRICULA || '-'}</span></div>
        <div class="modal-item"><strong>Função</strong> <span>${corrigirStringQuebrada(colab['CARGO ATUAL'])}</span></div>
        <div class="modal-item"><strong>Área</strong> <span>${corrigirStringQuebrada(colab.ATIVIDADE)}</span></div>
        <div class="modal-item"><strong>Salário</strong> <span>${formatarSalario(colab.SALARIO)}</span></div>
        <div class="modal-item"><strong>Tempo de Casa</strong> <span>${formatarTempoDeEmpresa(colab['TEMPO DE EMPRESA'])}</span></div>
        <div class="modal-item"><strong>Escolaridade</strong> <span>${corrigirStringQuebrada(colab.ESCOLARIDADE)}</span></div>
        <div class="modal-item"><strong>PCD</strong> <span>${colab.PCD || 'NÃO'}</span></div>
        <div class="modal-item"><strong>Líder</strong> <span>${corrigirStringQuebrada(colab.LIDER)}</span></div>
        <div class="modal-item"><strong>Turno</strong> <span>${corrigirStringQuebrada(colab.TURNO)}</span></div>
        <div class="modal-item"><strong>CLASSIFICAÇÃO CICLO DE GENTE</strong> <span>${colab.CLASSIFICACAO || '-'}</span></div>
        <div class="modal-item"><strong>DATA ULTIMA PROMOÇÃO</strong> <span>${colab.dataPromocao || '-'}</span></div>
        <div class="modal-item" style="grid-column: 1/-1; background:#f9f9f9; padding:10px; border-radius:4px;">    
        ${gerarHtmlPDI(colab)}
    `;

    modal.style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal-detalhes');
    if (event.target == modal) modal.style.display = "none";
};

// 11. Auth Guard
;(function() {
    if (sessionStorage.getItem('usuarioLogado') !== 'true') window.location.href = 'login.html';
    else {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupDashboard);
        else setupDashboard();
    }
})();