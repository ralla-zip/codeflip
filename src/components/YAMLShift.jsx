import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronsUpDown,
  Copy,
  GitBranch,
  Loader2,
  Sparkles,
  FileCode2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

const PLATFORMS = [
  { id: "github", label: "GitHub Actions", icon: "🐙" },
  { id: "azure", label: "Azure DevOps", icon: "☁️" },
  { id: "jenkins", label: "Jenkins", icon: "🏗️" },
  { id: "gitlab", label: "GitLab CI", icon: "🦊" },
  { id: "circleci", label: "CircleCI", icon: "⭕" },
  { id: "bitbucket", label: "Bitbucket Pipelines", icon: "🪣" },
  { id: "travis", label: "Travis CI", icon: "🔧" },
  { id: "drone", label: "Drone CI", icon: "🚁" },
  { id: "semaphore", label: "Semaphore CI", icon: "🚦" },
  { id: "gocd", label: "GoCD", icon: "🔄" },
  { id: "codebuild", label: "AWS CodeBuild", icon: "🏗️" },
  { id: "codepipeline", label: "AWS CodePipeline", icon: "🚀" },
];

const EXAMPLES = {
  github: `name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build`,
  gitlab: `stages:
  - build
  - test
  - deploy

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm test`,
};

function PlatformDropdown({ value, onChange, exclude, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);

  const selected = useMemo(() => PLATFORMS.find((p) => p.id === value), [value]);
  const available = useMemo(() => PLATFORMS.filter((p) => p.id !== exclude), [exclude]);

  useEffect(() => {
    if (!isOpen) return;

    const selectedIndex = available.findIndex((platform) => platform.id === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, available, value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectByIndex = (index) => {
    const platform = available[index];
    if (!platform) return;

    onChange(platform.id);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => Math.min(prev + 1, available.length - 1));
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      }
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      selectByIndex(highlightedIndex);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const listboxId = `${label.toLowerCase()}-platform-listbox`;

  return (
    <div className="relative w-full space-y-2" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={`Selecionar plataforma de ${label.toLowerCase()}`}
        className="flex h-12 w-full items-center gap-3 rounded-2xl border border-border/90 bg-background px-4 text-sm shadow-[0_10px_30px_-24px_rgba(61,52,39,0.75)] transition-[border-color,background-color,box-shadow,transform] hover:border-accent/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="text-lg leading-none">{selected?.icon}</span>
        <span className="flex-1 text-left font-medium text-card-foreground">{selected?.label}</span>
        <ChevronsUpDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`Selecionar plataforma de ${label.toLowerCase()}`}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-border bg-popover shadow-[0_24px_60px_-32px_rgba(61,52,39,0.45)]"
          onKeyDown={handleTriggerKeyDown}
        >
          <div className="border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            plataformas suportadas
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1.5">
            {available.map((platform, index) => (
            <button
              key={platform.id}
              type="button"
              role="option"
              aria-selected={platform.id === value}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectByIndex(index)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors last:mb-0 ${
                platform.id === value
                  ? "bg-accent text-accent-foreground"
                  : highlightedIndex === index
                    ? "bg-muted"
                    : "hover:bg-muted/80"
              }`}
            >
              <span>{platform.icon}</span>
              <span className="flex-1 font-medium">{platform.label}</span>
              {platform.id === value ? <Check className="h-4 w-4" /> : null}
            </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function YAMLShift() {
  const [source, setSource] = useState("github");
  const [target, setTarget] = useState("jenkins");
  const [input, setInput] = useState(EXAMPLES.github);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const sourcePlatform = useMemo(() => PLATFORMS.find((p) => p.id === source), [source]);
  const targetPlatform = useMemo(() => PLATFORMS.find((p) => p.id === target), [target]);

  const handleSourceChange = (nextSource) => {
    setSource(nextSource);
    setInput(EXAMPLES[nextSource] || "");
    setOutput("");
    setCopied(false);

    if (nextSource === target) {
      setTarget(source);
    }
  };

  const handleTargetChange = (nextTarget) => {
    setTarget(nextTarget);
    setOutput("");
    setCopied(false);

    if (nextTarget === source) {
      setSource(target);
    }
  };

  const swapPlatforms = () => {
    setSource(target);
    setTarget(source);
    setOutput("");
    setCopied(false);
  };

  const copyOutput = async () => {
    if (!output.trim()) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar automaticamente.");
    }
  };

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const convert = () => {
    if (!input.trim()) {
      setError("Por favor, insira um YAML para converter.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    // Simula conversão com delay
    setTimeout(() => {
      const exampleOutputs = {
        github: `# Converted to GitHub Actions
name: CI Pipeline

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test
      - run: npm run build`,
        jenkins: `// Converted to Jenkins Declarative Pipeline
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Setup') {
            steps {
                sh 'node --version'
            }
        }
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }
}`,
        gitlab: `stages:
  - checkout
  - install
  - test
  - build

checkout:
  stage: checkout
  image: node:20
  script:
    - git fetch

install:
  stage: install
  image: node:20
  script:
    - npm ci

test:
  stage: test
  image: node:20
  script:
    - npm test

build:
  stage: build
  image: node:20
  script:
    - npm run build`,
      };

      setOutput(exampleOutputs[target] || exampleOutputs.jenkins);
      setLoading(false);
    }, 800);
  };

  return (
    <main className="app-shell min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <section className="overflow-hidden rounded-[30px] border border-border/90 bg-card shadow-[0_20px_80px_-44px_rgba(61,52,39,0.4)]">
          <div className="h-1.5 w-full bg-accent" />

          <header className="space-y-3 border-b border-border/80 px-6 pb-7 pt-8 md:px-10 md:pb-8 md:pt-9">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Pipeline Converter · v1.0</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-card-foreground md:text-5xl">
              YAML <span className="text-accent">Converter</span>
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[15px]">
              Cole seu YAML de origem e realize a conversão entre os diferentes provedores de CI/CD.
            </p>
          </header>

          <div className="space-y-7 px-6 py-6 md:px-10 md:py-8">
            <section className="rounded-[26px] border border-border/80 bg-secondary/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] md:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
                <PlatformDropdown value={source} onChange={handleSourceChange} exclude={target} label="Origem" />

                <button
                  type="button"
                  onClick={swapPlatforms}
                  className="mx-auto inline-flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-2xl border border-border/90 bg-background text-muted-foreground shadow-[0_12px_30px_-24px_rgba(61,52,39,0.8)] transition-[border-color,background-color,color,transform] hover:-translate-y-px hover:border-accent/40 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:mb-[2px]"
                  aria-label="Trocar plataformas de origem e destino"
                  title="Trocar plataformas"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </button>

                <PlatformDropdown value={target} onChange={handleTargetChange} exclude={source} label="Destino" />
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/15 bg-background/85 px-3.5 py-2 text-xs font-medium text-secondary-foreground shadow-sm">
                  <ArrowRight className="h-3.5 w-3.5 text-accent" />
                  <span>{sourcePlatform?.label} → {targetPlatform?.label}</span>
                </div>

                <button
                  type="button"
                  onClick={convert}
                  disabled={loading || !input.trim()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_32px_-20px_rgba(72,88,55,0.95)] transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-primary/55 disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Convertendo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Converter YAML
                    </>
                  )}
                </button>
              </div>
            </section>

            {error ? (
              <div className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <section className="rounded-[26px] border border-border/85 bg-background p-4 shadow-[0_18px_50px_-38px_rgba(61,52,39,0.4)] md:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-lg shadow-sm">
                    <span>{sourcePlatform?.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sourcePlatform?.label}</p>
                    <p className="text-xs text-muted-foreground">YAML de referência para conversão</p>
                  </div>
                  <span className="ml-auto rounded-full border border-border/70 bg-muted/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    origem
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="code-surface h-[380px] min-h-[320px] w-full resize-none rounded-2xl border border-input bg-card px-4 py-4 text-[13px] leading-6 text-card-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50 md:h-[430px] md:text-sm"
                  placeholder="Cole aqui o YAML de origem"
                  spellCheck={false}
                />
              </section>

              <section className="rounded-[26px] border border-border/85 bg-background p-4 shadow-[0_18px_50px_-38px_rgba(61,52,39,0.4)] md:p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-lg shadow-sm">
                    <span>{targetPlatform?.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{targetPlatform?.label}</p>
                    <p className="text-xs text-muted-foreground">Saída convertida pronta para revisão</p>
                  </div>
                  <span className="rounded-full border border-border/70 bg-muted/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:ml-auto">
                    destino
                  </span>
                  <button
                    type="button"
                    onClick={copyOutput}
                    disabled={!output.trim()}
                    aria-label={copied ? "YAML copiado" : "Copiar YAML convertido"}
                    className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border/90 bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-[background-color,border-color,color] hover:border-accent/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:border-border/50 disabled:bg-secondary/55 disabled:text-muted-foreground disabled:hover:bg-secondary/55"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={output}
                    readOnly
                    aria-label="YAML convertido"
                    className="code-surface h-[380px] min-h-[320px] w-full resize-none rounded-2xl border border-input bg-card px-4 py-4 text-[13px] leading-6 text-card-foreground outline-none md:h-[430px] md:text-sm"
                    placeholder=""
                    spellCheck={false}
                  />

                  {!loading && !output.trim() ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl px-6 text-center">
                      <div className="max-w-sm rounded-3xl border border-dashed border-border/80 bg-background/82 px-6 py-7 shadow-sm backdrop-blur-[1px]">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                          <FileCode2 className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">🧾 YAML convertido aparecerá aqui</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground md:text-sm">
                          Depois de colar o YAML de origem, clique em “Converter YAML” para gerar o arquivo de destino.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px]">
                      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        Convertendo pipeline...
                      </div>
                    </div>
                  ) : null}
                </div>

              </section>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[color:color-mix(in_oklab,var(--secondary-foreground)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--secondary)_92%,white)] px-4 py-3 text-sm text-secondary-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:color-mix(in_oklab,var(--secondary-foreground)_90%,black)]" />
              <p className="leading-6">Revise sempre o YAML convertido antes de utilizar em produção.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
