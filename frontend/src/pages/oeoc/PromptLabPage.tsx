// =====================================================
// OEOC Prompt Lab
// Prompt versioning and code editor
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  FileCode,
  RefreshCw,
  Search,
  History,
  Save,
  Copy,
  Check,
  Tag,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { oeocService } from '@/services/oeoc.service';
import type { Prompt, PromptVersion } from '@/types/oeoc.types';

export function PromptLabPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editContent, setEditContent] = useState('');
  const [editVariables, setEditVariables] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadPrompts = async () => {
    try {
      const data = await oeocService.prompts.getAll();
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromptDetail = async (slug: string) => {
    try {
      const data = await oeocService.prompts.getBySlug(slug);
      if (data) {
        setSelectedPrompt(data);
        setVersions(data.versions || []);
        setEditContent(data.current_version?.content || '');
        setEditVariables(data.current_version?.variables?.join(', ') || '');
      }
    } catch (error) {
      console.error('Failed to load prompt:', error);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleSelectPrompt = (prompt: Prompt) => {
    loadPromptDetail(prompt.slug);
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;
    setSaving(true);
    try {
      const vars = editVariables.split(',').map((v) => v.trim()).filter(Boolean);
      await oeocService.prompts.createVersion(
        selectedPrompt.id,
        editContent,
        vars,
        changeNotes || undefined
      );
      setChangeNotes('');
      loadPromptDetail(selectedPrompt.slug);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!selectedPrompt) return;
    try {
      await oeocService.prompts.rollback(selectedPrompt.id, versionId);
      loadPromptDetail(selectedPrompt.slug);
      setHistoryOpen(false);
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPrompts = prompts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Lab</h1>
          <p className="text-muted-foreground">Version-controlled prompt engineering</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPrompts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Prompt List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-auto">
            {filteredPrompts.map((prompt) => (
              <Card
                key={prompt.id}
                className={`cursor-pointer transition-colors ${
                  selectedPrompt?.id === prompt.id ? 'border-primary' : 'hover:border-muted-foreground'
                }`}
                onClick={() => handleSelectPrompt(prompt)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{prompt.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{prompt.slug}</p>
                    </div>
                    {prompt.category && (
                      <Badge variant="outline" className="text-xs">{prompt.category}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedPrompt ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      {selectedPrompt.name}
                    </CardTitle>
                    <CardDescription className="font-mono">{selectedPrompt.slug}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
                      <History className="h-4 w-4 mr-2" />
                      History ({versions.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Variables */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4" />
                    Variables (comma-separated)
                  </label>
                  <Input
                    value={editVariables}
                    onChange={(e) => setEditVariables(e.target.value)}
                    placeholder="var1, var2, var3"
                    className="font-mono text-sm"
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Prompt Content</label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                    placeholder="Enter your prompt template..."
                  />
                </div>

                {/* Save Section */}
                <div className="flex items-end gap-4 pt-4 border-t">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Change Notes (optional)</label>
                    <Input
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      placeholder="Describe your changes..."
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save New Version
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a prompt to edit</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Version History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              {selectedPrompt?.name} - {versions.length} versions
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-auto">
            {versions
              .sort((a, b) => b.version_number - a.version_number)
              .map((version) => (
                <Card key={version.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={version.id === selectedPrompt?.current_version_id ? 'default' : 'outline'}>
                          v{version.version_number}
                        </Badge>
                        {version.id === selectedPrompt?.current_version_id && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                    </div>
                    {version.change_notes && (
                      <p className="text-sm text-muted-foreground mb-3">{version.change_notes}</p>
                    )}
                    <pre className="text-xs bg-muted p-3 rounded max-h-[150px] overflow-auto">
                      {version.content.slice(0, 300)}
                      {version.content.length > 300 && '...'}
                    </pre>
                    {version.id !== selectedPrompt?.current_version_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleRollback(version.id)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Rollback to this version
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default PromptLabPage;
