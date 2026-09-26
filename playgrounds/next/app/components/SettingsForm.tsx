'use client'

import { useState } from 'react'

export function SettingsForm() {
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  return (
    <form
      className="settings-form"
      onSubmit={(e) => {
        e.preventDefault()
        setSaved(true)
      }}
    >
      <label>
        <span>Workspace name</span>
        <input defaultValue="Source Lab" name="workspace" />
      </label>
      <label>
        <span>Default branch</span>
        <select defaultValue="main" name="branch">
          <option value="main">main</option>
          <option value="develop">develop</option>
        </select>
      </label>
      <label className="switch-row">
        <span>Build notifications</span>
        <input
          type="checkbox"
          checked={notifications}
          onChange={e => setNotifications(e.target.checked)}
        />
      </label>
      <div className="form-actions">
        <button type="submit">Save settings</button>
        {saved && <span role="status">Saved</span>}
      </div>
    </form>
  )
}
