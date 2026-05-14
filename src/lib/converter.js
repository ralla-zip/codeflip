import yaml from "js-yaml";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function ensureStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return yaml.dump(v).trim();
  return String(v);
}

/**
 * Converts a known GitHub Action reference to an equivalent shell command.
 */
function resolveAction(uses, withParams) {
  if (!uses) return null;
  const base = uses.split("@")[0];

  if (base === "actions/checkout") return "git fetch --depth=1";
  if (base === "actions/setup-node") {
    const v = withParams?.["node-version"];
    return v ? `# Ensure Node.js ${v} is available\nnode --version` : "node --version";
  }
  if (base === "actions/setup-python") {
    const v = withParams?.["python-version"];
    return v ? `# Ensure Python ${v} is available\npython --version` : "python --version";
  }
  if (base === "actions/setup-java") {
    const v = withParams?.["java-version"];
    return v ? `# Ensure Java ${v} is available\njava --version` : "java --version";
  }
  if (base === "actions/cache") {
    const path = withParams?.path || "";
    return `# Cache: ${path}`;
  }
  if (base === "actions/upload-artifact") {
    return `# Upload artifact: ${withParams?.path || ""}`;
  }
  if (base === "actions/download-artifact") {
    return `# Download artifact: ${withParams?.name || ""}`;
  }
  if (base === "docker/login-action") return "docker login";
  if (base === "docker/build-push-action") {
    const tags = withParams?.tags || "image:latest";
    return `docker build -t ${tags} .\ndocker push ${tags}`;
  }

  // Generic fallback — document the action
  const params =
    withParams && Object.keys(withParams).length > 0
      ? "\n" + Object.entries(withParams).map(([k, v]) => `#   ${k}: ${v}`).join("\n")
      : "";
  return `# Action: ${uses}${params}`;
}

// ── Parsers (platform YAML → Intermediate Representation) ────────────────────

function parseGitHub(doc) {
  const jobs = [];

  for (const [id, job] of Object.entries(doc.jobs || {})) {
    const steps = [];

    for (const step of toArr(job.steps)) {
      if (step.uses) {
        const run = resolveAction(step.uses, step.with);
        steps.push({ name: step.name || step.uses, run, uses: step.uses, with: step.with || {} });
      } else if (step.run != null) {
        steps.push({ name: step.name || null, run: ensureStr(step.run), uses: null, with: {} });
      }
    }

    jobs.push({
      id,
      name: job.name || id,
      image: job.container?.image || null,
      env: job.env || {},
      needs: toArr(job.needs),
      steps,
      allowFailure: job["continue-on-error"] || false,
      artifacts: null,
      cache: null,
    });
  }

  const on = doc.on || {};
  return {
    name: doc.name || "Pipeline",
    triggers: {
      push: { branches: toArr(on.push?.branches) },
      pullRequest: { branches: toArr(on.pull_request?.branches) },
      manual: !!on.workflow_dispatch,
    },
    globalEnv: doc.env || {},
    globalImage: null,
    jobs,
  };
}

function parseGitLab(doc) {
  const reserved = new Set([
    "stages", "variables", "image", "before_script", "after_script",
    "include", "workflow", "default", "cache", "services",
  ]);
  const jobs = [];
  const globalImage = doc.image || doc.default?.image || null;
  const globalBefore = toArr(doc.before_script);

  for (const [id, job] of Object.entries(doc)) {
    if (reserved.has(id) || typeof job !== "object" || job === null) continue;

    const steps = [];
    const before = [...globalBefore, ...toArr(job.before_script)];
    if (before.length > 0)
      steps.push({ name: "Before script", run: before.join("\n"), uses: null, with: {} });

    const script = toArr(job.script);
    if (script.length > 0)
      steps.push({ name: "Script", run: script.join("\n"), uses: null, with: {} });

    const after = toArr(job.after_script);
    if (after.length > 0)
      steps.push({ name: "After script", run: after.join("\n"), uses: null, with: {} });

    jobs.push({
      id,
      name: job.name || id,
      image: job.image || globalImage,
      env: job.variables || {},
      needs: toArr(job.needs).map((n) => (typeof n === "string" ? n : n.job)),
      steps,
      allowFailure: job.allow_failure || false,
      artifacts: job.artifacts ? { paths: toArr(job.artifacts.paths) } : null,
      cache: job.cache ? { paths: toArr(job.cache.paths), key: job.cache.key || null } : null,
    });
  }

  return {
    name: doc.workflow?.name || "Pipeline",
    triggers: {
      push: { branches: [] },
      pullRequest: { branches: [] },
      manual: false,
    },
    globalEnv: doc.variables || {},
    globalImage,
    jobs,
  };
}

