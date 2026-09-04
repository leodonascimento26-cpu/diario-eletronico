const USUARIO = 'Almada Lima Filho';
const SENHA = 'Almada Filho2026';
const LOGADO_KEY = 'diario_logado_2026';
const ANO_KEY = 'diario_ano_selecionado';
const DIA_KEY = 'diario_dia_selecionado';

const firebaseConfig = {
    apiKey: "AIzaSyBT-wTmA3N1izSfKQd3e2Gv5q_dXF94W-g",
    authDomain: "diario-escola-178a4.firebaseapp.com",
    projectId: "diario-escola-178a4",
    storageBucket: "diario-escola-178a4.firebasestorage.app",
    messagingSenderId: "998584397283",
    appId: "1:998584397283:web:7a8a405df30644a0e4c4d6",
    databaseURL: "https://diario-escola-178a4-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let anoAtual = 6;
let alunos = [];
let chamadaHoje = [];
let chamadaSalva = null;
let dataSelecionada = null;

function mostrarData() {
    const hoje = new Date();
    const dataStr = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('data-hoje').textContent = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
}

function dataParaStr(data) {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, '0');
    const d = String(data.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function strParaData(str) {
    const partes = str.split('-');
    return new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
}

function diasUteisDoAno() {
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dec'];
    const hoje = new Date();
    let html = '';

    for (let m = 0; m < 12; m++) {
        const dataMes = new Date(hoje.getFullYear(), m, 1);
        const nomeMes = meses[m] + '/' + hoje.getFullYear();
        const totalDias = new Date(hoje.getFullYear(), m + 1, 0).getDate();
        const diasUteisMes = [];

        for (let d = 1; d <= totalDias; d++) {
            const dataDia = new Date(hoje.getFullYear(), m, d);
            const diaSemana = dataDia.getDay();
            if (diaSemana >= 1 && diaSemana <= 4) {
                diasUteisMes.push({
                    dia: d,
                    dataStr: dataParaStr(dataDia),
                    diaSemana: diaSemana,
                    ativo: true
                });
            }
        }

        html += '<div class="mes-section">';
        html += '<h3 class="mes-titulo">' + nomeMes + '</h3>';
        html += '<div class="dias-grid">';

        diasUteisMes.forEach(function(info) {
            const nomeDia = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][info.diaSemana];
            const jaSelecionado = dataSelecionada && dataSelecionada === info.dataStr;
            html += '<div class="dia-item ' + (jaSelecionado ? 'dia-selecionado' : '') + '" onclick="selecionarDia(\'' + info.dataStr + '\', this)">';
            html += '<span class="dia-nome">' + nomeDia + '</span>';
            html += '<span class="dia-numero">' + info.dia + '</span>';
            html += '</div>';
        });

        html += '</div>';
        html += '</div>';
    }

    return html;
}

function entrar() {
    const userInput = document.getElementById('usuario-input');
    const senhaInput = document.getElementById('senha-input');
    const erro = document.getElementById('login-erro');

    if (userInput.value.trim() === USUARIO && senhaInput.value === SENHA) {
        localStorage.setItem(LOGADO_KEY, '1');
        mostrarConteudo();
    } else {
        erro.style.display = 'block';
        senhaInput.value = '';
    }
}

function mostrarConteudo() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('conteudo-principal').style.display = 'block';
    mostrarData();

    const anoSalvo = localStorage.getItem(ANO_KEY);
    const diaSalvo = localStorage.getItem(DIA_KEY);
    if (anoSalvo) anoAtual = parseInt(anoSalvo, 10);

    const hoje = new Date();
    const pad = String(hoje.getFullYear()) + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-';
    const diaDefault = diaSalvo || pad + String(hoje.getDate()).padStart(2, '0');
    dataSelecionada = diaDefault;
    document.getElementById('dia-selecionado').textContent = 'Dia: ' + diaDefault;

    aplicarAnoSelecionado();
    gerarCalendario();
    carregarAlunos();
}

