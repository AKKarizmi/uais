"use client";
import { WorkspacePreview, previewDisclaimer } from '@/components/dashboard/workspace-preview';

import { Pill, Panel } from "./shared";
export function SettingsFeature() {
  return (
    <div className="settings-grid">
      <Panel title="Interface preferences">
        <div className="settings-row">
          <div>
            <strong>Appearance</strong>
            <p>
              Use the demo profile menu to switch between light and dark themes.
            </p>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <strong>Workspace Preview</strong>
            <p>{previewDisclaimer}</p>
          </div>
          <WorkspacePreview/>
        </div>
        <div className="settings-row">
          <div>
            <strong>Version</strong>
            <p>UAIS Web Operations Hub 0.2.0 Alpha</p>
          </div>
          <Pill>Demo</Pill>
        </div>
      </Panel>
      <Panel
        title="Server policies (future)"
        sub="Configuration will be performed by Codex against authenticated API endpoints."
      >
        <div className="settings-row">
          <div>
            <strong>Editing lock lease</strong>
            <p>Lease expiration, heartbeat and override evidence.</p>
          </div>
          <Pill>Backend</Pill>
        </div>
        <div className="settings-row">
          <div>
            <strong>Mandatory student fields</strong>
            <p>Pending your release-specific requirements.</p>
          </div>
          <Pill>Pending spec</Pill>
        </div>
        <div className="settings-row">
          <div>
            <strong>Daily attendance timezone</strong>
            <p>Organization-configured; not derived from staff browsers.</p>
          </div>
          <Pill>Backend</Pill>
        </div>
        <div className="settings-row">
          <div>
            <strong>Data retention & backups</strong>
            <p>
              Private storage, permissions, encryption and recovery policies.
            </p>
          </div>
          <Pill>Backend</Pill>
        </div>
      </Panel>
    </div>
  );
}
