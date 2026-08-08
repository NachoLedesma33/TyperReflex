import { useEffect, useState } from "react";
import { Keyboard, RotateCcw, Save, Settings2, Trash2, X } from "lucide-react";

import { ToolBtn } from "@/components/ToolBtn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  bindingLabel,
  eventToBinding,
  SHORTCUT_ACTIONS,
  type ShortcutActionId,
} from "@/lib/shortcuts";
import {
  deletePreset,
  FONT_OPTIONS,
  FONT_STACKS,
  getPresets,
  LANGUAGES,
  PALETTES,
  savePreset,
  THEMES,
  useSettings,
  type Language,
  type SettingsPreset,
} from "@/lib/settings";

export function SettingsDialog() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [presets, setPresets] = useState<SettingsPreset[]>(() => getPresets());
  const [presetName, setPresetName] = useState("");
  const [recording, setRecording] = useState<ShortcutActionId | null>(null);

  // Capture the next keystroke as the shortcut for the action being recorded.
  // Esc cancels, Backspace/Delete clears the binding. preventDefault keeps the
  // capture key from triggering other global shortcuts or typing.
  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(null);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        const next = { ...settings.shortcuts };
        delete next[recording];
        updateSettings({ shortcuts: next });
        setRecording(null);
        return;
      }
      const binding = eventToBinding(e);
      if (!binding) {
        return; // a bare modifier press — keep waiting for the key
      }
      updateSettings({
        shortcuts: { ...settings.shortcuts, [recording]: binding },
      });
      setRecording(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recording, settings.shortcuts, updateSettings]);

  const currentPalette =
    PALETTES.find((p) => p.id === settings.palette) ?? PALETTES[0];
  const customHue = settings.customTheme?.hue ?? currentPalette.hue;
  const customLight = settings.customTheme?.lightness ?? 0.55;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ToolBtn
          variant="outline"
          size="icon"
          title="settings"
          ariaLabel="Settings"
        >
          <Settings2 className="size-5" />
        </ToolBtn>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-ui text-xl">Settings</DialogTitle>
          <DialogDescription>
            Preferences are saved on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-font" className="font-mono">
              Font
            </Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(v) =>
                updateSettings({
                  fontFamily: v as typeof settings.fontFamily,
                })
              }
            >
              <SelectTrigger id="settings-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <span style={{ fontFamily: FONT_STACKS[f.id] }}>
                      {f.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-md border border-border/60 bg-card/40 px-3 py-2 text-lg text-typer-untyped font-mono">
              The quick brown fox — 0123456789
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="settings-ligatures" className="font-mono">
              Font ligatures
            </Label>
            <Switch
              id="settings-ligatures"
              checked={settings.ligatures}
              onCheckedChange={(v) => updateSettings({ ligatures: v })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-font-size" className="font-mono">
                Font size
              </Label>
              <span className="font-mono text-sm text-typer-untyped">
                {settings.fontSize.toFixed(2)}rem
              </span>
            </div>
            <Slider
              id="settings-font-size"
              aria-label="Font size"
              min={1}
              max={2.5}
              step={0.125}
              value={[settings.fontSize]}
              onValueChange={([v]) => updateSettings({ fontSize: v })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-gap" className="font-mono">
                Word gap
              </Label>
              <span className="font-mono text-sm text-typer-untyped">
                {settings.wordGap.toFixed(2)}rem
              </span>
            </div>
            <Slider
              id="settings-gap"
              aria-label="Word gap"
              min={0.3}
              max={2.5}
              step={0.05}
              value={[settings.wordGap]}
              onValueChange={([v]) => updateSettings({ wordGap: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="settings-sound" className="font-mono">
              Key sounds
            </Label>
            <Switch
              id="settings-sound"
              checked={settings.soundEnabled}
              onCheckedChange={(v) => updateSettings({ soundEnabled: v })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-language" className="font-mono">
              Language
            </Label>
            <Select
              value={settings.language}
              onValueChange={(v) => updateSettings({ language: v as Language })}
            >
              <SelectTrigger id="settings-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="settings-accent-insensitive" className="font-mono">
              Ignore accents
            </Label>
            <Switch
              id="settings-accent-insensitive"
              checked={settings.accentInsensitive}
              onCheckedChange={(v) => updateSettings({ accentInsensitive: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="settings-shake" className="font-mono">
              Shake on errors
            </Label>
            <Switch
              id="settings-shake"
              checked={settings.shakeEnabled}
              onCheckedChange={(v) => updateSettings({ shakeEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="settings-confirm-restart" className="font-mono">
              Confirm restart
            </Label>
            <Switch
              id="settings-confirm-restart"
              checked={settings.confirmRestart}
              onCheckedChange={(v) => updateSettings({ confirmRestart: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="settings-strict" className="font-mono">
              Strict mode
            </Label>
            <Switch
              id="settings-strict"
              checked={settings.strictMode}
              onCheckedChange={(v) => updateSettings({ strictMode: v })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-caret" className="font-mono">
              Caret style
            </Label>
            <Select
              value={settings.caretStyle}
              onValueChange={(v) =>
                updateSettings({
                  caretStyle: v as typeof settings.caretStyle,
                })
              }
            >
              <SelectTrigger id="settings-caret">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">bar</SelectItem>
                <SelectItem value="block">block</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-theme" className="font-mono">
              Theme
            </Label>
            <Select
              value={settings.themeId}
              onValueChange={(v) =>
                updateSettings({ themeId: v as typeof settings.themeId })
              }
            >
              <SelectTrigger id="settings-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-mono">Accent color</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={p.name}
                  title={p.name}
                  onClick={() =>
                    updateSettings({ palette: p.id, customTheme: null })
                  }
                  className={[
                    "size-8 rounded-full border-2 transition-transform",
                    settings.palette === p.id && !settings.customTheme
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-110",
                  ].join(" ")}
                  style={{ backgroundColor: p.vars["--primary"] }}
                />
              ))}
              <button
                type="button"
                aria-label="custom accent"
                title="custom accent"
                onClick={() =>
                  settings.customTheme ??
                  updateSettings({
                    customTheme: { hue: customHue, lightness: customLight },
                  })
                }
                className={[
                  "size-8 rounded-full border-2 transition-transform",
                  settings.customTheme
                    ? "scale-110 border-foreground"
                    : "border-transparent hover:scale-110",
                ].join(" ")}
                style={{
                  background: `oklch(${customLight} 0.2 ${customHue})`,
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="settings-hue" className="font-mono">
                  Hue
                </Label>
                <span className="font-mono text-sm text-typer-untyped tabular-nums">
                  {Math.round(customHue)}°
                </span>
              </div>
              <Slider
                id="settings-hue"
                aria-label="Accent hue"
                min={0}
                max={360}
                step={1}
                value={[customHue]}
                onValueChange={([v]) =>
                  updateSettings({
                    customTheme: { hue: v, lightness: customLight },
                  })
                }
              />
              <div className="flex items-center justify-between">
                <Label htmlFor="settings-lightness" className="font-mono">
                  Lightness
                </Label>
                <span className="font-mono text-sm text-typer-untyped tabular-nums">
                  {Math.round(customLight * 100)}%
                </span>
              </div>
              <Slider
                id="settings-lightness"
                aria-label="Accent lightness"
                min={0.2}
                max={0.8}
                step={0.01}
                value={[customLight]}
                onValueChange={([v]) =>
                  updateSettings({
                    customTheme: { hue: customHue, lightness: v },
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Keyboard className="size-4 text-typer-untyped" />
              <Label className="font-mono">Keyboard shortcuts</Label>
            </div>
            <p className="text-xs text-typer-untyped leading-relaxed">
              Nothing is bound by default. Click an action, then press the keys
              to record a shortcut. Esc cancels, Backspace clears.
            </p>
            <div className="flex flex-col gap-1">
              {SHORTCUT_ACTIONS.map((action) => {
                const current = settings.shortcuts[action.id];
                const isRecording = recording === action.id;
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-1.5"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{action.label}</span>
                      {action.description && (
                        <span className="text-xs text-typer-untyped">
                          {action.description}
                        </span>
                      )}
                    </div>
                    <ToolBtn
                      variant={
                        isRecording ? "primary" : current ? "outline" : "ghost"
                      }
                      size="xs"
                      title={
                        isRecording
                          ? "press keys…"
                          : current
                            ? "change shortcut"
                            : "set shortcut"
                      }
                      ariaLabel={
                        isRecording
                          ? `Cancel recording ${action.label}`
                          : `Set shortcut ${action.label}`
                      }
                      onClick={() =>
                        setRecording(isRecording ? null : action.id)
                      }
                    >
                      {isRecording ? (
                        <span className="inline-flex items-center gap-1.5">
                          <X className="size-3" />
                          press…
                        </span>
                      ) : current ? (
                        <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted border border-border">
                          {bindingLabel(current)}
                        </kbd>
                      ) : (
                        "unset"
                      )}
                    </ToolBtn>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="preset-name" className="font-mono">
              Presets
            </Label>
            <div className="flex gap-2">
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="preset name"
                className="font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && presetName.trim()) {
                    setPresets(savePreset(presetName, settings));
                    setPresetName("");
                  }
                }}
              />
              <ToolBtn
                variant="outline"
                size="icon"
                title="save preset"
                ariaLabel="Save preset"
                disabled={!presetName.trim()}
                onClick={() => {
                  setPresets(savePreset(presetName, settings));
                  setPresetName("");
                }}
              >
                <Save className="size-4" />
              </ToolBtn>
            </div>
            {presets.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {presets.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5"
                  >
                    <button
                      onClick={() => updateSettings(p.settings)}
                      className="flex-1 text-left font-mono text-sm text-typer-untyped hover:text-primary transition-colors"
                      title={`Apply "${p.name}"`}
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => setPresets(deletePreset(p.name))}
                      aria-label={`Delete preset ${p.name}`}
                      className="text-typer-untyped hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <ToolBtn
            variant="ghost"
            size="xs"
            title="reset settings"
            className="gap-2 text-typer-untyped hover:text-primary"
            onClick={resetSettings}
          >
            <RotateCcw className="size-3.5" />
            reset
          </ToolBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