function verificarSessao() {
    if (localStorage.getItem(LOGADO_KEY) === '1') {
        mostrarConteudo();
    }
}

document.getElementById('entrar-btn').addEventListener('click', entrar);
document.getElementById('senha-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') entrar();
});
document.getElementById('usuario-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('senha-input').focus();
});

function mudarAno(ano, el) {
    anoAtual = ano;
    localStorage.setItem(ANO_KEY, String(ano));
    document.querySelectorAll('.ano-tab').forEach(function(t) { t.classList.remove('active'); });
    if (el) el.classList.add('active');
    aplicarAnoSelecionado();
    gerarCalendario();
    carregarAlunos();
}

function aplicarAnoSelecionado() {
    const rotulo = anoAtual + ' Ano';
    document.getElementById('ano-badge').textContent = rotulo;
    document.getElementById('ano-badge-resumo').textContent = rotulo;
    document.getElementById('ano-badge-alunos').textContent = rotulo;
    document.getElementById('ano-badge-cal').textContent = rotulo;
    document.querySelectorAll('.ano-tab').forEach(function(t) {
        t.classList.toggle('active', parseInt(t.dataset.ano, 10) === anoAtual);
    });
}

function mudarSection(section, el) {
    document.querySelectorAll('section').forEach(function(s) { s.style.display = 'none'; });
    document.getElementById(section).style.display = 'block';
    document.querySelectorAll('nav a').forEach(function(a) { a.classList.remove('active'); });
    if (el) el.classList.add('active');
}

function selecionarDia(dataStr, el) {
    dataSelecionada = dataStr;
    localStorage.setItem(DIA_KEY, dataStr);

    document.querySelectorAll('.dia-item').forEach(function(d) {
        d.classList.remove('dia-selecionado');
    });
    if (el) el.classList.add('dia-selecionado');

    document.getElementById('dia-selecionado').textContent = 'Dia: ' + dataStr;
    mudarSection('chamada', document.querySelector('nav a[data-section="chamada"]'));
    carregarChamadaPorData(dataStr);
}

function gerarCalendario() {
    document.getElementById('meses-container').innerHTML = diasUteisDoAno();
}

function carregarAlunos() {
    db.ref('alunos/' + anoAtual).on('value', function(snapshot) {
        alunos = [];
        snapshot.forEach(function(child) {
            alunos.push({ id: child.key, nome: child.val().nome });
        });
        renderizarAlunos();
        if (dataSelecionada) {
            carregarChamadaPorData(dataSelecionada);
        }
    });
}

function carregarChamadaPorData(dataStr) {
    const key = dataStr;
    chamadaHoje = alunos.map(function(a) {
        return { id: a.id, nome: a.nome, status: 'presente' };
    });

    if (alunos.length === 0) {
        renderizarChamada();
        return;
    }

    db.ref('chamadas/' + anoAtual + '/' + key).once('value').then(function(snap) {
        const existente = snap.val();

        if (existente && existente.registros) {
            chamadaSalva = { data: key, registros: existente.registros };
            chamadaHoje = chamadaHoje.map(function(item) {
                const statusSalvo = existente.registros[item.id];
                return statusSalvo !== undefined ? { id: item.id, nome: item.nome, status: statusSalvo } : item;
            });
        } else {
            chamadaSalva = null;
        }

        renderizarChamada();
        renderizarResumo();
    }).catch(function(err) {
        console.error('Erro ao carregar chamada:', err);
        renderizarChamada();
    });
}

