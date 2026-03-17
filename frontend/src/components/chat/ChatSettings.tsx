/**
 * Chat Settings Component
 * 
 * Comprehensive settings panel similar to ChatGPT/Claude
 */

import React, { useState } from 'react';
import {
  ChatSettings,
  DEFAULT_CHAT_SETTINGS,
  SETTINGS_PRESETS,
  AVAILABLE_MODELS,
  ModelConfig,
  StorageProvider,
  AIProvider,
  PROVIDER_DEFAULTS,
} from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings as SettingsIcon,
  Sparkles,
  Database,
  Cloud,
  HardDrive,
  Save,
  RotateCcw,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  onSave?: () => void;
}

export const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [open, setOpen] = useState(false);

  const updateSetting = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const applyPreset = (presetId: string) => {
    const preset = SETTINGS_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const newSettings = { ...localSettings, ...preset.settings };
      setLocalSettings(newSettings);
      onSettingsChange(newSettings);
    }
  };

  const resetToDefaults = () => {
    setLocalSettings(DEFAULT_CHAT_SETTINGS);
    onSettingsChange(DEFAULT_CHAT_SETTINGS);
  };

  const handleSave = () => {
    onSave?.();
    setOpen(false);
  };

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === localSettings.model);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Chat Settings
          </DialogTitle>
          <DialogDescription>
            Configure your AI assistant with advanced settings similar to ChatGPT and Claude
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>

          {/* Provider Selection Tab */}
          <TabsContent value="provider" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Provider</CardTitle>
                <CardDescription>
                  Choose where your AI requests are sent. Supports Groq, OpenAI, Anthropic,
                  Ollama, OpenWebUI, LibreChat, or any custom OpenAI-compatible endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={localSettings.provider ?? 'groq'}
                    onValueChange={(value) => {
                      const provider = value as AIProvider;
                      const defaults = PROVIDER_DEFAULTS[provider];
                      updateSetting('provider', provider);
                      // Keep the existing API key; only reset the endpoint URL
                      updateSetting('providerConfig', {
                        baseUrl: defaults.defaultUrl,
                        apiKey: localSettings.providerConfig?.apiKey ?? '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PROVIDER_DEFAULTS) as AIProvider[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span>{PROVIDER_DEFAULTS[p].label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Endpoint URL */}
                <div className="space-y-2">
                  <Label>API Endpoint URL</Label>
                  <Input
                    value={localSettings.providerConfig?.baseUrl ?? PROVIDER_DEFAULTS[localSettings.provider ?? 'groq']?.defaultUrl ?? ''}
                    onChange={(e) =>
                      updateSetting('providerConfig', {
                        ...localSettings.providerConfig,
                        baseUrl: e.target.value,
                      })
                    }
                    placeholder={PROVIDER_DEFAULTS[localSettings.provider ?? 'groq']?.defaultUrl}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use the default endpoint for the selected provider.
                  </p>
                </div>

                {/* API Key */}
                {PROVIDER_DEFAULTS[localSettings.provider ?? 'groq']?.apiKeyRequired && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={localSettings.providerConfig?.apiKey ?? ''}
                      onChange={(e) =>
                        updateSetting('providerConfig', {
                          ...localSettings.providerConfig,
                          apiKey: e.target.value,
                        })
                      }
                      placeholder="Enter your API key…"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can also set this via the{' '}
                      <code className="bg-muted px-1 rounded text-xs">
                        {localSettings.provider === 'openai'
                          ? 'VITE_OPENAI_API_KEY'
                          : localSettings.provider === 'anthropic'
                          ? 'VITE_ANTHROPIC_API_KEY'
                          : 'VITE_GROQ_API_KEY'}
                      </code>{' '}
                      environment variable.
                    </p>
                  </div>
                )}

                {/* Self-hosted platform info boxes */}
                {(localSettings.provider === 'ollama' || localSettings.provider === 'openwebui') && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-900 dark:text-green-100 space-y-1">
                    <p className="font-semibold">
                      {localSettings.provider === 'openwebui' ? 'OpenWebUI' : 'Ollama'} — Self-hosted
                    </p>
                    <p>
                      {localSettings.provider === 'openwebui'
                        ? 'OpenWebUI provides a ChatGPT-style UI on top of Ollama. Make sure your OpenWebUI instance is running and accessible.'
                        : 'Ollama lets you run LLMs locally. Install it from https://ollama.com and pull a model with `ollama pull llama3.2`.'}
                    </p>
                    <p>No API key is required for local deployments.</p>
                  </div>
                )}
                {localSettings.provider === 'librechat' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg text-sm text-purple-900 dark:text-purple-100 space-y-1">
                    <p className="font-semibold">LibreChat — Self-hosted</p>
                    <p>
                      LibreChat is an open-source platform supporting OpenAI, Anthropic, Ollama,
                      and many more providers. It exposes an OpenAI-compatible API.
                    </p>
                    <p>
                      Source:{' '}
                      <a
                        href="https://github.com/LibreChat-AI/librechat.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        github.com/LibreChat-AI/librechat.ai
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Selection Tab */}
          <TabsContent value="model" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Model Selection</CardTitle>
                <CardDescription>
                  Choose the AI model for your conversations.
                  {localSettings.provider && localSettings.provider !== 'groq' && (
                    <> Showing models for <strong>{PROVIDER_DEFAULTS[localSettings.provider]?.label}</strong>.</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Model</Label>
                  <Select
                    value={localSettings.model}
                    onValueChange={(value) => updateSetting('model', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS
                        .filter((m) => m.provider === (localSettings.provider ?? 'groq'))
                        .map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedModel && (
                  <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium capitalize">{selectedModel.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Tokens:</span>
                      <span className="font-medium">{selectedModel.maxTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Context Window:</span>
                      <span className="font-medium">
                        {selectedModel.contextWindow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SETTINGS_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset.id)}
                        className="justify-start"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Model Parameters</CardTitle>
                <CardDescription>Fine-tune the model's response behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.temperature.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.temperature]}
                    onValueChange={([value]) => updateSetting('temperature', value)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls randomness: Lower is more focused, higher is more creative
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Maximum Length (Tokens)</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.maxTokens]}
                    onValueChange={([value]) => updateSetting('maxTokens', value)}
                    min={256}
                    max={selectedModel?.maxTokens || 8192}
                    step={256}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum tokens to generate in the response
                  </p>
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Top P (Nucleus Sampling)</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.topP.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.topP]}
                    onValueChange={([value]) => updateSetting('topP', value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Considers tokens with top_p probability mass
                  </p>
                </div>

                {/* Frequency Penalty */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Frequency Penalty</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.frequencyPenalty.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.frequencyPenalty]}
                    onValueChange={([value]) => updateSetting('frequencyPenalty', value)}
                    min={-2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Penalizes tokens based on their frequency
                  </p>
                </div>

                {/* Presence Penalty */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Presence Penalty</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.presencePenalty.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.presencePenalty]}
                    onValueChange={([value]) => updateSetting('presencePenalty', value)}
                    min={-2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Penalizes tokens that have already appeared
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">System Behavior</CardTitle>
                <CardDescription>Customize how the AI responds and behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={localSettings.systemPrompt || ''}
                    onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                    placeholder="Enter custom system instructions for the AI..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define the AI's role, personality, and behavior
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Context Window (Messages)</Label>
                  <Input
                    type="number"
                    value={localSettings.contextWindow}
                    onChange={(e) =>
                      updateSetting('contextWindow', parseInt(e.target.value) || 10)
                    }
                    min={1}
                    max={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of previous messages to include in context
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Project Context</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically include relevant project data
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.includeSystemContext}
                    onCheckedChange={(checked) => updateSetting('includeSystemContext', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Storage & Integration</CardTitle>
                <CardDescription>
                  Connect cloud storage and manage file integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select
                    value={localSettings.storageProvider || 'none'}
                    onValueChange={(value) =>
                      updateSetting('storageProvider', value as StorageProvider)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>None (Local Only)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google-drive">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          <span>Google Drive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="onedrive">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          <span>OneDrive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="local">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          <span>Local File System</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose where to store uploaded files and conversations
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save Conversations</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically save conversations to storage
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.autoSaveConversations}
                    onCheckedChange={(checked) =>
                      updateSetting('autoSaveConversations', checked)
                    }
                  />
                </div>

                {localSettings.storageProvider && localSettings.storageProvider !== 'none' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Note:</strong> You'll need to authenticate with{' '}
                      {localSettings.storageProvider === 'google-drive'
                        ? 'Google Drive'
                        : localSettings.storageProvider === 'onedrive'
                        ? 'OneDrive'
                        : 'your local file system'}{' '}
                      to enable file uploads and storage.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetToDefaults} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
