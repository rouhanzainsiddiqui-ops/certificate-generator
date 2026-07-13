import React, { useState, useRef, useEffect } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import { Download, Upload, Image as ImageIcon, Users, Github, Linkedin, Instagram, X, Type, Move, Calendar } from 'lucide-react';
import { CONFIG } from '../config';
import { generateCertificates } from '../utils/generator';
import LivePreviewEditor from './LivePreviewEditor';

import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function CertificateGenerator() {
  const [showWelcome, setShowWelcome] = useState(CONFIG.welcomeModal.enabled);
  const [funnyCaption] = useState(() => {
    const captions = [
      "Arey bhai bhai bhai! Certificate banwana hai? Ajao sikha dunga! 🚀🔥",
      "Tension mat le yar, ek click mein sab ho jayega! 😎✨",
      "Bhai tera certificate generator itna fast hai, NASA wale bhi shocked hain! 🛸💨",
      "Jaldi wahan se hato! Certificate banne wala hai! 🏃‍♂️💨🏅",
      "Aur bhai, aa gaye swaad? Chalo ab certificates banate hain! 🤤🎉",
      "Paisa hi paisa hoga... oh wait, yeh toh free hai! 🤑💸",
      "Aisa certificate banaunga, padosi bhi puchega 'Bhai kahan se banwaya?' 👀🔥",
      "Abhi maza aayega na bhidu! Chalo shuru karte hain bina kisi deri ke! 🍿🎬",
      "Gajab beizzati hai yaar... manually certificate kon banata hai aaj kal? 😂🤡"
    ];
    return captions[Math.floor(Math.random() * captions.length)];
  });
  const [selectedTemplate, setSelectedTemplate] = useState(CONFIG.templates[0].path);
  const [selectedFont, setSelectedFont] = useState(CONFIG.fonts[0].family);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [studentList, setStudentList] = useState("");

  const updateCroppedPreview = () => {
    if (cropperRef.current?.cropper) {
      setCroppedPreview(cropperRef.current.cropper.getCroppedCanvas().toDataURL('image/jpeg', 0.8));
    }
  };
  const [status, setStatus] = useState("");
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('certificate-layout');
    if (saved) return JSON.parse(saved);
    return {
      name: { x: 50, y: 50, size: 8 },
      signature: { x: 81, y: 81, width: 14 },
      date: { enabled: true, x: 20, y: 81, size: 4, format: 'MM/DD/YYYY', value: new Date().toLocaleDateString() }
    };
  });

  // Save layout changes to localStorage
  useEffect(() => {
    localStorage.setItem('certificate-layout', JSON.stringify(layout));
  }, [layout]);
  
  const cropperRef = useRef<ReactCropperElement>(null);

  useEffect(() => {
    // Inject fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&family=Great+Vibes&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        try {
          const fileReader = new FileReader();
          fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result as ArrayBuffer);
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport: viewport } as any).promise;
              setSelectedTemplate(canvas.toDataURL('image/jpeg', 0.95));
            }
          };
          fileReader.readAsArrayBuffer(file);
        } catch (error) {
          console.error("Error reading PDF:", error);
          alert("Error processing PDF template.");
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedTemplate(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureImage(reader.result as string);
    };
    if (files && files[0]) {
      reader.readAsDataURL(files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      alert("Please select a template.");
      return;
    }
    if (!signatureImage || !cropperRef.current?.cropper) {
      alert("Please upload and crop a signature.");
      return;
    }
    const students = studentList.split(',').filter(s => s.trim().length > 0);
    if (students.length === 0) {
      alert("Please provide at least one student name.");
      return;
    }

    const croppedSignature = cropperRef.current.cropper.getCroppedCanvas().toDataURL();
    
    await generateCertificates(students, selectedTemplate, croppedSignature, selectedFont, layout, setStatus);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-50 via-white to-stone-100 p-4 md:p-8 text-stone-900 font-sans flex flex-col relative overflow-hidden">
      
      {/* Scrolling Text Top Banner */}
      <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden pointer-events-none z-20 opacity-80 flex items-center bg-transparent">
        <div className="whitespace-nowrap animate-scroll text-sm font-medium tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]">
          Made with ❤️ by Rouhan Zain ✨
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="glass-panel p-8 max-w-md w-full relative transform transition-all animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">{CONFIG.welcomeModal.title}</h2>
            <p className="text-stone-600 leading-relaxed mb-8 text-center text-lg">{funnyCaption}</p>
            <button 
              onClick={() => setShowWelcome(false)}
              className="glass-button w-full"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 text-center space-y-2 mt-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853]">
          GSA Certificate Generator
        </h1>
        <p className="text-stone-500">Batch generate beautiful certificates in your browser.</p>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 flex-1">
        
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <ImageIcon className="w-5 h-5" />
              <h3>✨ Select Template</h3>
            </div>
            <select 
              className="glass-input w-full appearance-none cursor-pointer"
              value={CONFIG.templates.some(t => t.path === selectedTemplate) ? selectedTemplate : "custom"}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setSelectedTemplate(e.target.value);
                }
              }}
            >
              {CONFIG.templates.map((template, idx) => (
                <option key={idx} value={template.path} className="text-black">
                  {template.name}
                </option>
              ))}
              <option value="custom" className="text-black">Custom Upload...</option>
            </select>
            
            <div className="mt-2">
              <label className="block w-full border border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:bg-stone-100 transition-colors">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleTemplateUpload} />
                <p className="text-stone-600 font-medium text-sm">Or upload your own template (Image or PDF)</p>
              </label>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Type className="w-5 h-5" />
              <h3>🎨 Select Font Style</h3>
            </div>
            <select 
              className="glass-input w-full appearance-none cursor-pointer"
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              style={{ fontFamily: selectedFont }}
            >
              {CONFIG.fonts.map((font, idx) => (
                <option key={idx} value={font.family} className="text-black" style={{ fontFamily: font.family }}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Upload className="w-5 h-5" />
              <h3>✍️ Upload Signature</h3>
            </div>
            
            <label className="block w-full border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:bg-stone-100 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-stone-400" />
                <p className="text-stone-600 font-medium">Click or drag to upload signature</p>
                <p className="text-stone-400 text-sm">PNG, JPG up to 5MB</p>
              </div>
            </label>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Calendar className="w-5 h-5" />
              <h3>📅 Date Settings</h3>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={layout.date.enabled} 
                  onChange={(e) => setLayout({...layout, date: {...layout.date, enabled: e.target.checked}})}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                Include Date on Certificate
              </label>
              
              {layout.date.enabled && (
                <div>
                  <label className="block text-sm font-medium mb-1">Date Text</label>
                  <input 
                    type="text" 
                    className="glass-input w-full" 
                    value={layout.date.value} 
                    onChange={(e) => setLayout({...layout, date: {...layout.date, value: e.target.value}})}
                    placeholder="e.g. July 13, 2026"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Users className="w-5 h-5" />
              <h3>📝 Student List</h3>
            </div>
            <textarea 
              className="glass-input w-full h-32 resize-none"
              placeholder="Paste comma-separated names here...&#10;e.g. John Doe, Jane Smith, Alex Johnson"
              value={studentList}
              onChange={(e) => setStudentList(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="space-y-6 flex flex-col lg:col-span-1 lg:max-w-full">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 text-lg font-medium mb-4">
              <Move className="w-5 h-5" />
              <h3>🎯 Interactive Positioning</h3>
            </div>
            <p className="text-sm text-stone-500 mb-4">Drag elements directly on the preview below to position them accurately. Adjust size using the controls.</p>
            
            <div className="mb-6">
              <LivePreviewEditor 
                templateUrl={selectedTemplate}
                signatureUrl={croppedPreview || signatureImage}
                layout={layout}
                setLayout={setLayout}
                selectedFont={selectedFont}
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-stone-500 uppercase">Fine-Tune Scale</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Name Size (%)</label>
                  <input type="number" step="0.5" className="glass-input w-full py-2 px-3 text-sm" value={layout.name.size} onChange={(e) => setLayout({...layout, name: {...layout.name, size: Number(e.target.value)}})} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Signature Width (%)</label>
                  <input type="number" step="0.5" className="glass-input w-full py-2 px-3 text-sm" value={layout.signature.width} onChange={(e) => setLayout({...layout, signature: {...layout.signature, width: Number(e.target.value)}})} />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Date Size (%)</label>
                  <input type="number" step="0.5" className="glass-input w-full py-2 px-3 text-sm" value={layout.date.size} disabled={!layout.date.enabled} onChange={(e) => setLayout({...layout, date: {...layout.date, size: Number(e.target.value)}})} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 flex-1 flex flex-col min-h-[400px]">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              ✂️ Signature Crop Preview
            </h3>
            
            <div className="flex-1 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200 relative">
              {!signatureImage ? (
                <p className="text-stone-400 text-center p-4">Upload a signature to preview and crop.<br/>Aspect ratio is locked to 1660:678.</p>
              ) : (
                <div className="absolute inset-0">
                  <Cropper
                    ref={cropperRef}
                    src={signatureImage}
                    style={{ height: '100%', width: '100%' }}
                    aspectRatio={1660 / 678}
                    guides={true}
                    viewMode={1}
                    background={false}
                    responsive={true}
                    checkOrientation={false}
                    ready={updateCroppedPreview}
                    cropend={updateCroppedPreview}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4 text-center">
            <button 
              onClick={handleGenerate}
              disabled={!!status}
              className="w-full sm:w-auto mx-auto px-10 py-3.5 text-base bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853] hover:opacity-90 border border-transparent rounded-full text-white font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Download className="w-5 h-5" />
              Generate & Download ZIP ✨
            </button>
            
            {status && (
              <div className="text-emerald-600 font-medium animate-pulse">
                {status}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-4 relative z-10 text-center">
        <div className="flex justify-center gap-6 mb-4">
          <a href={CONFIG.socials.github} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-900 transition-colors">
            <Github className="w-6 h-6" />
          </a>
          <a href={CONFIG.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-900 transition-colors">
            <Linkedin className="w-6 h-6" />
          </a>
          <a href={CONFIG.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-900 transition-colors">
            <Instagram className="w-6 h-6" />
          </a>
        </div>
        <p className="text-stone-400 text-sm">Powered by Rouhan Zain.</p>
      </footer>
    </div>
  );
}
