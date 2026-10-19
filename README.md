# Caixa Firme

Sistema financeiro web para pequenas empresas e prestadores de serviço. Registra receitas e despesas e controla contas a pagar e a receber. Também acompanha o saldo em caixa e o resultado mensal, com gráficos, filtros por período e relatórios em PDF e Excel.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Status](https://img.shields.io/badge/status-concluído-2747C9)
![Nível](https://img.shields.io/badge/dificuldade-média-0D7A53)

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Como executar](#como-executar)
- [Como usar](#como-usar)
- [Regras de cálculo](#regras-de-cálculo)
- [Armazenamento dos dados](#armazenamento-dos-dados)
- [Relatórios em PDF e Excel](#relatórios-em-pdf-e-excel)
- [Tema claro e escuro](#tema-claro-e-escuro)
- [Responsividade e acessibilidade](#responsividade-e-acessibilidade)
- [Organização do código](#organização-do-código)
- [Melhorias futuras](#melhorias-futuras)
- [Autor](#autor)
- [Licença](#licença)

---

## Sobre o projeto

Muitas pequenas empresas ainda controlam o dinheiro em cadernos ou planilhas soltas. Com isso, fica difícil saber quanto entrou e quanto saiu no mês, quais contas estão vencidas e se o negócio deu lucro.

O **Caixa Firme** reúne essas informações em um só lugar, com uma interface simples que roda direto no navegador. Não precisa de servidor, banco de dados nem instalação.

| | |
|---|---|
| **Público-alvo** | Pequenas empresas, MEIs e prestadores de serviço |
| **Nível de dificuldade** | Médio |
| **Tecnologias** | HTML5, CSS3 e JavaScript puro (sem frameworks) |

---

## Funcionalidades

### Painel (visão geral)
- **Indicadores do período:** saldo em caixa, receitas, despesas, resultado com margem líquida, total a receber e total a pagar.
- **Alertas de vencidos:** mostra quantos títulos a receber e quantas contas a pagar estão atrasados.
- **Mini gráfico do saldo:** evolução do saldo acumulado ao longo do ano.
- **Gráfico de fluxo mensal:** barras de receitas e despesas dos 12 meses, com uma linha de resultado. O mês selecionado fica destacado.
- **Gráficos por categoria:** despesas e receitas agrupadas por categoria. Um botão alterna entre **barras** e **pizza**.
- **Próximos vencimentos:** lista das contas pendentes em ordem de data.

### Lançamentos
- Cadastro, edição e exclusão de receitas e despesas.
- Campos: tipo, descrição, categoria, cliente ou fornecedor, valor, vencimento, situação e data do pagamento.
- Categorias sugeridas para cada tipo, com a opção de digitar uma categoria nova.
- Busca por descrição, categoria ou cliente/fornecedor.
- Filtros por tipo (receitas ou despesas) e por situação (pagas, pendentes ou vencidas).
- Totais da seleção atual: receitas, despesas e saldo.
- Baixa rápida com os botões **Pagar** e **Receber**, e opção de **Reabrir** um lançamento já baixado.
- Exclusão com confirmação em dois cliques, para evitar apagar algo por engano.

### Contas a pagar e contas a receber
- Lista de todos os títulos pendentes até o fim do período selecionado.
- Resumo com total em aberto, total vencido e total que vence nos próximos 7 dias.
- Contadores nas abas mostram quantos títulos estão vencidos.

### Filtros por mês e ano
- Seletor de **mês** (ou ano inteiro) e de **ano**, de 2000 a 2090.
- O período escolhido vale para todas as telas, gráficos e relatórios.

### Relatórios
- **DRE simplificada** (Demonstração do Resultado do Exercício) no regime de competência, com receitas e despesas por categoria, resultado e margem líquida.
- **Resultado mês a mês:** receitas, despesas, resultado e saldo acumulado de cada mês.
- Exportação em **PDF** e em **Excel (.xlsx)**.

### Outros
- **Tema claro e escuro**, com a preferência salva no navegador.
- **Dados de exemplo** de uma empresa fictícia, para conhecer o sistema antes de usar com dados reais.
- Layout **responsivo** para computador, tablet e celular.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura semântica da página |
| **CSS3** | Layout com Grid e Flexbox, variáveis CSS para os temas, media queries |
| **JavaScript (ES6+)** | Toda a lógica: cadastro, cálculos, filtros, gráficos e exportação |
| **SVG** | Gráficos de barras, linha e pizza desenhados à mão, sem biblioteca |
| **LocalStorage** | Armazenamento dos dados no navegador |
| [SheetJS (xlsx)](https://sheetjs.com/) | Geração dos arquivos Excel |
| [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) | Geração dos relatórios em PDF |
| [Google Fonts](https://fonts.google.com/) | Fontes Bricolage Grotesque, IBM Plex Sans e IBM Plex Mono |

As bibliotecas de PDF e Excel são carregadas por CDN **somente quando o usuário clica para exportar**. Isso deixa o carregamento inicial mais leve.

---

## Estrutura de arquivos

```
caixa-firme/
├── index.html    # Estrutura da página (cabeçalho, abas e áreas de conteúdo)
├── style.css     # Estilos, temas claro/escuro e responsividade
├── script.js     # Lógica do sistema
└── README.md     # Este arquivo
```

---

## Como executar

### Opção 1: abrir direto no navegador
1. Baixe ou clone o repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/caixa-firme.git
   ```
2. Abra o arquivo `index.html` no navegador (Chrome, Edge, Firefox ou Safari).

### Opção 2: servidor local (recomendado para desenvolvimento)
Com a extensão **Live Server** do VS Code, clique com o botão direito em `index.html` e escolha **Open with Live Server**.

Ou, com Python instalado:
```bash
python -m http.server 8000
```
Depois acesse `http://localhost:8000`.

### Opção 3: publicar no GitHub Pages
1. Envie os arquivos para um repositório no GitHub.
2. Vá em **Settings → Pages**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`, e clique em **Save**.
4. O sistema fica disponível em `https://SEU-USUARIO.github.io/caixa-firme/`.

> É preciso estar conectado à internet para carregar as fontes e para exportar PDF e Excel. O restante do sistema funciona mesmo sem conexão.

---

## Como usar

1. **Primeiro acesso:** o sistema abre com dados de exemplo. Clique em **Começar do zero** para usar seus próprios dados, ou em **Manter exemplos** para partir deles.
2. **Registrar um lançamento:** clique em **Novo lançamento**, escolha **Receita** ou **Despesa**, preencha os campos e clique em **Registrar**.
3. **Dar baixa:** na lista de lançamentos ou de contas, clique em **Pagar** (despesa) ou **Receber** (receita). O lançamento fica marcado como pago na data de hoje.
4. **Escolher o período:** use os seletores de mês e ano no topo da página.
5. **Ver os gráficos:** na aba **Painel**, use o botão **Barras / Pizza** para trocar o tipo de gráfico das categorias.
6. **Gerar relatório:** na aba **Relatórios**, clique em **Baixar PDF** ou **Baixar Excel**.
7. **Trocar o tema:** clique no botão de sol/lua no topo.

---

## Regras de cálculo

| Indicador | Como é calculado |
|---|---|
| **Receitas / Despesas** | Soma dos lançamentos com vencimento no período (regime de competência), pagos ou não |
| **Resultado** | Receitas − Despesas do período |
| **Margem líquida** | Resultado ÷ Receitas × 100 |
| **Saldo em caixa** | Receitas pagas − Despesas pagas, considerando a data do pagamento, até o fim do período (ou até hoje, se o período ainda não terminou) |
| **A receber / A pagar** | Lançamentos pendentes com vencimento até o fim do período, incluindo os atrasados |
| **Vencido** | Lançamento pendente com vencimento anterior à data de hoje |

---

## Armazenamento dos dados

Os lançamentos ficam salvos no **LocalStorage** do navegador. Isso significa que:

- Os dados continuam lá quando a página é fechada e aberta de novo.
- Cada navegador e cada computador têm seus próprios dados.
- Limpar os dados de navegação apaga os lançamentos.

Para guardar um histórico ou levar os dados para outro lugar, exporte o relatório em Excel regularmente.

Chaves usadas no LocalStorage:

| Chave | Conteúdo |
|---|---|
| `cf.dados.v1` | Lançamentos cadastrados |
| `cf.tema` | Tema escolhido (`light` ou `dark`) |
| `cf.tab` | Última aba aberta |
| `cf.graf` | Tipo de gráfico das categorias (`barras` ou `pizza`) |

Formato de um lançamento:
```json
{
  "id": "lx3k9a2b7c",
  "tipo": "despesa",
  "descricao": "Aluguel da sala comercial",
  "categoria": "Aluguel",
  "parte": "Imobiliária Central",
  "valor": 2800,
  "vencimento": "2026-10-10",
  "status": "pago",
  "pagoEm": "2026-10-10"
}
```

---

## Relatórios em PDF e Excel

Os dois relatórios usam o período escolhido nos filtros.

**PDF** (`caixa-firme-AAAA-MM.pdf`):
- Cabeçalho com o período e a data de geração
- Quadro com receitas, despesas, resultado e saldo em caixa
- DRE simplificada
- Resultado mês a mês do ano
- Contas em aberto
- Lista completa dos lançamentos do período
- Numeração de páginas

**Excel** (`caixa-firme-AAAA-MM.xlsx`), com quatro abas:

| Aba | Conteúdo |
|---|---|
| Resumo | Indicadores do período e DRE simplificada |
| Lançamentos | Todos os lançamentos do período |
| Mensal | Receitas, despesas, resultado e saldo de cada mês |
| Contas em aberto | Títulos a pagar e a receber pendentes |

Os valores ficam em formato numérico, prontos para somas e fórmulas no Excel.

---

## Tema claro e escuro

As cores são definidas com **variáveis CSS** (`--bg`, `--ink`, `--accent`, `--in`, `--out` e outras).

- Na primeira visita, o sistema segue o tema do sistema operacional (`prefers-color-scheme`).
- O botão no topo troca o tema manualmente, aplicando o atributo `data-theme` no elemento `<html>`.
- A escolha fica salva para as próximas visitas.

Verde indica receitas e valores positivos, vermelho indica despesas e valores negativos, e amarelo indica pendências. Essas cores mantêm o mesmo significado nos dois temas.

---

## Responsividade e acessibilidade

- Layout em Grid que se adapta de 6 colunas de indicadores (computador) até 2 colunas (celular).
- Tabelas com rolagem horizontal própria em telas pequenas.
- Navegação por teclado com foco visível nos botões e campos.
- Formulário com mensagens de erro claras, por exemplo: *"Informe um valor maior que zero, como 1.250,00."*
- O formulário fecha com a tecla `Esc`.
- Animações respeitam a preferência de movimento reduzido (`prefers-reduced-motion`).
- Valores e datas no padrão brasileiro: `R$ 1.250,00` e `19/10/2026`.

---

## Organização do código

O `script.js` é dividido em blocos comentados:

| Bloco | Responsabilidade |
|---|---|
| Utilidades | Formatação de moeda e datas, gerador de IDs, acesso ao LocalStorage |
| Dados de exemplo | Gera um ano de lançamentos fictícios |
| Estado | Guarda os lançamentos, o período e os filtros atuais |
| Cálculos | Resumo do período, saldo, pendências, totais por categoria e por mês |
| Gráficos | Desenho em SVG do fluxo mensal, do saldo e das categorias (barras e pizza) |
| Telas | Monta o HTML de cada aba (Painel, Lançamentos, Contas, Relatórios) |
| Formulário | Janela de cadastro e edição, com validação |
| Exportação | Geração dos arquivos PDF e Excel |
| Tema | Alternância entre claro e escuro |
| Eventos | Cliques, filtros, busca e navegação entre abas |

---

## Melhorias futuras

- [ ] Backup e restauração dos dados em arquivo JSON
- [ ] Importação de extratos bancários (OFX ou CSV)
- [ ] Lançamentos recorrentes automáticos (aluguel, mensalidades)
- [ ] Cadastro de várias contas bancárias e caixas
- [ ] Centros de custo e projetos
- [ ] Login de usuários e sincronização em nuvem
- [ ] Gráfico de projeção do fluxo de caixa futuro

---

## Autor

Desenvolvido por **Wanderson de farias**.

- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [Seu Nome](https://www.linkedin.com/in/seu-perfil)

---

## Licença

Este projeto está sob a licença **MIT**. Você pode usar, copiar, modificar e distribuir o código livremente, mantendo o aviso de direitos autorais. Veja o arquivo `LICENSE` para mais detalhes.
