# CodeFlip

[![React](https://img.shields.io/badge/React-18.3-8b6f47?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-2ba58f?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-8b6f47?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License MIT](https://img.shields.io/badge/License-MIT-2ba58f?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20%2B-8b6f47?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

Converta pipelines YAML entre plataformas de CI/CD em poucos cliques.

CodeFlip nasceu para facilitar migrações entre provedores como GitHub Actions, Jenkins, GitLab CI e outros, mantendo a estrutura da pipeline e reduzindo trabalho manual.

## Preview

Interface inspirada no visual Ladybug, com foco em leitura, contraste suave e fluxo direto de conversao.

Sugestao: adicione aqui um screenshot em assets quando quiser.

## Funcionalidades

- Conversao entre multiplas plataformas de CI/CD
- Editor de YAML de origem e painel de resultado lado a lado
- Seletor de origem e destino com troca rapida
- Copia do resultado com um clique
- Interface responsiva para desktop e mobile
- API key da Anthropic salva localmente no navegador

## Plataformas suportadas

- GitHub Actions
- Azure DevOps
- Jenkins
- GitLab CI
- CircleCI
- Bitbucket Pipelines
- Travis CI
- Drone CI
- Semaphore CI
- GoCD
- AWS CodeBuild
- AWS CodePipeline

## Stack

- React
- Vite
- Tailwind CSS
- Lucide Icons
- GitHub Actions para deploy no GitHub Pages

## Como rodar localmente

1. Instale as dependencias:
	npm install

2. Rode em modo desenvolvimento:
	npm run dev

3. Gere a build de producao:
	npm run build

4. Visualize a build local:
	npm run preview

## Como usar

1. Escolha a plataforma de origem.
2. Escolha a plataforma de destino.
3. Cole o YAML de origem.
4. Informe sua API key da Anthropic no campo da aplicacao.
5. Clique em Converter YAML.
6. Revise e copie o resultado.

Nota sobre seguranca:
- A chave e armazenada apenas no seu navegador via localStorage.
- O projeto nao commita chave no repositorio.

## Publicacao no GitHub Pages

O projeto ja esta pronto para deploy automatico com o workflow em [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

1. Suba o repositorio para o GitHub na branch main.
2. Abra Settings > Pages no repositorio.
3. Em Source, selecione GitHub Actions.
4. Faça push na main para disparar o deploy.

## Estrutura do projeto

- Aplicacao principal: [src/components/YAMLShift.jsx](src/components/YAMLShift.jsx)
- Entrada da aplicacao: [src/main.jsx](src/main.jsx)
- Tema e tokens Ladybug: [src/styles/theme.css](src/styles/theme.css)
- Configuracao Vite: [vite.config.js](vite.config.js)
- Configuracao Tailwind: [tailwind.config.js](tailwind.config.js)
- Workflow de deploy: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

## Creditos open source

Projetos e referencias que ajudaram na construcao:

- shadcn/ui (inspiracao de arquitetura visual baseada em tokens): https://github.com/shadcn-ui/ui
- Tailwind CSS (base utilitaria e consistencia de estilos): https://github.com/tailwindlabs/tailwindcss
- Lucide (iconografia): https://github.com/lucide-icons/lucide
- React (interface): https://github.com/facebook/react
- Vite (tooling e build): https://github.com/vitejs/vite

Sobre o tema Ladybug:
- O projeto usa um sistema visual Ladybug adaptado para tokens CSS em [src/styles/theme.css](src/styles/theme.css).
- O tema foi adaptado de [Morphos](https://github.com/Ameyanagi/morphos), um gerador de design systems mantido por Ameyanagi.

## Contribuindo

Contribuicoes sao bem-vindas.

1. Faça um fork.
2. Crie uma branch para sua feature.
3. Abra um Pull Request com contexto da mudanca.

## Licenca

Este projeto esta sob licenca MIT. Veja [LICENSE](LICENSE).