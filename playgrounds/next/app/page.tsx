'use client'

import { useEffect, useState } from 'react'
import { ActivityFeed } from './components/ActivityFeed'
import { MetricCard } from './components/MetricCard'
import { SettingsForm } from './components/SettingsForm'

type Route = '/' | '/dashboard' | '/settings'

const getRoute = (): Route =>
  (['/', '/dashboard', '/settings'].includes(window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : '/') as Route

function HomePage() {
  return (
    <>
      <section className="hero-panel">
        <p>Next.js playground · route /</p>
        <h1>Grab this interface.</h1>
        <p className="lede">
          Exercise source lookup across links, nested components, controls, and stateful content.
        </p>
        <a className="primary-action" href="#/dashboard">
          Open dashboard
        </a>
      </section>
      <section className="metric-grid">
        <MetricCard label="Latency" value="42ms" tone="green" />
        <MetricCard label="Routes" value="18" tone="blue" />
        <MetricCard label="Warnings" value="3" tone="amber" />
      </section>
    </>
  )
}

function DashboardPage() {
  const [deployed, setDeployed] = useState(false)
  const activities = [
    { actor: 'Mina Chen', action: 'merged the search filters', time: '8m ago' },
    { actor: 'Ari Singh', action: 'updated the release notes', time: '26m ago' },
    { actor: 'Build bot', action: 'published preview #184', time: '1h ago' },
  ]

  return (
    <>
      <section className="page-heading">
        <div>
          <p>Route /dashboard</p>
          <h1>Release overview</h1>
        </div>
        <button type="button" onClick={() => setDeployed(!deployed)}>
          {deployed ? 'Deployed' : 'Deploy preview'}
        </button>
      </section>
      <section className="metric-grid">
        <MetricCard label="Open pull requests" value="12" tone="blue" />
        <MetricCard label="Passing checks" value="98%" tone="green" />
        <MetricCard label="Needs review" value="4" tone="amber" />
      </section>
      <section className="content-grid">
        <article className="content-panel">
          <h2>Recent activity</h2>
          <ActivityFeed items={activities} />
        </article>
        <article className="content-panel">
          <h2>Deploy status</h2>
          <p className="status-copy">
            {deployed
              ? 'Preview deployment is live and ready for review.'
              : 'No preview is currently deployed.'}
          </p>
          <a href="#/settings">Review workspace settings</a>
        </article>
      </section>
    </>
  )
}

function SettingsPage() {
  return (
    <>
      <section className="page-heading">
        <div>
          <p>Route /settings</p>
          <h1>Workspace settings</h1>
        </div>
      </section>
      <section className="settings-layout">
        <article className="content-panel">
          <h2>General</h2>
          <p className="status-copy">Configure the defaults shared by this workspace.</p>
          <SettingsForm />
        </article>
        <aside className="help-panel">
          <h2>Testing targets</h2>
          <p>Inspect inputs, select, checkbox, action button, and success state to exercise source resolution.</p>
        </aside>
      </section>
    </>
  )
}

export default function Page() {
  const [route, setRoute] = useState<Route>('/')

  useEffect(() => {
    setRoute(getRoute())
    const sync = () => setRoute(getRoute())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const ActiveComponent =
    route === '/dashboard' ? DashboardPage : route === '/settings' ? SettingsPage : HomePage

  return (
    <div className="playground-shell">
      <header className="app-header">
        <a className="brand" href="#/">
          Source Lab
        </a>
        <nav className="app-nav" aria-label="Playground pages">
          <a className={route === '/' ? 'active' : ''} href="#/">
            Home
          </a>
          <a className={route === '/dashboard' ? 'active' : ''} href="#/dashboard">
            Dashboard
          </a>
          <a className={route === '/settings' ? 'active' : ''} href="#/settings">
            Settings
          </a>
        </nav>
      </header>
      <main className="page-shell">
        <ActiveComponent />
      </main>
    </div>
  )
}
