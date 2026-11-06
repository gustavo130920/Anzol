// Aplica o tema salvo antes de desenhar a página (evita piscar). Padrão: preto.
// Fica num arquivo próprio para a política de segurança (CSP) não precisar liberar scripts embutidos.
try { if (localStorage.getItem('anzol-tema') === 'claro') document.documentElement.setAttribute('data-theme', 'light'); } catch (e) {}
