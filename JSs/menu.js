const btnSair = document.getElementById('bt-sair');

btnSair.addEventListener('click', (evento) => {
    evento.preventDefault(); 

    const certeza = confirm("Tem certeza de que deseja sair do sistema?");

    if (certeza) {
        window.location.href = 'http://127.0.0.1:3000/PROJETO_FINAL_ACCION/login/login.html?vscode-livepreview=true';
    }
});