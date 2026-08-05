import { useState } from "react";
import { RotateCcw, Save, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  deletePreset,
  FONT_OPTIONS,
  getPresets,
  PALETTES,
  savePreset,
  THEMES,
  useSettings,
  type SettingsPreset,
} from "@/lib/settings";

export function SettingsDialog() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [presets, setPresets] = useState<SettingsPreset[]>(() => getPresets());
  const [presetName, setPresetName] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Settings">
          <Settings2 className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">Settings</DialogTitle>
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
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              max={1.2}
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
                  onClick={() => updateSettings({ palette: p.id })}
                  className={[
                    "size-8 rounded-full border-2 transition-transform",
                    settings.palette === p.id
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-110",
                  ].join(" ")}
                  style={{ backgroundColor: p.vars["--primary"] }}
                />
              ))}
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
              <Button
                variant="outline"
                size="icon"
                aria-label="Save preset"
                disabled={!presetName.trim()}
                onClick={() => {
                  setPresets(savePreset(presetName, settings));
                  setPresetName("");
                }}
              >
                <Save className="size-4" />
              </Button>
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 font-mono text-typer-untyped hover:text-primary"
            onClick={resetSettings}
          >
            <RotateCcw className="size-4" />
            reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
