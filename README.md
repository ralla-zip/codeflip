# CodeFlip

[![Deploy](https://github.com/ralla-zip/codeflip/actions/workflows/deploy.yml/badge.svg)](https://github.com/ralla-zip/codeflip/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node](https://img.shields.io/badge/Node-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Converta pipelines YAML entre plataformas de CI/CD direto no navegador, sem backend, sem servidor.**

CodeFlip é uma ferramenta front-end para desenvolvedores que precisam migrar ou adaptar pipelines entre provedores como GitHub Actions, Jenkins, GitLab CI e outros. A interface é direta: cola o YAML de origem, escolhe o destino, converte.

> **Status:** demo funcional · interface completa · conversão simulada (mock) · sem dependências de servidor

---

## Preview

> Sugestão: adicione um screenshot ou GIF em `assets/preview.png` e referencie aqui.

```
assets/
└── preview.png   ← adicione aqui
```

---

## Funcionalidades

- Seleção de plataforma de origem e destino com troca rápida por botão
- Editor de YAML de origem e painel de resultado lado a lado
- Cópia do resultado com um clique
- Feedback visual de loading durante a conversão
- Tratamento de erros com `ErrorBoundary`
- Interface responsiva para desktop e mobile
- Tema visual Ladybug com tokens CSS em `src/styles/theme.css`

---

## Plataformas suportadas

| Plataforma | Plataforma | Plataforma |
|---|---|---|
| GitHub Actions | Azure DevOps | Jenkins |
| GitLab CI | CircleCI | Bitbucket Pipelines |
| Travis CI | Drone CI | Semaphore CI |
| GoCD | AWS CodeBuild | AWS CodePipeline |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 18 |
| Build | Vite 5 |
| Estilos | Tailwind CSS 3 |
| Ícones | Lucide React + React Icons |
| Deploy | GitHub Actions + GitHub Pages |

---

## Como rodar localmente

**Pré-requisito:** Node 20+

```bash
# 1. Clone o repositório
git clone https://github.com/ralla-zip/codeflip.git
cd codeflip

# 2. Instale as dependências
npm install

# 3. Inicie em modo desenvolvimento
npm run dev

# 4. Gere a build de produção
npm run build

# 5. Visualize a build localmente
npm run preview
```

---

## Como usar

1. Escolha a **plataforma de origem** no seletor à esquerda.
2. Escolha a **plataforma de destino** no seletor à direita.
3. Cole o YAML de origem no editor.
4. Clique em **Converter YAML**.
5. Revise e copie o resultado.

> A conversão nesta versão é demonstrativa (mock). O resultado exibido é um exemplo estrutural da plataforma de destino, não uma tradução semântica do YAML inserido.

---

## Deploy no GitHub Pages

O projeto inclui workflow de deploy automático em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

```bash
# 1. Suba o repositório para o GitHub na branch master
git push origin master

# 2. Abra Settings > Pages no repositório
# 3. Em Source, selecione "GitHub Actions"
# 4. O próximo push na master dispara o deploy automaticamente
```

A aplicação estará disponível em:

```
https://ralla-zip.github.io/codeflip/
```

---

## Estrutura do projeto

```
codeflip/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow de CI/CD para GitHub Pages
├── src/
│   ├── components/
│   │   ├── YAMLShift.jsx       # Componente principal da aplicação
│   │   └── ErrorBoundary.jsx   # Tratamento de erros em runtime
│   ├── styles/
│   │   └── theme.css           # Tokens de design do tema Ladybug
│   ├── App.jsx                 # Raiz da aplicação
│   └── main.jsx                # Entry point com ReactDOM
├── index.html
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Créditos open source

Projetos que contribuíram para a construção do CodeFlip:

- [shadcn/ui](https://github.com/shadcn-ui/ui) — arquitetura de componentes baseada em tokens
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) — sistema utilitário de estilos
- [Lucide](https://github.com/lucide-icons/lucide) — iconografia
- [React Icons](https://github.com/react-icons/react-icons) — ícones das plataformas CI/CD
- [React](https://github.com/facebook/react) — biblioteca de interface
- [Vite](https://github.com/vitejs/vite) — tooling e build

**Sobre o tema Ladybug:**
O sistema visual foi adaptado de [Morphos](https://github.com/Ameyanagi/morphos), gerador de design systems mantido por Ameyanagi. Os tokens estão em `src/styles/theme.css`.

---

## Contribuindo

Contribuições são bem-vindas.

1. Faça um fork do repositório.
2. Crie uma branch para sua feature: `git checkout -b feat/minha-feature`
3. Commit com contexto claro: `git commit -m "feat: descrição da mudança"`
4. Abra um Pull Request descrevendo o que foi alterado e o motivo.

---

## Licença

Distribuído sob licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.
