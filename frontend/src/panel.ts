import { LitElement, html, nothing, type PropertyValues } from "lit";
import { decodeMask, encodeMask, mToFt, renderFan } from "./fan";
import { mark, wordmark } from "./brand";
import { discover, type Sensor } from "./discovery";
import { DEFAULT_LOST_S, DEFAULT_REARM_MIN, PROFILES } from "./profile";
import { aimView, pillText } from "./aim";
import { lastSeen, type HomeAssistant } from "./hass";
import { styles } from "./styles";
import { regionsForCell, type RegionDefinition } from "./regions";

declare const __BLIP_VERSION__: string;

const SENSOR_KEY = "blip.sensor";
const INTEGRATIONS = { zigbee2mqtt: "Zigbee2MQTT", zha: "ZHA", matter: "Matter" } as const;
const ISSUES = "https://github.com/blip-ha/blip/issues/new";

/**
 * "Report a problem": opens the bug report form pre-filled with versions and the sensor's model.
 * Deliberately no device names, entity ids or Home Assistant addresses.
 */
export function reportUrl(blipVersion: string, haVersion: string | undefined, sensor?: Sensor, model?: string | null): string {
  const q = new URLSearchParams({ template: "bug_report.yml", blip: `v${blipVersion}` });
  if (haVersion) q.set("ha", haVersion);
  if (sensor) {
    const name = sensor.profile.name;
    const what = model && !name.toLowerCase().includes(model.toLowerCase()) ? `${name} (${model})` : name;
    q.set("sensor", `${what} via ${INTEGRATIONS[sensor.profile.integration]}`);
  }
  return `${ISSUES}?${q}`;
}
const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable */
    }
  },
};

