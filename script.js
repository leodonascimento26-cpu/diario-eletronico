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
        carregarNotas();
        carregarFrequencia();
        carregarAvisos();
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

function carregarNotas() {
    fetch('dados/notas.json')
        .then(res => res.json())
        .then(data => {
            document.getElementById('aluno-nome').textContent = 'Aluno(a): ' + data.aluno;

            const tbody = document.getElementById('notas-body');
            tbody.innerHTML = '';

            data.disciplinas.forEach(item => {
                const notas = [item.b1, item.b2, item.b3, item.b4];
                const notasValidas = notas.filter(n => n !== null && n !== undefined && n !== '');
                const media = notasValidas.length
                    ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(1)
                    : '-';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.disciplina}</td>
                    <td>${item.b1 ?? '-'}</td>
                    <td>${item.b2 ?? '-'}</td>
                    <td>${item.b3 ?? '-'}</td>
                    <td>${item.b4 ?? '-'}</td>
                    <td><strong>${media}</strong></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error('Erro ao carregar notas:', err);
        });
}

function carregarFrequencia() {
    fetch('dados/frequencia.json')
        .then(res => res.json())
        .then(data => {
            document.querySelector('#card-dias .numero').textContent = data.dias_letivos;
            document.querySelector('#card-presencas .numero').textContent = data.presencas;
            document.querySelector('#card-faltas .numero').textContent = data.faltas;

            const porcentagem = data.dias_letivos > 0
                ? (data.presencas / data.dias_letivos * 100).toFixed(1) + '%'
                : '-';
            document.querySelector('#card-frequencia .numero').textContent = porcentagem;
        })
        .catch(err => {
            console.error('Erro ao carregar frequência:', err);
        });
}

function carregarAvisos() {
    fetch('dados/avisos.json')
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('avisos-lista');
            lista.innerHTML = '';

            data.avisos.forEach(aviso => {
                const div = document.createElement('div');
                div.className = 'aviso';
                div.innerHTML = `
                    <h3>${aviso.titulo}</h3>
                    <p>${aviso.descricao}</p>
                `;
                lista.appendChild(div);
            });
        })
        .catch(err => {
            console.error('Erro ao carregar avisos:', err);
        });
}