function renderizarChamada() {
    const lista = document.getElementById('chamada-lista');
    lista.innerHTML = '';

    if (chamadaHoje.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Nenhum aluno cadastrado neste ano. Adicione alunos na aba "Alunos" primeiro.</p>';
        return;
    }

    chamadaHoje.forEach(function(item) {
        const div = document.createElement('div');
        div.className = 'chamada-item';
        div.innerHTML =
            '<div class="chamada-nome">' + item.nome + '</div>' +
            '<div class="chamada-opcoes">' +
                '<label class="opcao ' + (item.status === 'presente' ? 'selecionado-presente' : '') + '">' +
                    '<input type="radio" name="aluno-' + item.id + '" value="presente" ' + (item.status === 'presente' ? 'checked' : '') +
                        ' onchange="marcarStatus(\'' + item.id + '\', \'presente\')"> P' +
                '</label>' +
                '<label class="opcao ' + (item.status === 'falta' ? 'selecionado-falta' : '') + '">' +
                    '<input type="radio" name="aluno-' + item.id + '" value="falta" ' + (item.status === 'falta' ? 'checked' : '') +
                        ' onchange="marcarStatus(\'' + item.id + '\', \'falta\')"> F' +
                '</label>' +
                '<label class="opcao ' + (item.status === 'justificada' ? 'selecionado-justificada' : '') + '">' +
                    '<input type="radio" name="aluno-' + item.id + '" value="justificada" ' + (item.status === 'justificada' ? 'checked' : '') +
                        ' onchange="marcarStatus(\'' + item.id + '\', \'justificada\')"> J' +
                '</label>' +
                '<label class="opcao ' + (item.status === 'feriado' ? 'selecionado-feriado' : '') + '">' +
                    '<input type="radio" name="aluno-' + item.id + '" value="feriado" ' + (item.status === 'feriado' ? 'checked' : '') +
                        ' onchange="marcarStatus(\'' + item.id + '\', \'feriado\')"> Feriado' +
                '</label>' +
            '</div>';
        lista.appendChild(div);
    });

    const btnFeriado = document.createElement('button');
    btnFeriado.className = 'btn-feriado';
    btnFeriado.textContent = 'Marcar todos como Sem Aula / Feriado';
    btnFeriado.onclick = marcarTodosFeriado;
    lista.appendChild(btnFeriado);
}

function marcarStatus(id, status) {
    const item = chamadaHoje.find(function(i) { return i.id === id; });
    if (item) {
        item.status = status;
        atualizarEstiloRadio(id, status);
    }
}

function atualizarEstiloRadio(id, status) {
    const labels = document.querySelectorAll('input[name="aluno-' + id + '"]');
    labels.forEach(function(r) {
        const label = r.closest('.opcao');
        label.classList.remove('selecionado-presente', 'selecionado-falta', 'selecionado-justificada');
        if (r.value === status) {
            if (status === 'presente') label.classList.add('selecionado-presente');
            else if (status === 'falta') label.classList.add('selecionado-falta');
            else if (status === 'justificada') label.classList.add('selecionado-justificada');
            else if (status === 'feriado') label.classList.add('selecionado-feriado');
        }
    });
}

function marcarTodosFeriado() {
    if (!confirm('Deseja marcar TODOS os alunos como Sem Aula / Feriado neste dia?')) return;
    chamadaHoje.forEach(function(item) {
        item.status = 'feriado';
    });
    const labels = document.querySelectorAll('#chamada-lista .opcao');
    labels.forEach(function(label) {
        label.classList.remove('selecionado-presente', 'selecionado-falta', 'selecionado-justificada');
    });
    chamadaHoje.forEach(function(item) {
        const radio = document.querySelector('input[name="aluno-' + item.id + '"][value="feriado"]');
        if (radio) {
            radio.checked = true;
            const label = radio.closest('.opcao');
            if (label) label.classList.add('selecionado-feriado');
        }
    });
}

function salvarChamada() {
    if (chamadaHoje.length === 0) { alert('Nao ha alunos para fazer a chamada neste ano.'); return; }
    if (!dataSelecionada) { alert('Selecione um dia no calendario.'); return; }

    const key = dataSelecionada;
    const registros = {};
    chamadaHoje.forEach(function(i) { registros[i.id] = i.status; });

    db.ref('chamadas/' + anoAtual + '/' + key).set({ data: key, registros: registros }).then(function() {
        chamadaSalva = { data: key, registros: registros };
        mostrarToast('Chamada salva com sucesso!');
        renderizarResumo();
    }).catch(function(err) {
        alert('Erro ao salvar a chamada: ' + err.message);
        console.error(err);
    });
}

