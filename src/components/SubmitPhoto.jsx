import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { verifyRecyclable } from '../lib/gemini';

export default function SubmitPhoto({ userProfile, onSubmissionSuccess }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [resultData, setResultData] = useState(null); // { item, pointsEarned }
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setMessage('Please select an image file.');
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStatus('idle');
    setMessage('');
    setResultData(null);
  };

  const fileToBase64 = (imgFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imgFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadAndVerify = async () => {
    if (!file) return;

    setStatus('loading');
    setMessage('AI is analyzing your item...');

    try {
      // 1. Convert to base64 for Gemini vision analysis
      const base64String = await fileToBase64(file);

      // Check if Gemini Key is present. If not, use high-fidelity mock verification
      const hasGeminiKey = !!import.meta.env.VITE_GEMINI_KEY;
      let aiResult;

      if (hasGeminiKey) {
        aiResult = await verifyRecyclable(base64String, file.type);
      } else {
        // High fidelity mock delay + simulation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Match mock recycling outcomes from name or randomize
        const isRecyclableMock = Math.random() > 0.25;
        const mockItems = ['Plastic Water Bottle', 'Cardboard Pizza Box', 'Glass Soda Bottle', 'Aluminum Soda Can', 'Crushed Paper Box'];
        aiResult = {
          recyclable: isRecyclableMock,
          item: isRecyclableMock ? mockItems[Math.floor(Math.random() * mockItems.length)] : 'Unknown Non-Recyclable Object'
        };
      }

      if (!aiResult.recyclable) {
        setStatus('error');
        setMessage(`Hmm, Gemini analyzed this as a "${aiResult.item || 'non-recyclable object'}". That doesn't seem recyclable! Try uploading a bottle, can, paper, or box.`);
        return;
      }

      setMessage('Uploading photo to Supabase storage...');

      // 2. Upload photo to Supabase Storage
      let imageUrl = previewUrl; // Fallback to object URL for local preview testing
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');

      if (isSupabaseConfigured) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userProfile.id || 'anonymous'}-${Date.now()}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        // Attempt upload to 'recycling-photos' bucket
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('recycling-photos')
          .upload(filePath, file);

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('recycling-photos')
            .getPublicUrl(filePath);
          imageUrl = publicUrlData?.publicUrl;
        } else {
          console.warn("Storage upload failed or 'recycling-photos' bucket doesn't exist. Using local preview URL.", uploadError);
        }

        setMessage('Recording points and logging submission...');

        // 3. Insert into submissions table
        const { error: insertError } = await supabase.from('submissions').insert({
          user_id: userProfile.id,
          image_url: imageUrl,
          item_name: aiResult.item,
          verified: true
        });

        if (insertError) throw insertError;

        // 4. Update profile points (Increment by 10)
        const newPoints = (userProfile.points || 0) + 10;
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', userProfile.id);

        if (profileError) throw profileError;
      } else {
        // Local state simulate if Supabase is offline/missing
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Success state
      setResultData({
        item: aiResult.item,
        pointsEarned: 10
      });
      setStatus('success');
      setMessage('Brilliant! Points added successfully.');
      
      // Notify parent to refresh profile and global stats
      if (onSubmissionSuccess) {
        onSubmissionSuccess(aiResult.item, 10);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'An error occurred during submission.');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setMessage('');
    setResultData(null);
  };

  return (
    <div className="w-full glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl p-6 relative">
      <h2 className="text-xl font-extrabold font-display tracking-tight text-white mb-4">
        ♻️ Recycle a New Item
      </h2>

      {status === 'idle' && !previewUrl && (
        <div 
          onClick={() => fileInputRef.current.click()}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700/60 bg-slate-950/20 hover:bg-slate-900/30 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all duration-300 group text-center"
        >
          <span className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-115">📸</span>
          <span className="text-sm font-semibold text-slate-200">Upload or drop photo</span>
          <span className="text-xs text-slate-500 mt-1">Accepts JPG, PNG, WEBP</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      )}

      {previewUrl && status !== 'success' && (
        <div className="space-y-4">
          <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            
            {status !== 'loading' && (
              <button 
                onClick={resetForm}
                className="absolute top-2 right-2 bg-slate-950/70 hover:bg-red-500 text-white rounded-full p-1.5 transition cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {status === 'loading' ? (
            <div className="flex flex-col items-center py-4 text-center">
              <svg className="animate-spin h-8 w-8 text-emerald-400 mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-emerald-400 font-medium animate-pulse">{message}</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={resetForm}
                className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer"
              >
                Change Photo
              </button>
              <button 
                onClick={handleUploadAndVerify}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                🔍 Analyze & Log
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 leading-relaxed text-center">
              ⚠️ {message}
            </div>
          )}
        </div>
      )}

      {status === 'success' && resultData && (
        <div className="text-center py-4 space-y-4 animate-fadeIn">
          <div className="flex justify-center text-5xl animate-bounce">
            🎉
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Recycled Successfully!</h3>
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              Verified Item: <span className="underline">{resultData.item}</span>
            </p>
          </div>
          <div className="inline-flex flex-col items-center bg-slate-900/60 border border-slate-800/80 rounded-2xl py-3 px-6 shadow-md">
            <span className="text-[11px] text-slate-400 tracking-wide uppercase font-semibold">Points Earned</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1 font-display">+{resultData.pointsEarned}</span>
          </div>
          <button 
            onClick={resetForm}
            className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 border border-slate-800 font-semibold py-2 px-4 rounded-xl transition duration-200 cursor-pointer"
          >
            Log Another Item
          </button>
        </div>
      )}
    </div>
  );
}
