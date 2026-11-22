import { css, unsafeCSS } from "lit";
import { brandStyles } from "./brand";

// Ported from the website; login/sign-out styles removed, phone menu button added.
export const styles = [unsafeCSS(brandStyles), css`
    :host {
      --bg: #160b29;
      --card: #22143d;
      --line: #534ab7;
      --line-2: #7f77dd;
      --text: #eeedfe;
      --muted: #afa9ec;
      --soft: #cecbf6;
      --accent: #a855f7;
      display: block;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    main { max-width: 440px; margin: 0 auto; padding: 20px 16px calc(28px + env(safe-area-inset-bottom)); box-sizing: border-box; }
    .center { min-height: 70vh; display: grid; place-items: center; }
    .card { box-sizing: border-box; background: var(--card); border: 0.5px solid var(--line); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.4px; }
    h2 { margin: 0; font-size: 17px; font-weight: 600; }
    p { margin: 0; }
    .muted { color: var(--muted); font-size: 13px; line-height: 1.5; }
    .err { color: #f7c1c1; font-size: 13px; margin-top: 8px; }

    .title { font-size: 44px; margin: 0; }
    .ver { text-align: center; font-size: 11px; color: var(--muted); opacity: 0.7; margin-top: 8px; }
    .pill-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 4px 0 8px; flex-wrap: nowrap; }
    .pill-row .pill { white-space: nowrap; padding: 7px 14px; }
    .pill-row .pill { margin: 0; }
    .editbtn { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; padding: 7px 14px; border-radius: 999px; min-height: 36px; }
    .editbtn svg { width: 16px; height: 16px; }
    .chips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
    .chip { min-height: 52px; padding: 6px 2px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font: inherit; }
    .chip strong { font-size: 17px; line-height: 1.1; }
    .chip span { font-size: 11px; opacity: 0.85; }
    .chip.on { background: #5b4a86; color: #fff; border: 1.5px solid var(--line-2); }
    .chip.off { background: transparent; color: var(--muted); border: 1.5px dashed var(--muted); }
    .chip.sel { outline: 2px solid #f5d0fe; outline-offset: 1px; }
    .chip-unit { text-align: right; font-size: 11px; color: var(--muted); margin: 4px 2px 0; }
    .pending { text-align: center; max-width: 320px; }
    .fan .sel { fill: #f5d0fe; stroke: #fff; stroke-width: 1; }
    .fan .sel-off { fill: transparent; stroke-dasharray: 3 2; stroke-width: 1.4; }
    .fan .sel-glow { fill: none; stroke: #f5d0fe; stroke-opacity: 0.35; stroke-width: 6; }
    .edit-actions { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 8px; margin-top: 12px; }
    .edit-actions button { min-height: 46px; margin: 0; }
    .primary:disabled { opacity: 0.45; cursor: default; }
    .fan svg.editing .on { fill-opacity: 0.8; stroke-opacity: 0.8; }
    .footmark { display: flex; justify-content: center; margin-top: 28px; opacity: 0.9; }
    header { position: relative; display: flex; justify-content: center; align-items: center; margin: 4px 0 18px; min-height: 48px; }
    .menu { position: absolute; left: -4px; top: 50%; margin-top: -22px; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; background: transparent; border: none; color: var(--soft); border-radius: 50%; }
    .menu svg { width: 24px; height: 24px; }
    .menu:focus-visible { outline: 2px solid var(--accent); }
    .sensor { display: block; margin-bottom: 14px; }
    .sensor-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px 2px; }
    .select-wrap { position: relative; display: block; }
    .picker { -webkit-appearance: none; appearance: none; box-sizing: border-box; width: 100%; min-height: 52px; background: var(--card); color: var(--text); border: 1.5px solid var(--line-2); border-radius: 14px; padding: 12px 48px 12px 16px; font: inherit; font-size: 17px; font-weight: 600; cursor: pointer; }
    .picker:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .picker.single { display: flex; align-items: center; cursor: default; }
    .chev { position: absolute; right: 16px; top: 50%; width: 22px; height: 22px; margin-top: -11px; color: var(--soft); pointer-events: none; }
    .batt { margin-top: 2px; }
    .supported { margin: 8px 0 0; padding-left: 20px; font-size: 14px; line-height: 1.6; }

    button { font: inherit; cursor: pointer; border-radius: 12px; padding: 12px 16px; }
    .primary { background: #7f77dd; color: #fff; border: none; font-weight: 600; margin-top: 8px; }
    .ghost { background: var(--card); color: var(--text); border: 0.5px solid var(--line-2); }

    .status { display: flex; align-items: center; gap: 12px; }
    .status .icon { width: 44px; height: 44px; border-radius: 12px; background: #3c3489; display: grid; place-items: center; color: var(--soft); font-size: 18px; flex-shrink: 0; }
    .status.present { border-color: var(--accent); }
    .status.present .icon { background: var(--accent); color: #fff; }

    .pill { width: fit-content; margin: 4px auto 8px; border: 0.5px solid var(--line-2); border-radius: 999px; padding: 7px 16px; font-size: 14px; font-weight: 600; color: var(--soft); background: var(--card); }

    .fan svg { width: 100%; display: block; }
    .fan .on { fill: #5b4a86; fill-opacity: 0.55; stroke: var(--line-2); stroke-opacity: 0.5; stroke-width: 0.5; }
    .fan .on.present { fill: #7c5cc4; fill-opacity: 0.75; }
    .fan .off { fill: var(--bg); stroke: var(--muted); stroke-opacity: 0.5; stroke-width: 0.6; stroke-dasharray: 3 2; }
    .fan .active { fill: var(--accent); stroke: #e9d5ff; stroke-width: 0.8; }
    .fan .glow2 { fill: none; stroke: var(--accent); stroke-opacity: 0.35; stroke-width: 5; }
    .fan .lost { fill: #c2410c; stroke: #fdba74; stroke-width: 0.8; }
    .fan .off-lost { fill-opacity: 0.55; stroke-dasharray: 3 2; }
    .fan .lost-glow { fill: none; stroke: #ea580c; stroke-opacity: 0.3; stroke-width: 7; }
    .fan .glow3 { fill: none; stroke: var(--accent); stroke-opacity: 0.18; stroke-width: 10; }
    .fan .lbl { font-size: 11px; fill: var(--soft); }
    .fan .dot { fill: var(--muted); }
    .fan .halo { fill: var(--line-2); opacity: 0.25; }

    .legend { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--soft); margin: 8px 0 4px; }
    .sw { display: inline-block; width: 11px; height: 11px; border-radius: 3px; vertical-align: -1px; }
    .sw.present { background: #7c5cc4; }
    .sw.on { background: #5b4a86; }
    .sw.here { background: var(--accent); }
    .sw.lost { background: #c2410c; }
    .sw.off { border: 1px dashed var(--muted); }
    .note { text-align: center; font-size: 12px; color: var(--muted); margin-bottom: 14px; }
    .aim-row { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
    .switch { width: 54px; height: 32px; border-radius: 16px; background: #3c3489; border: none; padding: 0; position: relative; flex-shrink: 0; }
    .switch i { position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%; background: var(--text); transition: left 0.2s; }
    .switch.on { background: var(--accent); }
    .switch.on i { left: 26px; }
    .switch:disabled { opacity: 0.4; }
    .switch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .aim-state { margin-top: 12px; padding: 10px 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 2px; font-size: 13px; line-height: 1.45; }
    .aim-state strong { font-size: 15px; }
    .aim-state.wait { background: #3c3489; color: var(--soft); }
    .aim-state.live { background: #4c1d95; color: #ede9fe; }
    .aim-note { margin-top: 8px; }
    .pill.hot { border-color: var(--accent); color: #f3e8ff; }
    .pill.lost { border-color: #ea580c; color: #fed7aa; background: #3a1708; }

  `];