function renderizarResumo() {
    const tbody = document.getElementById('resumo-body');
    tbody.innerHTML = '';

    const contagem = {};
    alunos.forEach(function(a) { contagem[a.id] = { nome: a.nome, presencas: 0, faltas: 0, justificadas: 0 }; });

    db.ref('chamadas/' + anoAtual).once('value').then(function(snap) {
        const dados = snap.val();
        if (dados) {
            for (const dataKey in dados) {
                const regs = dados[dataKey].registros || {};
                for (const alunoId in regs) {
                    const status = regs[alunoId];
                    if (contagem[alunoId]) {
                        if (status === 'presente') contagem[alunoId].presencas++;
                        else if (status === 'falta') contagem[alunoId].faltas++;
                        else if (status === 'justificada') contagem[alunoId].justificadas++;
                    }
                }
            }
        }

        alunos.forEach(function(a) {
            const c = contagem[a.id];
            const presencas = c.presencas + c.justificadas;
            const diasLetivos = presencas + c.faltas;
            const perc = diasLetivos > 0 ? (presencas / diasLetivos * 100).toFixed(1) + '%' : '-';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + c.nome + '</td>' +
                '<td>' + c.presencas + '</td>' +
                '<td>' + c.faltas + '</td>' +
                '<td>' + c.justificadas + '</td>' +
                '<td><strong>' + perc + '</strong></td>';
            tbody.appendChild(tr);
        });
    }).catch(function(err) {
        console.error('Erro ao carregar resumo:', err);
    });
}

function mostrarFormAluno() {
    document.getElementById('form-aluno').style.display = 'block';
    document.getElementById('aluno-nome-input').focus();
}

function fecharFormAluno() {
    document.getElementById('form-aluno').style.display = 'none';
    document.getElementById('aluno-nome-input').value = '';
}

function salvarAluno() {
    const nome = document.getElementById('aluno-nome-input').value.trim();
    if (!nome) { alert('Digite o nome do aluno.'); return; }
    db.ref('alunos/' + anoAtual).push({ nome: nome }).then(function() {
        fecharFormAluno();
        mostrarToast('Aluno adicionado ao ' + anoAtual + ' Ano');
    }).catch(function(err) {
        alert('Erro ao salvar aluno: ' + err.message);
    });
}

function renderizarAlunos() {
    const lista = document.getElementById('alunos-lista');
    lista.innerHTML = '';
    if (alunos.length === 0) {
        lista.innerHTML = '<p class="empty-msg">Nenhum aluno cadastrado neste ano.</p>';
        return;
    }
    alunos.forEach(function(a) {
        const div = document.createElement('div');
        div.className = 'admin-aluno';
        div.innerHTML =
            '<div class="admin-aluno-info"><strong>' + a.nome + '</strong></div>' +
            '<div class="admin-aluno-acoes">' +
                '<button class="btn-excluir" onclick="excluirAluno(\'' + a.id + '\')">Excluir</button>' +
            '</div>';
        lista.appendChild(div);
    });
}

function excluirAluno(id) {
    if (!confirm('Excluir este aluno?')) return;
    db.ref('alunos/' + anoAtual + '/' + id).remove();
}

function mostrarToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

function sair() {
    localStorage.removeItem(LOGADO_KEY);
    document.getElementById('conteudo-principal').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('senha-input').value = '';
}

window.selecionarDia = selecionarDia;
window.mostrarFormAluno = mostrarFormAluno;
window.fecharFormAluno = fecharFormAluno;
window.salvarAluno = salvarAluno;
window.excluirAluno = excluirAluno;
window.marcarStatus = marcarStatus;
window.salvarChamada = salvarChamada;
window.sair = sair;
window.mudarAno = mudarAno;
window.mudarSection = mudarSection;

verificarSessao();