function parseCircleCI(doc) {
  const jobs = [];

  for (const [id, job] of Object.entries(doc.jobs || {})) {
    const steps = [];
    const image = job.docker?.[0]?.image || job.machine?.image || null;

    for (const step of toArr(job.steps)) {
      if (step === "checkout") {
        steps.push({ name: "Checkout", run: "git fetch --depth=1", uses: null, with: {} });
      } else if (typeof step === "object") {
        if (step.run) {
          const run = typeof step.run === "string" ? step.run : step.run.command;
          steps.push({ name: step.run?.name || null, run, uses: null, with: {} });
        } else if (step.restore_cache) {
          steps.push({ name: "Restore cache", run: `# restore_cache: ${toArr(step.restore_cache.keys).join(", ")}`, uses: null, with: {} });
        } else if (step.save_cache) {
          steps.push({ name: "Save cache", run: `# save_cache: ${step.save_cache.key || ""}`, uses: null, with: {} });
        } else if (step.store_artifacts) {
          steps.push({ name: "Store artifacts", run: `# store_artifacts: ${step.store_artifacts.path || ""}`, uses: null, with: {} });
        }
      }
    }

    jobs.push({
      id,
      name: id,
      image,
      env: job.environment || {},
      needs: [],
      steps,
      allowFailure: false,
      artifacts: null,
      cache: null,
    });
  }

  return {
    name: "CircleCI Pipeline",
    triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: {},
    globalImage: null,
    jobs,
  };
}

