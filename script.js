const USUARIO = 'Almada Lima Filho';
const SENHA = 'Almada Filho2026';

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
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('conteudo-principal').style.display = 'block';
        mostrarData();
        iniciarFirebase();
    } else {
        erro.style.display = 'block';
        senhaInput.value = '';
    }
}

document.getElementById('entrar-btn').addEventListener('click', entrar);

document.getElementById('senha-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        entrar();
    }
});

document.getElementById('usuario-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('senha-input').focus();
    }
});

let db = null;
window.fb = null;
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

async function iniciarFirebase() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const fb = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        window.fb = fb;

        const firebaseConfig = {
            apiKey: "AIzaSyBT-wTmA3N1izSfKQd3e2Gv5q_dXF94W-g",
            authDomain: "diario-escola-178a4.firebaseapp.com",
            projectId: "diario-escola-178a4",
            storageBucket: "diario-escola-178a4.firebasestorage.app",
            messagingSenderId: "998584397283",
            appId: "1:998584397283:web:7a8a405df30644a0e4c4d6",
            measurementId: "G-HCG2MF8HD2"
        };

        const app = initializeApp(firebaseConfig);
        const { getFirestore } = window.fb;
        db = getFirestore(app);

        const { collection, onSnapshot } = window.fb;

        onSnapshot(collection(db, 'alunos'), (snap) => {
            alunos = [];
            snap.forEach(d => alunos.push({ id: d.id, ...d.data() }));
            renderizarAlunos();
            carregarChamadaHoje();
        });
    } catch (err) {
        alert('Erro ao carregar o banco de dados. Verifique sua conexão com a internet e tente novamente.');
        console.error(err);
    }
}

async function carregarChamadaHoje() {
    const { collection, getDocs } = window.fb;
    const key = hojeKey();
    chamadaHoje = alunos.map(a => ({ id: a.id, nome: a.nome, status: 'presente' }));

    try {
        const snap = await getDocs(collection(db, 'chamadas'));
        let existente = null;
        snap.forEach(d => {
            if (d.data().data === key) existente = { id: d.id, ...d.data() };
        });

        if (existente) {
            chamadaSalva = existente;
            chamadaHoje = chamadaHoje.map(item => {
                const reg = existente.registros.find(r => r.id === item.id);
                return reg ? { ...item, status: reg.status } : item;
            });
        } else {
            chamadaSalva = null;
        }

        renderizarChamada();
        renderizarResumo();
    } catch (err) {
        console.error('Erro ao carregar chamada:', err);
        renderizarChamada();
    }
}

function renderizarChamada() {
    const lista = document.getElementById('chamada-lista');
    lista.innerHTML = '';

    if (chamadaHoje.length === 0) {
        lista.innerHTML = '<p class="admin-nota">Nenhum aluno cadastrado. Adicione alunos na aba "Alunos" primeiro.</p>';
        return;
    }

    chamadaHoje.forEach(item => {
        const div = document.createElement('div');
        div.className = 'chamada-item';
        div.innerHTML = `
            <div class="chamada-nome">${item.nome}</div>
            <div class="chamada-opcoes">
                <label class="opcao ${item.status === 'presente' ? 'selecionado-presente' : ''}">
                    <input type="radio" name="aluno-${item.id}" value="presente" ${item.status === 'presente' ? 'checked' : ''}
                        onchange="marcarStatus('${item.id}', 'presente')"> Presente
                </label>
                <label class="opcao ${item.status === 'falta' ? 'selecionado-falta' : ''}">
                    <input type="radio" name="aluno-${item.id}" value="falta" ${item.status === 'falta' ? 'checked' : ''}
                        onchange="marcarStatus('${item.id}', 'falta')"> Falta
                </label>
            </div>
        `;
        lista.appendChild(div);
    });
}

function marcarStatus(id, status) {
    const item = chamadaHoje.find(i => i.id === id);
    if (item) {
        item.status = status;
        atualizarEstiloRadio(id, status);
    }
}

function atualizarEstiloRadio(id, status) {
    const labels = document.querySelectorAll(`input[name="aluno-${id}"]`);
    labels.forEach(r => {
        const label = r.closest('.opcao');
        label.classList.remove('selecionado-presente', 'selecionado-falta');
        if (r.value === status) {
            label.classList.add(status === 'presente' ? 'selecionado-presente' : 'selecionado-falta');
        }
    });
}

async function salvarChamada() {
    if (!db) { alert('Banco de dados ainda não carregado.'); return; }
    if (chamadaHoje.length === 0) { alert('Não há alunos para fazer a chamada.'); return; }

    const { collection, addDoc, updateDoc, doc } = window.fb;
    const key = hojeKey();
    const registros = chamadaHoje.map(i => ({ id: i.id, nome: i.nome, status: i.status }));

    try {
        if (chamadaSalva) {
            await updateDoc(doc(db, 'chamadas', chamadaSalva.id), { data: key, registros });
        } else {
            await addDoc(collection(db, 'chamadas'), { data: key, registros });
        }
        const msg = document.getElementById('chamada-msg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
        renderizarResumo();
    } catch (err) {
        alert('Erro ao salvar a chamada: ' + err.message);
        console.error(err);
    }
}

async function renderizarResumo() {
    const tbody = document.getElementById('resumo-body');
    tbody.innerHTML = '';

    const { collection, getDocs } = window.fb;

    const contagem = {};
    alunos.forEach(a => contagem[a.id] = { nome: a.nome, presencas: 0, faltas: 0 });

    try {
        const snap = await getDocs(collection(db, 'chamadas'));
        snap.forEach(d => {
            const regs = d.data().registros || [];
            regs.forEach(r => {
                if (contagem[r.id]) {
                    if (r.status === 'presente') contagem[r.id].presencas++;
                    else if (r.status === 'falta') contagem[r.id].faltas++;
                }
            });
        });
    } catch (err) {
        console.error('Erro ao carregar resumo:', err);
    }

    alunos.forEach(a => {
        const c = contagem[a.id];
        const total = c.presencas + c.faltas;
        const perc = total > 0 ? (c.presencas / total * 100).toFixed(1) + '%' : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.nome}</td>
            <td>${c.presencas}</td>
            <td>${c.faltas}</td>
            <td><strong>${perc}</strong></td>
        `;
        tbody.appendChild(tr);
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

async function salvarAluno() {
    if (!db) { alert('Banco de dados ainda não carregado.'); return; }
    const nome = document.getElementById('aluno-nome-input').value.trim();
    if (!nome) {
        alert('Digite o nome do aluno.');
        return;
    }
    const { collection, addDoc } = window.fb;
    await addDoc(collection(db, 'alunos'), { nome });
    fecharFormAluno();
}

function renderizarAlunos() {
    const lista = document.getElementById('alunos-lista');
    lista.innerHTML = '';
    alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = 'admin-aluno';
        div.innerHTML = `
            <div class="admin-aluno-info">
                <strong>${a.nome}</strong>
            </div>
            <div class="admin-aluno-acoes">
                <button class="btn-excluir" onclick="excluirAluno('${a.id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

async function excluirAluno(id) {
    if (!db) return;
    if (!confirm('Excluir este aluno?')) return;
    const { deleteDoc, doc } = window.fb;
    await deleteDoc(doc(db, 'alunos', id));
}

window.mostrarFormAluno = mostrarFormAluno;
window.fecharFormAluno = fecharFormAluno;
window.salvarAluno = salvarAluno;
window.excluirAluno = excluirAluno;
window.marcarStatus = marcarStatus;
window.salvarChamada = salvarChamada;
window.entrar = entrar;
