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
let alunos = [];
let avisos = [];

async function iniciarFirebase() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const fb = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } = fb;

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
        db = getFirestore(app);

        window.fb = fb;

        const ref = collection(db, 'alunos');
        onSnapshot(ref, (snap) => {
            alunos = [];
            snap.forEach(d => alunos.push({ id: d.id, ...d.data() }));
            renderizarNotas();
            renderizarFrequencia();
            renderizarAdminLista();
        });

        const avisoRef = collection(db, 'avisos');
        onSnapshot(avisoRef, (snap) => {
            avisos = [];
            snap.forEach(d => avisos.push({ id: d.id, ...d.data() }));
            renderizarAvisos();
        });
    } catch (err) {
        alert('Erro ao carregar o banco de dados. Verifique sua conexão com a internet e tente novamente.');
        console.error(err);
    }
}

function renderizarNotas() {
    const tbody = document.getElementById('notas-body');
    tbody.innerHTML = '';
    alunos.forEach(al => {
        const notas = [al.b1, al.b2, al.b3, al.b4];
        const validas = notas.filter(n => n !== null && n !== undefined && n !== '');
        const media = validas.length ? (validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(1) : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${al.nome}</td>
            <td>${al.disciplina || '-'}</td>
            <td>${al.b1 ?? '-'}</td>
            <td>${al.b2 ?? '-'}</td>
            <td>${al.b3 ?? '-'}</td>
            <td>${al.b4 ?? '-'}</td>
            <td><strong>${media}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarFrequencia() {
    const tbody = document.getElementById('frequencia-body');
    tbody.innerHTML = '';
    alunos.forEach(al => {
        const dias = Number(al.dias || 0);
        const presencas = Number(al.presencas || 0);
        const faltas = Number(al.faltas || 0);
        const perc = dias > 0 ? (presencas / dias * 100).toFixed(1) + '%' : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${al.nome}</td>
            <td>${al.dias ?? '-'}</td>
            <td>${al.presencas ?? '-'}</td>
            <td>${al.faltas ?? '-'}</td>
            <td><strong>${perc}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarAvisos() {
    const lista = document.getElementById('avisos-lista');
    lista.innerHTML = '';
    avisos.forEach(a => {
        const div = document.createElement('div');
        div.className = 'aviso';
        div.innerHTML = `
            <h3>${a.titulo}</h3>
            <p>${a.descricao}</p>
            <button class="btn-del" onclick="excluirAviso('${a.id}')">Excluir</button>
        `;
        lista.appendChild(div);
    });
}

function abrirFormAluno() {
    document.getElementById('form-aluno').style.display = 'block';
    document.getElementById('aluno-nome-input').focus();
}

function fecharFormAluno() {
    document.getElementById('form-aluno').style.display = 'none';
    limparFormAluno();
}

function limparFormAluno() {
    ['aluno-nome-input', 'aluno-disciplina-input', 'aluno-b1', 'aluno-b2', 'aluno-b3', 'aluno-b4', 'aluno-dias', 'aluno-presencas', 'aluno-faltas'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

async function salvarAluno() {
    if (!db) { alert('Banco de dados ainda não carregado.'); return; }
    const nome = document.getElementById('aluno-nome-input').value.trim();
    if (!nome) {
        alert('Digite o nome do aluno.');
        return;
    }
    const { collection, addDoc, updateDoc, doc } = window.fb;
    const dado = {
        nome,
        disciplina: document.getElementById('aluno-disciplina-input').value.trim(),
        b1: document.getElementById('aluno-b1').value !== '' ? Number(document.getElementById('aluno-b1').value) : null,
        b2: document.getElementById('aluno-b2').value !== '' ? Number(document.getElementById('aluno-b2').value) : null,
        b3: document.getElementById('aluno-b3').value !== '' ? Number(document.getElementById('aluno-b3').value) : null,
        b4: document.getElementById('aluno-b4').value !== '' ? Number(document.getElementById('aluno-b4').value) : null,
        dias: document.getElementById('aluno-dias').value !== '' ? Number(document.getElementById('aluno-dias').value) : null,
        presencas: document.getElementById('aluno-presencas').value !== '' ? Number(document.getElementById('aluno-presencas').value) : null,
        faltas: document.getElementById('aluno-faltas').value !== '' ? Number(document.getElementById('aluno-faltas').value) : null
    };
    const editId = document.getElementById('form-aluno').dataset.editingId;
    if (editId) {
        await updateDoc(doc(db, 'alunos', editId), dado);
        delete document.getElementById('form-aluno').dataset.editingId;
    } else {
        await addDoc(collection(db, 'alunos'), dado);
    }
    fecharFormAluno();
}

function renderizarAdminLista() {
    const lista = document.getElementById('admin-alunos-lista');
    lista.innerHTML = '';
    alunos.forEach(al => {
        const div = document.createElement('div');
        div.className = 'admin-aluno';
        div.innerHTML = `
            <div class="admin-aluno-info">
                <strong>${al.nome}</strong>
                <span>${al.disciplina || 'Sem disciplina'} | Presenças: ${al.presencas ?? '-'} | Faltas: ${al.faltas ?? '-'}</span>
            </div>
            <div class="admin-aluno-acoes">
                <button class="btn-editar" onclick="preencherFormEdicao('${al.id}')">Editar</button>
                <button class="btn-excluir" onclick="excluirAluno('${al.id}')">Excluir</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function preencherFormEdicao(id) {
    const al = alunos.find(a => a.id === id);
    if (!al) return;
    document.getElementById('aluno-nome-input').value = al.nome || '';
    document.getElementById('aluno-disciplina-input').value = al.disciplina || '';
    document.getElementById('aluno-b1').value = al.b1 ?? '';
    document.getElementById('aluno-b2').value = al.b2 ?? '';
    document.getElementById('aluno-b3').value = al.b3 ?? '';
    document.getElementById('aluno-b4').value = al.b4 ?? '';
    document.getElementById('aluno-dias').value = al.dias ?? '';
    document.getElementById('aluno-presencas').value = al.presencas ?? '';
    document.getElementById('aluno-faltas').value = al.faltas ?? '';
    document.getElementById('form-aluno').style.display = 'block';
    document.getElementById('form-aluno').dataset.editingId = id;
}

async function excluirAluno(id) {
    if (!db) return;
    if (!confirm('Excluir este aluno?')) return;
    const { deleteDoc, doc } = window.fb;
    await deleteDoc(doc(db, 'alunos', id));
}

function abrirFormAviso() {
    document.getElementById('form-aviso').style.display = 'block';
}

function fecharFormAviso() {
    document.getElementById('form-aviso').style.display = 'none';
    document.getElementById('aviso-titulo').value = '';
    document.getElementById('aviso-descricao').value = '';
}

async function salvarAviso() {
    if (!db) { alert('Banco de dados ainda não carregado.'); return; }
    const { collection, addDoc } = window.fb;
    const titulo = document.getElementById('aviso-titulo').value.trim();
    const descricao = document.getElementById('aviso-descricao').value.trim();
    if (!titulo || !descricao) {
        alert('Preencha título e descrição.');
        return;
    }
    await addDoc(collection(db, 'avisos'), { titulo, descricao });
    fecharFormAviso();
}

async function excluirAviso(id) {
    if (!db) return;
    if (!confirm('Excluir este aviso?')) return;
    const { deleteDoc, doc } = window.fb;
    await deleteDoc(doc(db, 'avisos', id));
}

window.abrirFormAluno = abrirFormAluno;
window.fecharFormAluno = fecharFormAluno;
window.salvarAluno = salvarAluno;
window.preencherFormEdicao = preencherFormEdicao;
window.excluirAluno = excluirAluno;
window.abrirFormAviso = abrirFormAviso;
window.fecharFormAviso = fecharFormAviso;
window.salvarAviso = salvarAviso;
window.excluirAviso = excluirAviso;
window.entrar = entrar;
