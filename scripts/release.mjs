import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import readline from 'node:readline'

const PACKAGES = [
  'packages/core',
  'packages/client',
  'packages/vite-react',
  'packages/vite-vue',
  'packages/vite-svelte',
  'packages/next',
  'packages/nuxt',
  'packages/unplugin',
]

const PUBLISH_PACKAGES = [
  '@inspect-devtools/core',
  '@inspect-devtools/client',
  '@inspect-devtools/vite-react',
  '@inspect-devtools/vite-vue',
  '@inspect-devtools/vite-svelte',
  '@inspect-devtools/next',
  '@inspect-devtools/nuxt',
  '@inspect-devtools/unplugin',
]

const log = {
  info: (msg) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✔ ${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m⚠ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m✖ ${msg}\x1b[0m`),
  step: (step, msg) => console.log(`\n\x1b[35m[${step}] ${msg}\x1b[0m`),
}

const run = (cmd, options = {}) => {
  console.log(`\x1b[90m$ ${cmd}\x1b[0m`)
  return execSync(cmd, { stdio: 'inherit', ...options })
}

const runOutput = (cmd) => {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
}

const getNextSemver = (version, type) => {
  const [major, minor, patch] = version.split('.').map(Number)
  if (type === 'patch')
    return `${major}.${minor}.${patch + 1}`
  if (type === 'minor')
    return `${major}.${minor + 1}.0`
  if (type === 'major')
    return `${major + 1}.0.0`
  return version
}

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolvePrompt) => {
    rl.question(query, (ans) => {
      rl.close()
      resolvePrompt(ans.trim())
    })
  })
}

async function main() {
  log.info('Inspect Devtools 发布准备...')

  // 1. 检查 npm 登录状态
  log.step('1/6', '检查 npm 登录状态...')
  try {
    const user = runOutput('npm whoami --registry=https://registry.npmjs.org')
    log.success(`已登录 npm 账号: ${user}`)
  }
  catch {
    log.error('未检测到有效的 npm 登录凭证。请先在终端运行 `npm login` 进行登录。')
    process.exit(1)
  }

  // 2. 读取当前版本并计算推荐版本
  const rootPkgPath = resolve(PACKAGES[0], 'package.json')
  const currentVersion = JSON.parse(readFileSync(rootPkgPath, 'utf-8')).version
  const patchVersion = getNextSemver(currentVersion, 'patch')
  const minorVersion = getNextSemver(currentVersion, 'minor')
  const majorVersion = getNextSemver(currentVersion, 'major')

  console.log(`\n当前版本: \x1b[32m${currentVersion}\x1b[0m`)
  console.log(`1) patch (${patchVersion})`)
  console.log(`2) minor (${minorVersion})`)
  console.log(`3) major (${majorVersion})`)
  console.log(`4) 自定义输入`)

  const choice = await askQuestion('\n请选择发布类型 (1/2/3/4) [默认 1]: ')

  let targetVersion = patchVersion
  if (choice === '2')
    targetVersion = minorVersion
  else if (choice === '3')
    targetVersion = majorVersion
  else if (choice === '4' || (choice && !['1', '2', '3'].includes(choice))) {
    if (choice === '4')
      targetVersion = await askQuestion('请输入自定义版本号 (例如 0.8.0): ')
    else
      targetVersion = choice
  }

  if (!/^\d+\.\d+\.\d+.*$/.test(targetVersion)) {
    log.error(`无效的版本号: ${targetVersion}`)
    process.exit(1)
  }

  const confirm = await askQuestion(`\n确认将版本发布为 \x1b[32mv${targetVersion}\x1b[0m 并推送到 GitHub 和 npm? (y/N): `)
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    log.warn('已取消发布。')
    process.exit(0)
  }

  // 3. 执行全量类型检查、测试与构建
  log.step('2/6', '执行全量检查与构建 (pnpm release:check)...')
  run('pnpm release:check')

  // 4. 更新子包 package.json 版本号
  log.step('3/6', `同步更新包版本号为 ${targetVersion}...`)
  for (const pkg of PACKAGES) {
    const pkgJsonPath = resolve(pkg, 'package.json')
    const json = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    json.version = targetVersion
    writeFileSync(pkgJsonPath, `${JSON.stringify(json, null, 2)}\n`)
  }
  log.success(`已更新 ${PACKAGES.length} 个子包的 package.json 版本号`)

  // 5. Git 提交并打标签
  log.step('4/6', '创建 Git Commit 与 Tag...')
  run('git add -A')
  try {
    run(`git commit -m "chore(release): v${targetVersion}"`)
  }
  catch {}
  run(`git tag v${targetVersion}`)

  // 6. 推送到 GitHub
  log.step('5/6', '推送到 GitHub 远程仓库...')
  const currentBranch = runOutput('git branch --show-current') || 'main'
  run(`git push origin ${currentBranch} --tags`)
  log.success(`成功推送分支 ${currentBranch} 与 Tag v${targetVersion} 到 GitHub`)

  // 7. 发布至 npm
  log.step('6/6', '按依赖拓扑发布至 npm...')
  for (const pkgName of PUBLISH_PACKAGES) {
    log.info(`正在发布 ${pkgName}...`)
    run(`pnpm --filter ${pkgName} publish --access public --no-git-checks --registry=https://registry.npmjs.org`)
  }

  console.log(`\n\x1b[32m🎉 恭喜！版本 v${targetVersion} 已成功一键发布至 GitHub 和 npm！\x1b[0m\n`)
}

main().catch((error) => {
  log.error(`发布流程异常中止: ${error.message}`)
  process.exit(1)
})