/** Blip's sidebar panel. Home Assistant sets `hass` and `narrow`. */
export class BlipPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    selected: { state: true },
    aimOn: { state: true },
    draft: { state: true },
    sel: { state: true },
    pendingMask: { state: true },
    saveError: { state: true },
    aimStart: { state: true },
    now: { state: true },
  };

  static styles = styles;

  declare hass?: HomeAssistant;
  declare narrow: boolean;
  declare private selected: string;
  declare private aimOn: boolean;
  declare private draft: boolean[] | null; // edit mode when set
  declare private sel: number; // band selected in edit mode
  declare private pendingMask: number | null; // saved, waiting for the sensor to confirm
  declare private saveError: string;
  declare private aimStart: number;
  declare private now: number;

  private sensors: Sensor[] = [];
  private fp1Regions = new Map<string, RegionDefinition[]>();
  private sensorsKey = ""; // what the list was built from
  private registries?: [unknown, unknown];
  private rearm?: number;
  private clock?: number;

  constructor() {
    super();
    this.narrow = false;
    this.selected = "";
    this.aimOn = false;
    this.draft = null;
    this.sel = 0;
    this.pendingMask = null;
    this.saveError = "";
    this.aimStart = 0;
    this.now = Date.now();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAim();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("hass") && this.hass) {
      this.refreshSensors();
      this.checkSaveConfirmed();
    }
  }

  /**
   * A saved band edit waits in Zigbee2MQTT until the sensor wakes. Once the sensor reports the
   * new mask, the save is confirmed. Writing the mask can end the sensor's distance tracking, so
   * if the aim test is on, press Track again and restart the 10-minute re-arm from now.
   */
  private checkSaveConfirmed() {
    if (this.pendingMask === null) return;
    const s = this.current();
    const raw = s?.entities.range ? this.hass!.states[s.entities.range]?.state : undefined;
    if (raw === undefined || raw === "" || Number(raw) !== this.pendingMask) return;
    this.pendingMask = null;
    if (this.aimOn) this.rearmTrack();
  }

  /** Re-discover only when the registries or the set of entities change, not on every state update. */
  private refreshSensors() {
    const hass = this.hass!;
    const key = Object.keys(hass.states).length + "";
    if (this.registries?.[0] === hass.entities && this.registries?.[1] === hass.devices && key === this.sensorsKey) return;
    this.registries = [hass.entities, hass.devices];
    this.sensorsKey = key;
    this.sensors = discover(hass, PROFILES);
    if (!this.sensors.some((s) => s.key === this.selected)) {
      const saved = store.get(SENSOR_KEY);
      this.selected = this.sensors.find((s) => s.key === saved)?.key ?? this.sensors[0]?.key ?? "";
    }
  }

  private current() {
    return this.sensors.find((x) => x.key === this.selected);
  }

  private call(domain: string, service: string, data: Record<string, unknown>) {
    return this.hass!.callService(domain, service, data);
  }

  /** Ask the sensor to stream distance. It queues in Zigbee2MQTT until the sensor next wakes. */
  private pressTrack() {
    const s = this.current();
    if (!this.hass || !s?.entities.track) return;
    this.call("button", "press", { entity_id: s.entities.track }).catch(() => {
      /* shown as "waiting"; the next re-arm retries */
    });
  }

  /** Press Track now and restart the re-arm interval from this moment. */
  private rearmTrack() {
    window.clearInterval(this.rearm);
    this.pressTrack();
    const min = this.current()?.profile.behavior.track_rearm_min ?? DEFAULT_REARM_MIN;
    this.rearm = window.setInterval(() => this.pressTrack(), min * 60 * 1000);
  }

  private startAim() {
    this.aimOn = true;
    this.aimStart = Date.now();
    this.now = this.aimStart;
    this.rearmTrack();
    this.clock = window.setInterval(() => (this.now = Date.now()), 250);
  }

  private stopAim() {
    this.aimOn = false;
    window.clearInterval(this.rearm);
    window.clearInterval(this.clock);
  }

  private toggleAim() {
    this.aimOn ? this.stopAim() : this.startAim();
  }

  private startEdit(current: boolean[]) {
    this.draft = [...current];
    this.sel = 0;
    this.saveError = "";
  }

  private cancelEdit() {
    this.draft = null;
    this.saveError = "";
  }

  /** Cancel button: leave edit mode and, if the aim test is on, re-send Track. */
  private onCancel() {
    this.cancelEdit();
    if (this.aimOn) this.pressTrack();
  }

  private toggleBand(i: number) {
    if (!this.draft) return;
    const next = [...this.draft];
    next[i] = !next[i];
    this.draft = next;
  }

  private async saveBands() {
    const s = this.current();
    if (!this.hass || !s || !this.draft) return;
    if (!this.draft.some(Boolean)) {
      this.saveError = "Turn on at least one band.";
      return;
    }
    const mask = encodeMask(this.draft);
    try {
      await this.call("number", "set_value", { entity_id: s.entities.range, value: mask });
      this.pendingMask = mask;
      this.draft = null;
      this.saveError = "";
    } catch {
      this.saveError = "Couldn't save. Check your connection and try again.";
    }
  }

  private pick(e: Event) {
    this.stopAim();
    this.cancelEdit();
    this.pendingMask = null;
    this.selected = (e.target as HTMLSelectElement).value;
    store.set(SENSOR_KEY, this.selected);
  }

  private toggleMenu() {
    // Same event HA's own menu button fires: opens the sidebar on phones.
    this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  // ---------- views ----------

  private renderHeader() {
    return html`<header>
      ${this.narrow
        ? html`<button class="menu" aria-label="Open sidebar" @click=${this.toggleMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" fill="currentColor" /></svg>
          </button>`
        : nothing}
      <h1 class="title">${wordmark()}</h1>
    </header>`;
  }

  private renderFooter() {
    const s = this.current();
    const model = s ? this.hass?.devices?.[s.key]?.model : undefined;
    return html`<div class="footmark">${mark(44, "blip")}</div>
      <p class="ver">v${__BLIP_VERSION__}</p>
      <p class="report"><a href=${reportUrl(__BLIP_VERSION__, this.hass?.config?.version, s, model)} target="_blank" rel="noopener noreferrer">Report a problem</a></p>`;
  }

  render() {
    if (!this.hass)
      return html`<main>${this.renderHeader()}<div class="card"><p class="muted">Connecting to Home Assistant…</p></div></main>`;
    const s = this.current();
    if (!s)
      return html`<main>
        ${this.renderHeader()}
        <div class="card">
          <h2>No supported sensor found</h2>
          <p class="muted">Blip works with:</p>
          <ul class="supported">
            ${PROFILES.map((p) => html`<li>${p.name} <span class="muted">(${INTEGRATIONS[p.integration]})</span></li>`)}
          </ul>
        </div>
        ${this.renderFooter()}
      </main>`;
    if (s.profile.mode === "regions") return this.renderRegions(s);
    return this.renderSensor(s);
  }

  private renderRegions(s: Sensor) {
    const geometry = s.profile.regions!;
    const cells = Array.from(
      { length: geometry.columns * geometry.rows },
      (_, i) => ({
        x: (i % geometry.columns) + 1,
        y: Math.floor(i / geometry.columns) + 1,
      })
    );

    const configuredRegions = this.fp1Regions.get(s.key) ?? [];

    const state = s.entities.presence
      ? this.hass!.states[s.entities.presence]?.state
      : undefined;
    const presence = state === "on";
    const offline = state !== "on" && state !== "off";

    return html`<main>
      ${this.renderHeader()}
      <label class="sensor">
        <span class="sensor-label">Sensor</span>
        ${this.sensors.length > 1
          ? html`<span class="select-wrap">
              <select class="picker" .value=${s.key} @change=${this.pick}>
                ${this.sensors.map((x) => html`<option value=${x.key} ?selected=${x.key === s.key}>${x.name}</option>`)}
              </select>
              <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>`
          : html`<span class="picker single">${s.name}</span>`}
      </label>
      <section class="card">
        <p class="muted">Aqara FP1 · Regions</p>
      </section>
      <section class="card">
        <h2>Detection grid</h2>
        <p class="muted">Sensor position</p>
        <div
          style="display:grid;grid-template-columns:repeat(${geometry.columns},minmax(0,1fr));gap:6px;margin:16px 0"
          aria-label="FP1 detection grid"
        >
          ${cells.map((cell) => html`
            <div
              class="card"
              style="padding:12px 4px;text-align:center;margin:0"
              title="X${cell.x}, Y${cell.y}"
              data-region-cell="X${cell.x}Y${cell.y}"
              data-regions="${regionsForCell(cell.x, cell.y, configuredRegions).join(",")}"
            >
              X${cell.x} Y${cell.y}
              ${regionsForCell(cell.x, cell.y, configuredRegions).length
                ? html`<small>Region ${regionsForCell(cell.x, cell.y, configuredRegions).join(", ")}</small>`
                : nothing}
            </div>
          `)}
        </div>
        <p class="muted">
          ${geometry.columns} × ${geometry.rows} cells ·
          Up to ${geometry.max_regions} regions
        </p>
        <p class="muted">Grid preview only — cell occupancy is not available.</p>
      </section>
      <section class="card status ${offline ? "" : presence ? "present" : ""}">
        <div class="icon" aria-hidden="true">${presence ? "●" : "○"}</div>
        <div>
          <h2>${offline ? "Sensor offline" : presence ? "Presence detected" : "No presence detected"}</h2>
          <p class="muted">mmWave ${offline ? "unavailable" : presence ? "on" : "off"}</p>
        </div>
      </section>
      ${this.renderFooter()}
    </main>`;
  }

  private renderSensor(s: Sensor) {
    const { profile } = s;
    const band = profile.band!;
    const e = s.entities;
    const st = (id?: string) => (id ? this.hass!.states[id] : undefined);
    const maskState = st(e.range)?.state;
    const mask = Number(maskState);
    const known = maskState !== undefined && maskState !== "" && !Number.isNaN(mask);
    const enabled = known ? decodeMask(mask, band.count) : Array<boolean>(band.count).fill(true);
    const editing = this.draft !== null;
    const shown = editing ? this.draft! : this.pendingMask !== null ? decodeMask(this.pendingMask, band.count) : enabled;
    const draftOn = editing ? this.draft!.filter(Boolean).length : 0;
    const changed = editing && encodeMask(this.draft!) !== encodeMask(enabled);
    const onCount = enabled.filter(Boolean).length;
    const presence = st(e.presence)?.state === "on";
    const pir = st(e.pir)?.state === "on";
    const battery = st(e.battery)?.state;
    const offline = st(e.presence)?.state === "unavailable";
    const maxFt = mToFt((enabled.lastIndexOf(true) + 1) * band.size_m);

    const dist = st(e.distance);
    const meters = Number(dist?.state);
    const view = aimView({
      band,
      lostMs: (profile.behavior.lost_after_s ?? DEFAULT_LOST_S) * 1000,
      aimOn: this.aimOn,
      aimStart: this.aimStart,
      now: this.now,
      presence,
      enabled,
      distance: dist && !Number.isNaN(meters) ? { meters, seenAt: lastSeen(dist) } : undefined,
    });
    const { live, active, lost, waitedS } = view;
    const pill = pillText({
      band,
      editing,
      draftOn,
      pending: this.pendingMask !== null,
      aimOn: this.aimOn,
      known,
      onCount,
      maxFt,
      view,
    });

    return html`<main>
      ${this.renderHeader()}

      <label class="sensor">
        <span class="sensor-label">Sensor</span>
        ${this.sensors.length > 1
          ? html`<span class="select-wrap">
              <select class="picker" .value=${s.key} @change=${this.pick}>
                ${this.sensors.map((x) => html`<option value=${x.key} ?selected=${x.key === s.key}>${x.name}</option>`)}
              </select>
              <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>`
          : html`<span class="picker single">${s.name}</span>`}
      </label>

      <section class="card status ${offline ? "" : presence ? "present" : ""}">
        <div class="icon" aria-hidden="true">${presence ? "●" : "○"}</div>
        <div>
          <h2>${offline ? "Sensor offline" : presence ? "Someone's here" : "No one detected"}</h2>
          <p class="muted">mmWave ${presence ? "on" : "off"} · PIR ${pir ? "on" : "off"}</p>
          ${battery !== undefined ? html`<p class="muted batt">Battery ${battery}%</p>` : nothing}
        </div>
      </section>

      <section class="card aim">
        <div class="aim-row">
          <div>
            <h2>Aim test</h2>
            <p class="muted">See which band responds as you walk the room.</p>
          </div>
          <button
            class="switch ${this.aimOn ? "on" : ""}"
            role="switch"
            aria-checked=${this.aimOn ? "true" : "false"}
            aria-label="Aim test"
            ?disabled=${!e.track || !e.distance}
            @click=${this.toggleAim}
          ><i></i></button>
        </div>
        ${!e.track || !e.distance
          ? html`<p class="muted aim-note">This sensor doesn't expose distance tracking.</p>`
          : this.aimOn
            ? live
              ? html`<div class="aim-state live"><strong>Coverage test active</strong><span>The band you're in lights up as you move.</span></div>`
              : profile.behavior.sleepy
                ? html`<div class="aim-state wait"><strong>Tap your sensor's button once</strong><span>Quick tap, don't hold (holding can reset it). Waiting for sensor… ${waitedS}s</span></div>`
                : html`<div class="aim-state wait"><strong>Waiting for sensor…</strong><span>${waitedS}s</span></div>`
            : nothing}
      </section>

      <div class="pill-row">
        <div class="pill ${lost ? "lost" : active !== undefined ? "hot" : ""}" role="status">${pill}</div>
        ${editing
          ? nothing
          : html`<button class="ghost editbtn" @click=${() => this.startEdit(this.pendingMask !== null ? decodeMask(this.pendingMask, band.count) : enabled)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
              Edit bands
            </button>`}
      </div>
      ${this.pendingMask !== null && !editing
        ? html`<p class="muted pending">Saved. Tap your sensor's button once to apply it now, or it applies on the sensor's next check-in.</p>`
        : nothing}

      <div class="fan">${renderFan({ band, angleDeg: profile.field_of_view.angle_deg, enabled: shown, presence: false, active: editing ? undefined : active, lost: !editing && !!lost, editing, selected: this.sel })}</div>

      <div class="legend">
        <span><i class="sw here"></i> you're here</span><span><i class="sw lost"></i> lost you</span>
        <span><i class="sw on"></i> band on</span>
        <span><i class="sw off"></i> band off</span>
      </div>
      <p class="note">Outline is the rated ${profile.field_of_view.angle_deg}°. Edges may be shorter.</p>

      ${editing
        ? html`<section class="card edit">
            <h2>Edit bands</h2>
            <p class="muted">Tap a band to switch it on or off. Band 1 is closest to the sensor.</p>
            <div class="chips">
              ${this.draft!.map(
                (on, i) => html`<button
                  class="chip ${on ? "on" : "off"} ${i === this.sel ? "sel" : ""}"
                  aria-pressed=${on ? "true" : "false"}
                  aria-label=${`Band ${i + 1}, ${mToFt(i * band.size_m).toFixed(1)} to ${mToFt((i + 1) * band.size_m).toFixed(1)} feet, ${on ? "on" : "off"}`}
                  @click=${() => {
                    this.sel = i;
                    this.toggleBand(i);
                  }}
                >
                  <strong>${i + 1}</strong>
                  <span>${mToFt(i * band.size_m).toFixed(1)}–${mToFt((i + 1) * band.size_m).toFixed(1)}</span>
                </button>`,
              )}
            </div>
            <p class="chip-unit">Distances in feet</p>
            <div class="edit-actions">
              <button class="ghost" @click=${() => (this.draft = Array<boolean>(band.count).fill(true))}>All on</button>
              <button class="ghost" @click=${this.onCancel}>Cancel</button>
              <button class="primary" ?disabled=${!changed} @click=${this.saveBands}>Save</button>
            </div>
            ${this.saveError ? html`<p class="err">${this.saveError}</p>` : nothing}
          </section>`
        : nothing}

      ${this.renderFooter()}
    </main>`;
  }
}

if (!customElements.get("blip-panel")) customElements.define("blip-panel", BlipPanel);

declare global {
  interface HTMLElementTagNameMap {
    "blip-panel": BlipPanel;
  }
}
