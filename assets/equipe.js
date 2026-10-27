// Equipe. Para ativar o LinkedIn de alguém, cole o link entre as aspas.
const EQUIPE = [
  { nome: 'Vinicius Kozonoe Guaglini', papel: 'Líder', linkedin: '' },
  { nome: 'João Victor Melo Santos', papel: '', linkedin: '' },
  { nome: 'Yan Lucas Gonçalves da Silva', papel: '', linkedin: '' },
  { nome: 'Murilo Jeronimo Ferreira Nunes', papel: '', linkedin: '' },
  { nome: 'Gustavo Macedo Daniel', papel: '', linkedin: '' },
];
document.getElementById('pessoas').innerHTML = EQUIPE.map(p => {
  const nome = `<span class="pessoa-nome">${p.nome}</span>`;
  const papel = p.papel ? `<span class="pessoa-papel">${p.papel}</span>` : '';
  const link = p.linkedin
    ? `<a class="pessoa-link" href="${p.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`
    : '';
  return `<li>${nome}${papel}${link}</li>`;
}).join('');
