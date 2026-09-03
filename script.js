const USUARIO = 'Almada Lima Filho';
const SENHA = 'Almada Filho2026';
const LOGADO_KEY = 'diario_logado_2026';

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

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
    });
});

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

let alunos = [];
let chamadaHoje = [];
let chamadaSalva = null;

function mostrarData() {
    const hoje = new Date();
    const dataStr = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('data-hoje').textContent = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
}

function hojeKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function carregarAlunos() {
    db.ref('alunos').on('value', function(snapshot) {
        alunos = [];
        snapshot.forEach(function(child) {
            alunos.push({ id: child.key, nome: child.val().nome });
        });
        renderizarAlunos();
        carregarChamadaHoje();
    });
}

function carregarChamadaHoje() {
    const key = hojeKey();
    chamadaHoje = alunos.map(function(a) {
        return { id: a.id, nome: a.nome, status: 'presente' };
    });

    db.ref('chamadas/' + key).once('value').then(function(snap) {
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
        lista.innerHTML = '<p class="admin-nota">Nenhum aluno cadastrado. Adicione alunos na aba "Alunos" primeiro.</p>';
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
                        ' onchange="marcarStatus(\'' + item.id + '\', \'presente\')"> Presente' +
                '</label>' +
                '<label class="opcao ' + (item.status === 'falta' ? 'selecionado-falta' : '') + '">' +
                    '<input type="radio" name="aluno-' + item.id + '" value="falta" ' + (item.status === 'falta' ? 'checked' : '') +
                        ' onchange="marcarStatus(\'' + item.id + '\', \'falta\')"> Falta' +
                '</label>' +
                '<label class="opcao ' + (item.status === 'justificada' ? 'selecionado-justificada' : '') + '">' +
                    '<input type="radio" name="aluno-' + item.id + '" value="justificada" ' + (item.status === 'justificada' ? 'checked' : '') +
                        ' onchange="marcarStatus(\'' + item.id + '\', \'justificada\')"> Falta Justificada' +
                '</label>' +
            '</div>';
        lista.appendChild(div);
    });
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
        }
    });
}

function salvarChamada() {
    if (chamadaHoje.length === 0) { alert('Nao ha alunos para fazer a chamada.'); return; }

    const key = hojeKey();
    const registros = {};
    chamadaHoje.forEach(function(i) { registros[i.id] = i.status; });

    db.ref('chamadas/' + key).set({ data: key, registros: registros }).then(function() {
        chamadaSalva = { data: key, registros: registros };
        const msg = document.getElementById('chamada-msg');
        msg.style.display = 'block';
        setTimeout(function() { msg.style.display = 'none'; }, 3000);
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

    db.ref('chamadas').once('value').then(function(snap) {
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
    db.ref('alunos').push({ nome: nome }).then(function() {
        fecharFormAluno();
    }).catch(function(err) {
        alert('Erro ao salvar aluno: ' + err.message);
    });
}

function renderizarAlunos() {
    const lista = document.getElementById('alunos-lista');
    lista.innerHTML = '';
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
    db.ref('alunos/' + id).remove();
}

function sair() {
    localStorage.removeItem(LOGADO_KEY);
    document.getElementById('conteudo-principal').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('senha-input').value = '';
}

window.mostrarFormAluno = mostrarFormAluno;
window.fecharFormAluno = fecharFormAluno;
window.salvarAluno = salvarAluno;
window.excluirAluno = excluirAluno;
window.marcarStatus = marcarStatus;
window.salvarChamada = salvarChamada;
window.sair = sair;

verificarSessao();