import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { verifyRecyclable } from '../lib/gemini';

export default function SubmitPhoto({ userProfile, onSubmissionSuccess }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [resultData, setResultData] = useState(null); // { item, pointsEarned }
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraError, setCameraError] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Automatically start camera on mount if in idle state and no photo is selected yet
  useEffect(() => {
    if (status === 'idle' && !previewUrl && !file) {
      startCamera();
    }
    return () => {
      // Clean up stream when component unmounts
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [status, previewUrl, file]);

  const startCamera = async (deviceId = null) => {
    // 1. Verify browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera capture is not supported by your browser. Please upload a file directly.');
      setIsCameraActive(false);
      return;
    }

    try {
      setCameraError(null);
      
      // Stop any existing stream tracks
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      // Configure video constraints.
      // Use deviceId if provided, else prefer the back camera ('environment') on mobile devices.
      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: 'environment' } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCameraActive(true);

      // Bind the video stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate available video inputs for multi-camera support
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      // Select active device in state
      if (videoDevices.length > 0) {
        if (deviceId) {
          setSelectedDeviceId(deviceId);
        } else {
          // Identify current active track's device ID
          const activeTrack = stream.getVideoTracks()[0];
          const settings = activeTrack ? activeTrack.getSettings() : null;
          if (settings && settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          } else {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please grant permissions, or upload an image directly.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please upload an image directly.');
      } else {
        setCameraError('Unable to access device camera. Please upload an image directly.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const handleDeviceChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    await startCamera(deviceId);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Capture at the actual stream resolution
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = Date.now();
        const capturedFile = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus('idle');
        setMessage('');
        setResultData(null);
        stopCamera(); // stop the camera once photo is snapped
      }
    }, 'image/jpeg', 0.92);
  };

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
    stopCamera(); // Make sure camera is closed if we select a file
  };

  const handleUploadOptionClick = () => {
    stopCamera();
    fileInputRef.current.click();
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
        const fileExt = file.name.split('.').pop() || 'jpg';
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
    setCameraError(null);
    // automatically reopen camera on reset
    startCamera();
  };

  return (
    <div className="w-full glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl p-6 relative">
      <h2 className="text-xl font-extrabold font-display tracking-tight text-white mb-4 flex items-center justify-between">
        <span>♻️ Recycle a New Item</span>
        {isCameraActive && devices.length > 1 && (
          <select 
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="bg-slate-900/90 border border-slate-800 text-slate-350 text-[11px] font-bold rounded-xl py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[130px] truncate"
          >
            {devices.map((device, idx) => (
              <option key={device.deviceId} value={device.deviceId}>
                📷 Camera {idx + 1}
              </option>
            ))}
          </select>
        )}
      </h2>

      {/* Hidden file input for file upload path */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {status === 'idle' && !previewUrl && (
        <div className="space-y-4">
          
          {/* CAMERA ACTIVE: Live viewfinder */}
          {isCameraActive ? (
            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950 flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Camera Overlays */}
              <div className="absolute inset-0 border border-emerald-500/10 rounded-2xl pointer-events-none flex items-center justify-center">
                {/* Visual Grid for Alignment */}
                <div className="w-full h-[1px] bg-slate-500/10 absolute top-1/3" />
                <div className="w-full h-[1px] bg-slate-500/10 absolute top-2/3" />
                <div className="h-full w-[1px] bg-slate-500/10 absolute left-1/3" />
                <div className="h-full w-[1px] bg-slate-500/10 absolute left-2/3" />
                
                {/* Corner Crosshairs */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/30 rounded-tl-sm" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/30 rounded-tr-sm" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/30 rounded-bl-sm" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/30 rounded-br-sm" />
              </div>

              {/* Pulsing Live Camera Indicator */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-800 pointer-events-none">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full absolute" />
                <span className="text-[9px] text-emerald-450 font-bold uppercase tracking-wider font-mono">Live Viewfinder</span>
              </div>
            </div>
          ) : (
            /* CAMERA INACTIVE / FALLBACK: File Uploader drop area */
            <div 
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700/60 bg-slate-950/20 hover:bg-slate-900/30 rounded-2xl text-center relative transition duration-300"
            >
              {/* Big primary camera activation button */}
              <button
                onClick={() => startCamera()}
                className="mb-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                📷 Enable Device Camera
              </button>
              
              {/* Secondary file uploading area */}
              <div 
                onClick={() => fileInputRef.current.click()}
                className="cursor-pointer w-full flex flex-col items-center group py-2 border-t border-slate-850/50 mt-2"
              >
                <span className="text-xs text-slate-350 font-semibold group-hover:text-emerald-400 transition mt-3">
                  Or click here to select a file
                </span>
                <span className="text-[10px] text-slate-650 mt-1">Accepts JPG, PNG, WEBP</span>
              </div>
            </div>
          )}

          {/* Action row when Camera is Active */}
          {isCameraActive && (
            <div className="flex flex-col items-center gap-3">
              {/* Snap Button */}
              <button 
                onClick={handleSnapPhoto}
                className="w-16 h-16 rounded-full border-4 border-slate-800 bg-white hover:bg-slate-100 hover:scale-105 active:scale-95 transition duration-150 cursor-pointer shadow-xl flex items-center justify-center text-xl text-slate-900"
                title="Capture Photo"
              >
                📸
              </button>

              {/* Secondary direct upload option */}
              <button 
                onClick={handleUploadOptionClick}
                className="text-xs text-slate-400 hover:text-emerald-400 font-semibold underline underline-offset-4 decoration-slate-700 hover:decoration-emerald-500 transition cursor-pointer"
              >
                Or upload from files instead
              </button>
            </div>
          )}

          {/* Camera Permission/Access Errors */}
          {cameraError && !isCameraActive && (
            <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center flex flex-col items-center gap-2">
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                ⚠️ {cameraError}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => startCamera(selectedDeviceId)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[10px] font-bold py-1 px-3 rounded-lg transition"
                >
                  🔄 Retry Camera
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold py-1 px-3 rounded-lg transition"
                >
                  📁 Browse Files
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 2: Preview Mode */}
      {previewUrl && status !== 'success' && (
        <div className="space-y-4">
          <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            
            {status !== 'loading' && (
              <button 
                onClick={resetForm}
                className="absolute top-3 right-3 bg-slate-950/70 hover:bg-red-500 text-white rounded-full p-2 transition cursor-pointer shadow-md"
                title="Discard"
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
                className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 font-semibold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer text-sm"
              >
                🔄 Retake / Change
              </button>
              <button 
                onClick={handleUploadAndVerify}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 text-sm"
              >
                🔍 Analyze & Log
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 leading-relaxed text-center">
              ⚠️ {message}
            </div>
          )}
        </div>
      )}

      {/* State 3: Success Screen */}
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
