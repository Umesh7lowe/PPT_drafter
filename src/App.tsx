/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Presentation, 
  Clock, 
  Palette, 
  Layout, 
  Download, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Loader2,
  Settings,
  Edit3,
  Image as ImageIcon,
  Columns,
  BarChart3,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'title': return <Presentation className="w-4 h-4" />;
      case 'image_left':
      case 'image_right': return <ImageIcon className="w-4 h-4" />;
      case 'comparison': return <Columns className="w-4 h-4" />;
      case 'big_stat': return <BarChart3 className="w-4 h-4" />;
      case 'conclusion': return <CheckCircle2 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSlideLayoutPreview = (slide: SlideContent) => {
    switch (slide.type) {
      case 'image_left':
        return (
          <div className="grid grid-cols-2 gap-2 h-20 mt-2">
            <div className="bg-slate-200 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
            <div className="space-y-1"><div className="h-1 w-full bg-slate-200" /><div className="h-1 w-3/4 bg-slate-200" /><div className="h-1 w-1/2 bg-slate-200" /></div>
          </div>
        );
      case 'image_right':
        return (
          <div className="grid grid-cols-2 gap-2 h-20 mt-2">
            <div className="space-y-1"><div className="h-1 w-full bg-slate-200" /><div className="h-1 w-3/4 bg-slate-200" /><div className="h-1 w-1/2 bg-slate-200" /></div>
            <div className="bg-slate-200 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
          </div>
        );
      case 'comparison':
        return (
          <div className="grid grid-cols-2 gap-2 h-20 mt-2">
            <div className="bg-slate-100 p-1 space-y-1"><div className="h-1 w-full bg-slate-200" /><div className="h-1 w-1/2 bg-slate-200" /></div>
            <div className="bg-slate-100 p-1 space-y-1"><div className="h-1 w-full bg-slate-200" /><div className="h-1 w-1/2 bg-slate-200" /></div>
          </div>
        );
      case 'big_stat':
        return (
          <div className="flex flex-col items-center justify-center h-20 mt-2 bg-indigo-50 rounded">
            <div className="text-lg font-bold text-indigo-300">{slide.statValue || "99%"}</div>
            <div className="h-1 w-1/2 bg-indigo-200" />
          </div>
        );
      default:
        return (
          <div className="space-y-1 mt-2">
            <div className="h-1 w-full bg-slate-200" />
            <div className="h-1 w-full bg-slate-200" />
            <div className="h-1 w-3/4 bg-slate-200" />
          </div>
        );
    }
  };
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { analyzeManuscript, PresentationData, SlideContent } from './lib/gemini';
import { generatePpt, THEMES, PptTheme } from './lib/ppt';