function parseJenkins(text) {
  // Jenkinsfile is Groovy DSL — use regex-based text parsing
  const jobs = [];
  const stageRegex = /stage\s*\(\s*['"](.+?)['"]\s*\)\s*\{([\s\S]*?)(?=stage\s*\(|post\s*\{|^\s*\}\s*$)/gm;
  const shRegex = /\bsh\s+(?:"""([\s\S]*?)"""|\"{3}|'((?:[^'\\]|\\.)*)'\s*|"((?:[^"\\]|\\.)*)")/g;

  let stageMatch;
  while ((stageMatch = stageRegex.exec(text)) !== null) {
    const stageName = stageMatch[1];
    const stageBody = stageMatch[2];
    const commands = [];
    let shMatch;
    while ((shMatch = shRegex.exec(stageBody)) !== null) {
      commands.push(shMatch[1] || shMatch[2] || shMatch[3] || "");
    }
    jobs.push({
      id: stageName.toLowerCase().replace(/\s+/g, "_"),
      name: stageName,
      image: null,
      env: {},
      needs: [],
      steps:
        commands.length > 0
          ? [{ name: stageName, run: commands.join("\n"), uses: null, with: {} }]
          : [{ name: stageName, run: `echo "${stageName}"`, uses: null, with: {} }],
      allowFailure: false,
      artifacts: null,
      cache: null,
    });
  }

  // Extract environment variables
  const envBlock = {};
  const envRegex = /environment\s*\{([\s\S]*?)\}/;
  const envMatch = envRegex.exec(text);
  if (envMatch) {
    const envVarRegex = /(\w+)\s*=\s*['"](.+?)['"]/g;
    let m;
    while ((m = envVarRegex.exec(envMatch[1])) !== null) {
      envBlock[m[1]] = m[2];
    }
  }

  return {
    name: "Jenkins Pipeline",
    triggers: { push: { branches: ["main"] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: envBlock,
    globalImage: null,
    jobs,
  };
}

function parseAzure(doc) {
  const jobs = [];
  const pool = doc.pool?.vmImage || "ubuntu-latest";

  const processSteps = (rawSteps) => {
    const steps = [];
    for (const step of toArr(rawSteps)) {
      if (step.checkout != null) {
        steps.push({ name: "Checkout", run: "git fetch --depth=1", uses: null, with: {} });
      } else if (step.script != null) {
        steps.push({ name: step.displayName || null, run: ensureStr(step.script), uses: null, with: {} });
      } else if (step.bash != null) {
        steps.push({ name: step.displayName || null, run: ensureStr(step.bash), uses: null, with: {} });
      } else if (step.task != null) {
        steps.push({ name: step.displayName || step.task, run: `# Task: ${step.task}`, uses: null, with: {} });
      } else if (step.pwsh != null || step.powershell != null) {
        const cmd = step.pwsh || step.powershell;
        steps.push({ name: step.displayName || null, run: `# PowerShell: ${ensureStr(cmd)}`, uses: null, with: {} });
      }
    }
    return steps;
  };

  const stagesArr = toArr(doc.stages);
  if (stagesArr.length > 0) {
    for (const stage of stagesArr) {
      for (const job of toArr(stage.jobs)) {
        jobs.push({
          id: job.job || "job",
          name: job.displayName || job.job || "Job",
          image: job.pool?.vmImage || pool,
          env: job.variables || {},
          needs: toArr(job.dependsOn),
          steps: processSteps(job.steps),
          allowFailure: false,
          artifacts: null,
          cache: null,
        });
      }
    }
  } else {
    jobs.push({
      id: "main",
      name: "Main",
      image: pool,
      env: typeof doc.variables === "object" && !Array.isArray(doc.variables) ? doc.variables : {},
      needs: [],
      steps: processSteps(doc.steps),
      allowFailure: false,
      artifacts: null,
      cache: null,
    });
  }

  const trigger = doc.trigger;
  const prTrigger = doc.pr;
  return {
    name: doc.name || "Azure Pipeline",
    triggers: {
      push: { branches: toArr(trigger?.branches?.include || trigger) },
      pullRequest: { branches: toArr(prTrigger?.branches?.include || prTrigger) },
      manual: false,
    },
    globalEnv: typeof doc.variables === "object" && !Array.isArray(doc.variables) ? doc.variables : {},
    globalImage: null,
    jobs,
  };
}

function parseBitbucket(doc) {
  const jobs = [];
  const pipelines = doc.pipelines || {};

  const processSteps = (steps, prefix) => {
    for (const item of toArr(steps)) {
      const step = item.step || item;
      if (!step.script) continue;
      const id = (step.name || prefix).toLowerCase().replace(/\s+/g, "_");
      jobs.push({
        id,
        name: step.name || prefix,
        image: step.image || null,
        env: {},
        needs: [],
        steps: [{ name: "Script", run: toArr(step.script).join("\n"), uses: null, with: {} }],
        allowFailure: false,
        artifacts: step.artifacts ? { paths: toArr(step.artifacts.paths) } : null,
        cache: null,
      });
    }
  };

  if (pipelines.default) processSteps(pipelines.default, "default");
  for (const [branch, steps] of Object.entries(pipelines.branches || {}))
    processSteps(steps, `branch_${branch}`);
  for (const [tag, steps] of Object.entries(pipelines.tags || {}))
    processSteps(steps, `tag_${tag}`);

  return {
    name: "Bitbucket Pipeline",
    triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: {},
    globalImage: doc.image || null,
    jobs,
  };
}

function parseTravis(doc) {
  const steps = [];
  if (doc.before_install)
    steps.push({ name: "Before install", run: toArr(doc.before_install).join("\n"), uses: null, with: {} });
  if (doc.install)
    steps.push({ name: "Install", run: toArr(doc.install).join("\n"), uses: null, with: {} });
  if (doc.before_script)
    steps.push({ name: "Before script", run: toArr(doc.before_script).join("\n"), uses: null, with: {} });
  if (doc.script)
    steps.push({ name: "Script", run: toArr(doc.script).join("\n"), uses: null, with: {} });
  if (doc.after_success)
    steps.push({ name: "After success", run: toArr(doc.after_success).join("\n"), uses: null, with: {} });

  const language = doc.language || "generic";
  const imageMap = {
    node_js: `node:${toArr(doc.node_js)[0] || "lts"}`,
    python: `python:${toArr(doc.python)[0] || "3.11"}`,
    ruby: `ruby:${toArr(doc.rvm)[0] || "3.2"}`,
    java: `eclipse-temurin:${toArr(doc.jdk)[0] || "17"}`,
  };
  const image = imageMap[language] || language;

  return {
    name: "Travis CI Pipeline",
    triggers: {
      push: { branches: toArr(doc.branches?.only) },
      pullRequest: { branches: [] },
      manual: false,
    },
    globalEnv: {},
    globalImage: image,
    jobs: [{ id: "build", name: "Build", image, env: {}, needs: [], steps, allowFailure: false, artifacts: null, cache: null }],
  };
}

function parseDrone(doc) {
  const jobs = [];
  for (const step of toArr(doc.steps)) {
    jobs.push({
      id: step.name?.toLowerCase().replace(/\s+/g, "_") || "step",
      name: step.name || "Step",
      image: step.image || null,
      env: step.environment || {},
      needs: toArr(step.depends_on),
      steps: [{ name: step.name || null, run: toArr(step.commands).join("\n"), uses: null, with: {} }],
      allowFailure: step.failure === "ignore",
      artifacts: null,
      cache: null,
    });
  }
  return {
    name: doc.name || "Drone Pipeline",
    triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: {},
    globalImage: null,
    jobs,
  };
}

function parseSemaphore(doc) {
  const jobs = [];
  for (const block of toArr(doc.blocks)) {
    for (const job of toArr(block.task?.jobs)) {
      jobs.push({
        id: job.name?.toLowerCase().replace(/\s+/g, "_") || "job",
        name: job.name || block.name || "Job",
        image: null,
        env: {},
        needs: [],
        steps: [{ name: job.name || null, run: toArr(job.commands).join("\n"), uses: null, with: {} }],
        allowFailure: false,
        artifacts: null,
        cache: null,
      });
    }
  }
  return {
    name: doc.name || "Semaphore Pipeline",
    triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: {},
    globalImage: null,
    jobs,
  };
}

function parseGoCD(doc) {
  const jobs = [];
  for (const [, pipeline] of Object.entries(doc.pipelines || {})) {
    for (const stageObj of toArr(pipeline.stages)) {
      for (const [stageName, stage] of Object.entries(stageObj)) {
        for (const [jobName, job] of Object.entries(stage.jobs || {})) {
          const commands = [];
          for (const task of toArr(job.tasks)) {
            if (task.exec) {
              const args = toArr(task.exec.arguments).join(" ");
              commands.push(`${task.exec.command} ${args}`.trim());
            } else if (task.script) {
              commands.push(task.script);
            }
          }
          jobs.push({
            id: jobName,
            name: `${stageName} / ${jobName}`,
            image: null,
            env: {},
            needs: [],
            steps: [{ name: jobName, run: commands.join("\n"), uses: null, with: {} }],
            allowFailure: false,
            artifacts: null,
            cache: null,
          });
        }
      }
    }
  }
  return {
    name: "GoCD Pipeline",
    triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: {},
    globalImage: null,
    jobs,
  };
}

function parseCodeBuild(doc) {
  const steps = [];
  for (const [phase, data] of Object.entries(doc.phases || {})) {
    const commands = toArr(data.commands);
    if (commands.length > 0)
      steps.push({ name: phase, run: commands.join("\n"), uses: null, with: {} });
  }
  return {
    name: "AWS CodeBuild",
    triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false },
    globalEnv: doc.env?.variables || {},
    globalImage: null,
    jobs: [{
      id: "build", name: "Build", image: null, env: {}, needs: [],
      steps,
      allowFailure: false,
      artifacts: doc.artifacts ? { paths: toArr(doc.artifacts.files) } : null,
      cache: null,
    }],
  };
}

// ── Generators (Intermediate Representation → platform YAML) ─────────────────

function nonEmpty(lines) {
  return lines.filter((l) => l.trim());
}

function generateGitHub(ir) {
  const on = {};
  if (ir.triggers.push.branches.length > 0) on.push = { branches: ir.triggers.push.branches };
  if (ir.triggers.pullRequest.branches.length > 0) on.pull_request = { branches: ir.triggers.pullRequest.branches };
  if (!on.push && !on.pull_request) on.push = { branches: ["main"] };
  if (ir.triggers.manual) on.workflow_dispatch = {};

  const jobs = {};
  for (const job of ir.jobs) {
    const steps = [{ uses: "actions/checkout@v4" }];

    for (const step of job.steps) {
      if (step.uses && !step.uses.startsWith("actions/checkout")) {
        const s = { uses: step.uses };
        if (step.name) s.name = step.name;
        if (Object.keys(step.with).length) s.with = step.with;
        steps.push(s);
      } else if (step.run) {
        const clean = nonEmpty(step.run.split("\n")).join("\n").trim();
        if (clean) {
          const s = { run: clean };
          if (step.name) s.name = step.name;
          steps.push(s);
        }
      }
    }

    const jobObj = { "runs-on": "ubuntu-latest", steps };
    if (job.needs.length > 0) jobObj.needs = job.needs;
    if (Object.keys(job.env).length > 0) jobObj.env = job.env;
    if (job.allowFailure) jobObj["continue-on-error"] = true;
    jobs[job.id] = jobObj;
  }

  const doc = { name: ir.name, on };
  if (Object.keys(ir.globalEnv).length > 0) doc.env = ir.globalEnv;
  doc.jobs = jobs;
  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

function generateGitLab(ir) {
  const doc = {};
  const stageIds = [...new Set(ir.jobs.map((j) => j.id))];
  if (stageIds.length > 0) doc.stages = stageIds;
  if (ir.globalImage) doc.image = ir.globalImage;
  if (Object.keys(ir.globalEnv).length > 0) doc.variables = ir.globalEnv;

  for (const job of ir.jobs) {
    const scripts = job.steps.flatMap((s) =>
      s.run ? nonEmpty(s.run.split("\n")) : []
    );
    const jobObj = {
      stage: job.id,
      script: scripts.length > 0 ? scripts : ['echo "No commands"'],
    };
    if (job.image && job.image !== ir.globalImage) jobObj.image = job.image;
    if (Object.keys(job.env).length > 0) jobObj.variables = job.env;
    if (job.needs.length > 0) jobObj.needs = job.needs;
    if (job.allowFailure) jobObj.allow_failure = true;
    if (job.artifacts?.paths?.length > 0) jobObj.artifacts = { paths: job.artifacts.paths };
    if (job.cache) jobObj.cache = { paths: job.cache.paths, key: job.cache.key || undefined };
    doc[job.id] = jobObj;
  }
  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

function generateJenkins(ir) {
  const envBlock =
    Object.keys(ir.globalEnv).length > 0
      ? `\n    environment {\n${Object.entries(ir.globalEnv)
          .map(([k, v]) => `        ${k} = '${v}'`)
          .join("\n")}\n    }\n`
      : "";

  const stages = ir.jobs
    .map((job) => {
      const commands = job.steps.flatMap((s) =>
        s.run ? nonEmpty(s.run.split("\n")) : []
      );
      const stepsBody =
        commands.length > 0
          ? commands.map((c) => `                sh '${c.replace(/'/g, "\\'")}'`).join("\n")
          : `                echo '${job.name}'`;

      return `        stage('${job.name}') {\n            steps {\n${stepsBody}\n            }\n        }`;
    })
    .join("\n\n");

  return `pipeline {\n    agent any${envBlock}\n    stages {\n${stages}\n    }\n\n    post {\n        always {\n            echo 'Pipeline completed'\n        }\n    }\n}`;
}

function generateAzure(ir) {
  const trigger =
    ir.triggers.push.branches.length > 0
      ? { branches: { include: ir.triggers.push.branches } }
      : ["main"];
  const prTrigger =
    ir.triggers.pullRequest.branches.length > 0
      ? { branches: { include: ir.triggers.pullRequest.branches } }
      : undefined;

  const stages = ir.jobs.map((job) => {
    const steps = [{ checkout: "self" }];
    for (const step of job.steps) {
      if (!step.run) continue;
      const clean = nonEmpty(step.run.split("\n"))
        .filter((l) => !l.trimStart().startsWith("#"))
        .join("\n")
        .trim();
      if (clean) steps.push({ script: clean, displayName: step.name || undefined });
    }
    const jobObj = {
      job: job.id,
      displayName: job.name,
      pool: { vmImage: "ubuntu-latest" },
      steps,
    };
    if (job.needs.length > 0) jobObj.dependsOn = job.needs;
    if (Object.keys(job.env).length > 0) jobObj.variables = job.env;
    return { stage: job.id, displayName: job.name, jobs: [jobObj] };
  });

  const doc = { trigger };
  if (prTrigger) doc.pr = prTrigger;
  if (Object.keys(ir.globalEnv).length > 0) doc.variables = ir.globalEnv;
  doc.stages = stages;
  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

function generateBitbucket(ir) {
  const steps = ir.jobs.map((job) => {
    const script = job.steps.flatMap((s) => (s.run ? nonEmpty(s.run.split("\n")) : []));
    const stepObj = { name: job.name, script: script.length > 0 ? script : ['echo "No commands"'] };
    if (job.image) stepObj.image = job.image;
    if (job.artifacts?.paths?.length > 0) stepObj.artifacts = { paths: job.artifacts.paths };
    return { step: stepObj };
  });

  const doc = {};
  if (ir.globalImage) doc.image = ir.globalImage;
  doc.pipelines = { default: steps };
  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

function generateTravis(ir) {
  const job = ir.jobs[0];
  const image = job?.image || ir.globalImage || "generic";

  let language = "generic";
  let versionKey = null;
  let version = null;

  if (image.startsWith("node")) {
    language = "node_js";
    versionKey = "node_js";
    version = image.replace("node:", "") || "lts";
  } else if (image.startsWith("python")) {
    language = "python";
    versionKey = "python";
    version = image.replace("python:", "") || "3.11";
  } else if (image.startsWith("ruby")) {
    language = "ruby";
    versionKey = "rvm";
    version = image.replace("ruby:", "") || "3.2";
  }

  const allCommands = ir.jobs
    .flatMap((j) => j.steps)
    .flatMap((s) => (s.run ? nonEmpty(s.run.split("\n")).filter((l) => !l.trimStart().startsWith("#")) : []));

  const doc = { language };
  if (versionKey && version) doc[versionKey] = [version];
  if (allCommands.length > 0) {
    doc.script = allCommands.join("\n");
  }
  if (ir.triggers.push.branches.length > 0) doc.branches = { only: ir.triggers.push.branches };
  if (Object.keys(ir.globalEnv).length > 0)
    doc.env = { global: Object.entries(ir.globalEnv).map(([k, v]) => `${k}=${v}`) };
  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

function generateDrone(ir) {
  const steps = ir.jobs.flatMap((job) =>
    job.steps.map((step) => {
      const commands = step.run
        ? nonEmpty(step.run.split("\n")).filter((l) => !l.trimStart().startsWith("#"))
        : [];
      const s = {
        name: step.name || job.name,
        image: job.image || "alpine",
        commands: commands.length > 0 ? commands : ['echo "No commands"'],
      };
      if (Object.keys(job.env).length > 0) s.environment = job.env;
      if (job.needs.length > 0) s.depends_on = job.needs;
      return s;
    })
  );

  return yaml.dump({ kind: "pipeline", type: "docker", name: ir.name || "default", steps }, { lineWidth: 120, noRefs: true });
}

function generateSemaphore(ir) {
  const blocks = ir.jobs.map((job) => {
    const commands = job.steps.flatMap((s) =>
      s.run ? nonEmpty(s.run.split("\n")).filter((l) => !l.trimStart().startsWith("#")) : []
    );
    return {
      name: job.name,
      task: { jobs: [{ name: job.name, commands: commands.length > 0 ? commands : ['echo "No commands"'] }] },
    };
  });

  return yaml.dump(
    { version: "v1.0", name: ir.name || "Pipeline", agent: { machine: { type: "e1-standard-2", os_image: "ubuntu2004" } }, blocks },
    { lineWidth: 120, noRefs: true }
  );
}

function generateGoCD(doc) {
  const stages = doc.jobs.map((job) => {
    const tasks = job.steps.flatMap((s) =>
      s.run
        ? nonEmpty(s.run.split("\n"))
            .filter((l) => !l.trimStart().startsWith("#"))
            .map((cmd) => {
              const parts = cmd.trim().split(/\s+/);
              return { exec: { command: parts[0], arguments: parts.slice(1) } };
            })
        : []
    );
    return {
      [job.id]: {
        jobs: {
          [job.id]: { tasks: tasks.length > 0 ? tasks : [{ exec: { command: "echo", arguments: ["done"] } }] },
        },
      },
    };
  });

  const pipelineName = (doc.name || "pipeline").toLowerCase().replace(/\s+/g, "_");
  return yaml.dump(
    { format_version: 10, pipelines: { [pipelineName]: { group: "default", stages } } },
    { lineWidth: 120, noRefs: true }
  );
}

function generateCircleCI(ir) {
  const jobs = {};
  const workflowJobs = [];

  for (const job of ir.jobs) {
    const steps = ["checkout"];
    for (const step of job.steps) {
      if (!step.run) continue;
      const clean = nonEmpty(step.run.split("\n"))
        .filter((l) => !l.trimStart().startsWith("#"))
        .join("\n")
        .trim();
      if (!clean) continue;
      const lines = clean.split("\n");
      if (lines.length === 1) {
        steps.push({ run: step.name ? { name: step.name, command: lines[0] } : lines[0] });
      } else {
        steps.push({ run: { name: step.name || "Run", command: clean } });
      }
    }

    const jobObj = { docker: [{ image: job.image || "cimg/base:stable" }], steps };
    if (Object.keys(job.env).length > 0) jobObj.environment = job.env;
    jobs[job.id] = jobObj;

    const wfJob = {};
    if (job.needs.length > 0) wfJob.requires = job.needs;
    workflowJobs.push(Object.keys(wfJob).length > 0 ? { [job.id]: wfJob } : job.id);
  }

  const wfName = (ir.name || "pipeline").toLowerCase().replace(/\s+/g, "_");
  return yaml.dump(
    { version: "2.1", jobs, workflows: { [wfName]: { jobs: workflowJobs } } },
    { lineWidth: 120, noRefs: true }
  );
}

function generateCodeBuild(ir) {
  const allSteps = ir.jobs.flatMap((j) => j.steps);
  const installCmds = [];
  const buildCmds = [];
  const postCmds = [];

  for (const step of allSteps) {
    if (!step.run) continue;
    const lines = nonEmpty(step.run.split("\n")).filter((l) => !l.trimStart().startsWith("#"));
    const name = (step.name || "").toLowerCase();
    if (name.includes("install") || name.includes("setup") || name.includes("before")) {
      installCmds.push(...lines);
    } else if (name.includes("post") || name.includes("after") || name.includes("deploy")) {
      postCmds.push(...lines);
    } else {
      buildCmds.push(...lines);
    }
  }

  const doc = {
    version: 0.2,
    phases: {
      install: { commands: installCmds.length > 0 ? installCmds : ["echo install"] },
      build: { commands: buildCmds.length > 0 ? buildCmds : ["echo build"] },
    },
  };
  if (postCmds.length > 0) doc.phases.post_build = { commands: postCmds };

  const artifacts = ir.jobs.flatMap((j) => j.artifacts?.paths || []);
  if (artifacts.length > 0) doc.artifacts = { files: artifacts };
  if (Object.keys(ir.globalEnv).length > 0) doc.env = { variables: ir.globalEnv };

  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

function generateCodePipeline(ir) {
  const buildspec = generateCodeBuild(ir);
  return (
    "# AWS CodePipeline does not use a single pipeline YAML file.\n" +
    "# Below is the buildspec.yml to use in your CodeBuild action:\n\n" +
    buildspec
  );
}

// ── Parser & Generator maps ───────────────────────────────────────────────────

const PARSERS = {
  github: parseGitHub,
  gitlab: parseGitLab,
  circleci: parseCircleCI,
  azure: parseAzure,
  bitbucket: parseBitbucket,
  travis: parseTravis,
  drone: parseDrone,
  semaphore: parseSemaphore,
  gocd: parseGoCD,
  codebuild: parseCodeBuild,
};

const GENERATORS = {
  github: generateGitHub,
  gitlab: generateGitLab,
  jenkins: generateJenkins,
  azure: generateAzure,
  bitbucket: generateBitbucket,
  travis: generateTravis,
  drone: generateDrone,
  semaphore: generateSemaphore,
  gocd: generateGoCD,
  circleci: generateCircleCI,
  codebuild: generateCodeBuild,
  codepipeline: generateCodePipeline,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Converts a CI/CD pipeline YAML from one platform to another.
 * Runs entirely in the browser — no network requests.
 *
 * @param {string} sourceId  - Source platform id (e.g. "github")
 * @param {string} targetId  - Target platform id (e.g. "jenkins")
 * @param {string} inputText - Raw pipeline file content
 * @returns {string}         - Converted pipeline file content
 */
export function convert(sourceId, targetId, inputText) {
  let ir;

  try {
    if (sourceId === "jenkins") {
      ir = parseJenkins(inputText);
    } else if (sourceId === "codepipeline") {
      // CodePipeline uses CloudFormation — treat as generic YAML and extract what we can from CodeBuild phases if present
      const doc = yaml.load(inputText);
      ir = typeof doc === "object" && doc !== null && doc.phases
        ? parseCodeBuild(doc)
        : { name: "Pipeline", triggers: { push: { branches: [] }, pullRequest: { branches: [] }, manual: false }, globalEnv: {}, globalImage: null, jobs: [{ id: "build", name: "Build", image: null, env: {}, needs: [], steps: [{ name: "Build", run: "echo build", uses: null, with: {} }], allowFailure: false, artifacts: null, cache: null }] };
    } else {
      const doc = yaml.load(inputText);
      if (!doc || typeof doc !== "object") throw new Error("YAML inválido ou vazio.");
      const parser = PARSERS[sourceId];
      if (!parser) throw new Error(`Plataforma de origem não suportada: ${sourceId}`);
      ir = parser(doc, inputText);
    }
  } catch (e) {
    if (e.message.startsWith("Plataforma") || e.message.startsWith("YAML")) throw e;
    throw new Error(`Erro ao analisar o YAML de origem: ${e.message}`);
  }

  const generator = GENERATORS[targetId];
  if (!generator) throw new Error(`Plataforma de destino não suportada: ${targetId}`);

  return generator(ir);
}
