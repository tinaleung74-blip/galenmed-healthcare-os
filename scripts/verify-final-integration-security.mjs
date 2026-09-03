import {
  execFileSync,
} from "node:child_process"
import {
  readFileSync,
  statSync,
} from "node:fs"
import {
  extname,
  resolve,
} from "node:path"

const projectRoot =
  process.cwd()

const failures = []

function fail(
  message
) {
  failures.push(
    message
  )
}

function readProjectFile(
  relativePath
) {
  const fullPath =
    resolve(
      projectRoot,
      relativePath
    )

  try {
    return readFileSync(
      fullPath,
      "utf8"
    )
  } catch {
    fail(
      `Missing required file: ${relativePath}`
    )

    return ""
  }
}

function assertContains(
  relativePath,
  expectedValue,
  label
) {
  const content =
    readProjectFile(
      relativePath
    )

  if (
    !content.includes(
      expectedValue
    )
  ) {
    fail(
      `${label}: ${relativePath}`
    )
  }
}

function getGitOutput(
  args
) {
  return execFileSync(
    "git",
    args,
    {
      cwd:
        projectRoot,

      encoding:
        "utf8",

      stdio: [
        "ignore",
        "pipe",
        "pipe",
      ],
    }
  ).trim()
}

const currentBranch =
  getGitOutput([
    "branch",
    "--show-current",
  ])

if (
  currentBranch !==
  "feature/final-integration-hardening"
) {
  fail(
    `Expected feature/final-integration-hardening, found ${currentBranch || "detached HEAD"}`
  )
}

try {
  execFileSync(
    "git",
    [
      "check-ignore",
      "-q",
      ".env.local",
    ],
    {
      cwd:
        projectRoot,

      stdio:
        "ignore",
    }
  )
} catch {
  fail(
    ".env.local is not ignored by Git."
  )
}

const requiredRoutePrefixes = [
  '"/admin"',
  '"/reception"',
  '"/doctor"',
  '"/laboratory"',
  '"/cashier"',
]

for (
  const routePrefix of
  requiredRoutePrefixes
) {
  assertContains(
    "src/lib/auth/portal-route-policy.ts",
    routePrefix,
    `Missing protected staff route prefix ${routePrefix}`
  )
}

const quarantinedRoutes = [
  '"/appointments"',
  '"/billing"',
  '"/consultations"',
  '"/dashboard"',
  '"/patients"',
  '"/pharmacy"',
  '"/radiology"',
  '"/reports"',
  '"/settings"',
]

for (
  const routePrefix of
  quarantinedRoutes
) {
  assertContains(
    "src/lib/auth/portal-route-policy.ts",
    routePrefix,
    `Missing legacy quarantine route ${routePrefix}`
  )
}

assertContains(
  "src/proxy.ts",
  '"legacy-staff-quarantine"',
  "Legacy route quarantine is missing"
)

assertContains(
  "src/proxy.ts",
  'accountType ===\n      "patient"',
  "Patient-to-staff route rejection is missing"
)

assertContains(
  "src/proxy.ts",
  'accountType ===\n      "staff"',
  "Staff-to-patient route rejection is missing"
)

assertContains(
  "src/features/auth/utils/staff-auth.server.ts",
  ') === "patient"',
  "Server-side staff guard does not reject explicit patient accounts"
)

assertContains(
  "src/features/patient-portal/utils/patient-auth.server.ts",
  ') === "staff"',
  "Server-side patient guard does not reject explicit staff accounts"
)

assertContains(
  "next.config.ts",
  "X-Frame-Options",
  "Clickjacking header is missing"
)

assertContains(
  "next.config.ts",
  "no-store",
  "Sensitive-route no-store header is missing"
)

assertContains(
  "next.config.ts",
  "X-Robots-Tag",
  "Portal no-index header is missing"
)

assertContains(
  "src/app/page.tsx",
  'href="/staff/login"',
  "Root Staff Portal entry is missing"
)

assertContains(
  "src/app/page.tsx",
  'href="/patient/login"',
  "Root Patient Portal entry is missing"
)

const trackedAndUntracked =
  getGitOutput([
    "ls-files",
    "-co",
    "--exclude-standard",
  ])
    .split(/\r?\n/)
    .filter(Boolean)

const textExtensions =
  new Set([
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".json",
    ".sql",
    ".md",
    ".txt",
    ".toml",
    ".yml",
    ".yaml",
    ".ps1",
  ])

const completeSecretPattern =
  /sb_secret_[A-Za-z0-9_-]{20,}/g

for (
  const relativePath of
  trackedAndUntracked
) {
  const fullPath =
    resolve(
      projectRoot,
      relativePath
    )

  let stats

  try {
    stats =
      statSync(
        fullPath
      )
  } catch {
    continue
  }

  if (
    !stats.isFile() ||
    !textExtensions.has(
      extname(
        relativePath
      ).toLowerCase()
    )
  ) {
    continue
  }

  let content

  try {
    content =
      readFileSync(
        fullPath,
        "utf8"
      )
  } catch {
    continue
  }

  if (
    completeSecretPattern.test(
      content
    )
  ) {
    fail(
      `Complete Supabase secret literal detected in ${relativePath}`
    )
  }

  completeSecretPattern.lastIndex =
    0

  if (
    content.includes(
      '@/lib/supabase/admin'
    ) &&
    /^\s*["']use client["']/.test(
      content
    )
  ) {
    fail(
      `Client file imports the Supabase Admin client: ${relativePath}`
    )
  }
}

if (
  failures.length > 0
) {
  console.error(
    "\nFINAL INTEGRATION SECURITY VERIFICATION FAILED\n"
  )

  for (
    const failure of
    failures
  ) {
    console.error(
      `- ${failure}`
    )
  }

  process.exit(
    1
  )
}

console.log(
  "FINAL INTEGRATION SECURITY STATIC VERIFICATION PASSED."
)
console.log(
  "Staff/Patient route separation: PASS"
)
console.log(
  "Legacy module quarantine: PASS"
)
console.log(
  "Security headers: PASS"
)
console.log(
  "Secret-literal scan: PASS"
)
console.log(
  "Client/Admin import boundary: PASS"
)