type Step = 'upload' | 'generating' | 'editor';

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [timeLimit, setTimeLimit] = useState<string>("10");
  const [selectedTheme, setSelectedTheme] = useState<PptTheme>(THEMES[0]);
  const [customColor, setCustomColor] = useState<string>("#2C3E50");
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected`);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload a manuscript PDF first");
      return;
    }

    try {
      setStep('generating');
      setIsGenerating(true);
      
      const base64 = await fileToBase64(file);
      const data = await analyzeManuscript(
        base64, 
        parseInt(timeLimit), 
        selectedTheme.name, 
        customColor
      );
      
      setPresentationData(data);
      setStep('editor');
      toast.success("Presentation structure generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze manuscript. Please try again.");
      setStep('upload');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!presentationData) return;
    try {
      toast.info("Generating PPTX file...");
      await generatePpt(presentationData, selectedTheme);
      toast.success("Presentation downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PPTX file.");
    }
  };

  const updateSlide = (index: number, updatedSlide: Partial<SlideContent>) => {
    if (!presentationData) return;
    const newSlides = [...presentationData.slides];
    newSlides[index] = { ...newSlides[index], ...updatedSlide };
    setPresentationData({ ...presentationData, slides: newSlides });
  };

  const addSlide = (index: number) => {
    if (!presentationData) return;
    const newSlides = [...presentationData.slides];
    newSlides.splice(index + 1, 0, {
      title: "New Slide",
      content: ["Point 1"],
      notes: "",
      type: 'content'
    });
    setPresentationData({ ...presentationData, slides: newSlides });
    toast.success("Slide added");
  };

  const removeSlide = (index: number) => {
    if (!presentationData || presentationData.slides.length <= 1) {
      toast.error("Cannot remove the last slide");
      return;
    }
    const newSlides = presentationData.slides.filter((_, i) => i !== index);
    setPresentationData({ ...presentationData, slides: newSlides });
    toast.success("Slide removed");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Presentation className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Manuscript AI</h1>
          </div>
          
          {step === 'editor' && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <Settings className="w-4 h-4 mr-2" />
                Options
              </Button>
              <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Download PPTX
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Upload */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-indigo-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl">Upload Manuscript</CardTitle>
                    <CardDescription>
                      Upload your journal publication PDF to begin the AI-powered presentation generation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
                      `}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".pdf"
                      />
                      {file ? (
                        <>
                          <div className="bg-indigo-100 p-4 rounded-full mb-4">
                            <FileText className="w-12 h-12 text-indigo-600" />
                          </div>
                          <p className="font-medium text-indigo-900">{file.name}</p>
                          <p className="text-sm text-indigo-600 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <Button variant="ghost" className="mt-4 text-indigo-600" onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}>
                            Change File
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <Upload className="w-12 h-12 text-slate-400" />
                          </div>
                          <p className="font-medium text-slate-900">Click to upload or drag and drop</p>
                          <p className="text-sm text-slate-500 mt-1">PDF files only (max 20MB)</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Time Limit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={timeLimit} onValueChange={setTimeLimit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 Minutes (5-8 slides)</SelectItem>
                          <SelectItem value="20">20 Minutes (10-15 slides)</SelectItem>
                          <SelectItem value="30">30 Minutes (15-20 slides)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-2">
                        AI will adjust the depth of content based on the selected duration.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-500" />
                        Color Palette
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="color" 
                          value={customColor} 
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input 
                            type="text" 
                            value={customColor} 
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="font-mono text-sm uppercase"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Primary brand color for your presentation.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Templates */}
              <div className="space-y-6">
                <Card className="border-slate-100 shadow-sm h-full">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Layout className="w-5 h-5 text-indigo-500" />
                      Visual Template
                    </CardTitle>
                    <CardDescription>Select a style for your slides</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {THEMES.map((theme) => (
                      <div 
                        key={theme.name}
                        onClick={() => setSelectedTheme(theme)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${selectedTheme.name === theme.name ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-900">{theme.name}</h3>
                          {selectedTheme.name === theme.name && (
                            <Badge className="bg-indigo-600">Selected</Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.primaryColor}` }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.secondaryColor}` }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.accentColor}` }} />
                        </div>
                        <p className="text-xs text-slate-500">Font: {theme.fontFace}</p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleGenerate} 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg"
                      disabled={!file || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing PDF...
                        </>
                      ) : (
                        <>
                          Generate Presentation
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative">
                <div className="w-32 h-32 border-4 border-indigo-100 rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">AI is analyzing your manuscript</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  We're extracting key insights, structuring slides, and drafting speaker notes for your {timeLimit}-minute presentation.
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="px-3 py-1">Extracting Abstract</Badge>
                <Badge variant="secondary" className="px-3 py-1">Structuring Methods</Badge>
                <Badge variant="secondary" className="px-3 py-1">Synthesizing Results</Badge>
              </div>
            </motion.div>
          )}

          {step === 'editor' && presentationData && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left: Slide List */}
              <div className="lg:col-span-4 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-slate-900">Slides ({presentationData.slides.length})</h2>
                  <Button variant="outline" size="sm" onClick={() => addSlide(presentationData.slides.length - 1)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Slide
                  </Button>
                </div>
                {presentationData.slides.map((slide, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all border-2 overflow-hidden ${idx === 0 ? 'border-indigo-600' : 'border-slate-100 hover:border-slate-200'}`}
                      onClick={() => {
                        const element = document.getElementById(`slide-editor-${idx}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-start">
                          <div className="bg-slate-100 text-slate-500 w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-indigo-500">{getSlideIcon(slide.type)}</span>
                              <h3 className="font-semibold text-sm truncate text-slate-900">{slide.title}</h3>
                            </div>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider">
                              {slide.type.replace('_', ' ')}
                            </Badge>
                            {getSlideLayoutPreview(slide)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Right: Slide Editor */}
              <div className="lg:col-span-8 space-y-8">
                {presentationData.slides.map((slide, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Card id={`slide-editor-${idx}`} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200">Slide {idx + 1}</Badge>
                        <Input 
                          value={slide.title} 
                          onChange={(e) => updateSlide(idx, { title: e.target.value })}
                          className="text-xl font-bold border-none focus-visible:ring-indigo-500 px-0 h-auto"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => addSlide(idx)} title="Add slide after">
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeSlide(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-3">
                        <Label className="text-slate-500 flex items-center gap-2">
                          <Edit3 className="w-4 h-4" /> Bullet Points
                        </Label>
                        {slide.content.map((point, pIdx) => (
                          <div key={pIdx} className="flex gap-2">
                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            <Input 
                              value={point} 
                              onChange={(e) => {
                                const newContent = [...slide.content];
                                newContent[pIdx] = e.target.value;
                                updateSlide(idx, { content: newContent });
                              }}
                              className="border-slate-100 focus-visible:ring-indigo-500"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="shrink-0 text-slate-400 hover:text-red-500"
                              onClick={() => {
                                const newContent = slide.content.filter((_, i) => i !== pIdx);
                                updateSlide(idx, { content: newContent });
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => {
                            updateSlide(idx, { content: [...slide.content, "New point"] });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Point
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-slate-500 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Speaker Notes
                        </Label>
                        <textarea 
                          value={slide.notes}
                          onChange={(e) => updateSlide(idx, { notes: e.target.value })}
                          className="w-full min-h-[100px] p-3 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                          placeholder="Enter speaker notes here..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                ))}
                
                <div className="flex justify-center py-8">
                  <Button size="lg" onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-6 text-lg shadow-lg shadow-indigo-100">
                    <Download className="w-5 h-5 mr-2" />
                    Finalize & Download PPTX
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
}
