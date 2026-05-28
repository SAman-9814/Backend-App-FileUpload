import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Upload,
  Image,
  Video,
  FileText,
  Mail,
  Tag,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  FolderOpen,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  X,
  Trash2,
  Search,
  ShieldCheck,
  Cpu,
  ArrowUp
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1/upload";

export default function App() {
  const [activeTab, setActiveTab] = useState("image"); // image, video, compressed, local
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  
  // Theme state (default to dark)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Loading and feedback states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Sync theme to root class list
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper to trigger toast notifications
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Fetch gallery items
  const fetchGallery = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/getFiles`);
      if (response.data && response.data.success) {
        setGallery(response.data.files || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      addToast("Failed to fetch uploaded files list", "error");
    } finally {
      setTimeout(() => {
        setIsLoadingGallery(false);
      }, 600);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGallery();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchGallery]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFile(null);
    setFilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Process file upload input
  const processFile = (selected) => {
    if (!selected) return;

    if (activeTab === "image" || activeTab === "compressed") {
      if (!selected.type.startsWith("image/")) {
        addToast("Please select a valid image file (PNG/JPG/JPEG)", "error");
        return;
      }
    } else if (activeTab === "video") {
      if (!selected.type.startsWith("video/")) {
        addToast("Please select a valid video file (MP4/MOV)", "error");
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        addToast("Video file is larger than 5MB. Cloudinary upload might take a moment.", "info");
      }
    }

    setFile(selected);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(""); 
    }
  };

  // Handle standard input select
  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle upload submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast("Please select a file to upload first.", "error");
      return;
    }

    const formData = new FormData();
    let endpoint = "";

    if (activeTab === "image") {
      if (!name.trim() || !email.trim()) {
        addToast("File name and email are required for image upload.", "error");
        return;
      }
      formData.append("name", name);
      formData.append("email", email);
      formData.append("tags", tags);
      formData.append("imageFile", file);
      endpoint = `${API_BASE}/imageUpload`;
    } else if (activeTab === "video") {
      if (!name.trim() || !email.trim()) {
        addToast("File name and email are required for video upload.", "error");
        return;
      }
      formData.append("name", name);
      formData.append("email", email);
      formData.append("tags", tags);
      formData.append("videoFile", file);
      endpoint = `${API_BASE}/videoUpload`;
    } else if (activeTab === "compressed") {
      if (!name.trim() || !email.trim()) {
        addToast("File name and email are required for compressed upload.", "error");
        return;
      }
      formData.append("name", name);
      formData.append("email", email);
      formData.append("tags", tags);
      formData.append("imageFile", file);
      endpoint = `${API_BASE}/imageSizeReducer`;
    } else if (activeTab === "local") {
      formData.append("file", file);
      endpoint = `${API_BASE}/localFileUpload`;
    }

    setIsUploading(true);
    setUploadProgress(10); 

    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 90) / progressEvent.total
          );
          setUploadProgress(Math.max(10, percentCompleted));
        },
      });

      if (response.data && response.data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          addToast(response.data.message || "Upload Completed Successfully!", "success");
          // Clear all form fields
          setFile(null);
          setFilePreview("");
          setName("");
          setEmail("");
          setTags("");
          if (fileInputRef.current) fileInputRef.current.value = "";
          // Refresh gallery for Cloudinary uploads
          if (activeTab !== "local") {
            setIsLoadingGallery(true);
            fetchGallery();
          }
        }, 300);
      } else {
        addToast(response.data.message || "Upload failed.", "error");
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Something went wrong during upload";
      addToast(errMsg, "error");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Copy url helper
  const handleCopyLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast("URL copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete file record from DB
  const handleDelete = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await axios.delete(`${API_BASE}/deleteFile/${id}`);
      if (res.data && res.data.success) {
        setGallery((prev) => prev.filter((item) => item._id !== id));
        addToast("File record deleted successfully.", "success");
      } else {
        addToast(res.data.message || "Delete failed.", "error");
      }
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to delete record.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`min-h-screen font-sans p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto relative transition-colors duration-450 ${
      isDarkMode ? "text-slate-100" : "text-slate-800"
    }`}>
      
      {/* Glow Backdrops */}
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-glow-blob-1 blur-[130px] animate-blob pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] rounded-full bg-glow-blob-2 blur-[150px] animate-blob-delayed pointer-events-none z-0"></div>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto relative p-4 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.18)] flex items-center justify-between gap-3 border transition-all duration-300 animate-slide-in overflow-hidden ${
              toast.type === "success"
                ? isDarkMode
                  ? "bg-slate-900 border-emerald-500/35 text-slate-100 shadow-emerald-950/20"
                  : "bg-white border-emerald-300 text-slate-800 shadow-emerald-100/30"
                : toast.type === "error"
                ? isDarkMode
                  ? "bg-slate-900 border-red-500/35 text-slate-100 shadow-red-950/20"
                  : "bg-white border-red-300 text-slate-800 shadow-red-100/30"
                : isDarkMode
                ? "bg-slate-900 border-indigo-500/35 text-slate-100 shadow-indigo-950/20"
                : "bg-white border-indigo-300 text-slate-800 shadow-indigo-100/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${
                toast.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-550" 
                  : toast.type === "error" 
                  ? "bg-red-500/10 text-red-500" 
                  : "bg-indigo-500/10 text-indigo-550"
              }`}>
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
              </div>
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>

            {/* Manual Dismiss Cross Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Visual Shrinking Timer Progress Bar */}
            <div className={`absolute bottom-0 left-0 h-1 toast-progress-bar ${
              toast.type === "success" 
                ? "bg-emerald-500" 
                : toast.type === "error" 
                ? "bg-red-500" 
                : "bg-indigo-500"
            }`}></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className={`mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8 relative z-10 transition-colors ${
        isDarkMode ? "border-slate-800/40" : "border-slate-200"
      }`}>
        <div>
          <div className="flex items-center justify-center md:justify-start gap-3.5 mb-2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <span className={`relative flex p-2.5 rounded-xl border text-indigo-400 ${
                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}>
                <Upload className="w-5.5 h-5.5 animate-pulse" />
              </span>
            </div>
            <h1 className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
              isDarkMode ? "from-white via-indigo-200 to-purple-400" : "from-slate-900 via-indigo-950 to-indigo-800"
            }`}>
              CloudVibe
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold tracking-wider uppercase backdrop-blur-sm">
              Live Core
            </span>
          </div>
          <p className={`text-sm md:text-base ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}>
            Upload files to Cloudinary and Local servers seamlessly with automated mail notifications.
          </p>
        </div>
        
        {/* Actions/Settings Panel */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs text-slate-400">
          
          {/* Theme switcher button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm backdrop-blur-md ${
              isDarkMode 
                ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:text-indigo-400 hover:border-slate-800" 
                : "bg-white border-slate-200 text-slate-600 hover:text-indigo-650 hover:border-slate-300 shadow-slate-100/80"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-600" />
            )}
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md ${
            isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 text-slate-600"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>API Online</span>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md ${
            isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 text-slate-600"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>DB Connected</span>
          </div>

        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-start relative z-10">
        
        {/* Upload Form Area */}
        <section className="lg:col-span-5 glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
          
          <div className={`border-b pb-4 ${isDarkMode ? "border-slate-800/60" : "border-slate-200"}`}>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-400" />
              Upload Hub
            </h2>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Select an option to process your media upload.</p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-1 p-1.5 rounded-xl border ${
            isDarkMode ? "bg-slate-950 border-slate-900" : "bg-slate-100 border-slate-200"
          }`}>
            {[
              { id: "image", label: "Image", icon: Image },
              { id: "video", label: "Video", icon: Video },
              { id: "compressed", label: "Reduce", icon: Image },
              { id: "local", label: "Local", icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? isDarkMode
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-indigo-200 shadow-lg shadow-indigo-950/50 border border-indigo-500/20 scale-102"
                        : "bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm scale-102"
                      : isDarkMode 
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-5">
            {activeTab !== "local" ? (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                {/* File Name */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    File Label Name <span className="text-indigo-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vacation Picture"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-xl py-3 px-4 text-sm focus:border-indigo-500/60"
                  />
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Recipient Email <span className="text-indigo-400 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-sm focus:border-indigo-500/60"
                    />
                  </div>
                  <span className={`text-[10px] leading-normal ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>An automatic email will notify the recipient of the upload link.</span>
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] font-extrabold uppercase tracking-widest ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Metadata Tags
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. travel, wallpaper, work"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-sm focus:border-indigo-500/60"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* File Drag and Drop / Input */}
            <div className="flex flex-col gap-2">
              <label className={`text-[10px] font-extrabold uppercase tracking-widest ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}>
                Select File <span className="text-indigo-400 font-bold">*</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? "border-indigo-400 bg-indigo-500/10 scale-102"
                    : file
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : isDarkMode 
                    ? "border-slate-800 bg-slate-950/20 hover:border-indigo-500/30 hover:bg-slate-950/40"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-500/35 hover:bg-slate-100/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  required
                  onChange={handleFileChange}
                  className="hidden"
                  accept={
                    activeTab === "image" || activeTab === "compressed"
                      ? "image/*"
                      : activeTab === "video"
                      ? "video/*"
                      : "*"
                  }
                />

                {filePreview ? (
                  <div className={`relative w-full max-h-40 overflow-hidden rounded-xl border flex justify-center bg-slate-950/60 transition-transform duration-300 hover:scale-102 ${
                    isDarkMode ? "border-slate-800/80" : "border-slate-200"
                  }`}>
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="object-contain max-h-40 max-w-full"
                    />
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center gap-2 animate-fade-in-up">
                    <div className="p-3.5 rounded-full bg-indigo-500/10 text-indigo-500 animate-bounce">
                      {activeTab === "video" ? (
                        <Video className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 max-w-[220px] truncate">
                      {file.name}
                    </span>
                    <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={`p-3 rounded-full hover:scale-110 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all duration-300 ${
                      isDarkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        Drag and drop file here, or click to browse
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {activeTab === "image" || activeTab === "compressed"
                          ? "Supports JPG, JPEG, PNG"
                          : activeTab === "video"
                          ? "Supports MP4, MOV"
                          : "Any valid server-friendly format"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className={`w-full rounded-full h-2 overflow-hidden border ${
                isDarkMode ? "bg-slate-950/60 border-slate-900/60" : "bg-slate-100 border-slate-200"
              }`}>
                <div
                  className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer ${
                isUploading
                  ? isDarkMode 
                    ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:opacity-95 text-white shadow-indigo-950/60 hover:scale-[1.01] hover:-translate-y-0.5 border border-indigo-500/20"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white shadow-indigo-300/60 hover:shadow-indigo-400/40 hover:scale-[1.01] hover:-translate-y-0.5 border border-indigo-400/30"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Uploading {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    Upload to {activeTab === "local" ? "Local Server" : "Cloudinary"}
                  </span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Gallery / History logs */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-6 min-h-[500px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>

            {/* Header info */}
            <div className={`flex flex-col gap-3 border-b pb-4 ${isDarkMode ? "border-slate-800/60" : "border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Image className="w-5 h-5 text-indigo-400" />
                    Cloud Media Gallery
                  </h2>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Showing all file logs saved to MongoDB.</p>
                </div>
                <button
                  onClick={() => {
                    setIsLoadingGallery(true);
                    fetchGallery();
                  }}
                  disabled={isLoadingGallery}
                  className={`p-2 rounded-xl border hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-indigo-400 hover:text-indigo-300"
                      : "bg-white border-slate-200 text-indigo-650 hover:text-indigo-550"
                  }`}
                  title="Sync database logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingGallery ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or tag…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full glass-input rounded-xl py-2 pl-9 pr-4 text-xs focus:border-indigo-500/60`}
                />
              </div>
            </div>

            {/* Gallery Grid */}
            {isLoadingGallery && gallery.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-550" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading files from DB...</span>
              </div>
            ) : isLoadingGallery ? (
              /* Shimmer Loading Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[580px] overflow-y-auto pr-1">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={`border rounded-2xl p-4 flex flex-col gap-4 shimmer ${
                    isDarkMode ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-slate-50"
                  }`}>
                    <div className={`aspect-video rounded-xl ${isDarkMode ? "bg-slate-900/60" : "bg-slate-200"}`}></div>
                    <div className={`h-4 w-3/4 rounded ${isDarkMode ? "bg-slate-900/60" : "bg-slate-200"}`}></div>
                    <div className={`h-3 w-1/2 rounded ${isDarkMode ? "bg-slate-900/60" : "bg-slate-200"}`}></div>
                    <div className={`h-6 w-1/3 rounded ${isDarkMode ? "bg-slate-900/60" : "bg-slate-200"}`}></div>
                  </div>
                ))}
              </div>
            ) : gallery.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 border border-dashed rounded-2xl ${
                isDarkMode ? "bg-slate-950/15 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-550"
              }`}>
                <FolderOpen className="w-10 h-10 text-slate-400" />
                <div>
                  <h3 className="text-sm font-bold">No media entries found</h3>
                  <p className={`text-xs mt-1 max-w-[280px] leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    Upload files using Cloudinary tabs (Image, Video, Reduce) to populate the MongoDB database.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[580px] overflow-y-auto pr-1">
                {gallery.filter((item) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    item.name?.toLowerCase().includes(q) ||
                    item.tags?.toLowerCase().includes(q)
                  );
                }).map((item, idx) => {
                  const isVideo = item.imageUrl?.toLowerCase().match(/\.(mp4|mov|avi|webm)$/) || item.imageUrl?.includes("/video/upload/");
                  
                  return (
                    <div
                      key={item._id}
                      style={{ animationDelay: `${idx * 60}ms` }}
                      className={`group border rounded-2xl p-4 flex flex-col justify-between gap-3 animate-fade-in-up media-card ${
                        isDarkMode ? "border-slate-800 bg-slate-950/15" : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      {/* Media Preview Box */}
                      <div className={`relative aspect-video rounded-xl overflow-hidden flex items-center justify-center border ${
                        isDarkMode ? "bg-slate-950 border-slate-900" : "bg-slate-200 border-slate-200"
                      }`}>
                        {isVideo ? (
                          <video
                            src={item.imageUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=500&auto=format&fit=crop&q=60";
                            }}
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-slate-600" />
                        )}

                        {/* Top banner labels */}
                        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
                          <span className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold uppercase tracking-wider backdrop-blur-sm shadow-md ${
                            isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-white/80 border-slate-200 text-slate-700"
                          }`}>
                            {isVideo ? "Video" : "Image"}
                          </span>
                        </div>

                        {/* Glass Overlay on Hover */}
                        {!isVideo && (
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm z-20 ${
                            isDarkMode ? "bg-slate-950/70" : "bg-slate-950/55"
                          }`}>
                            <button
                              onClick={() => handleCopyLink(item.imageUrl, item._id)}
                              className={`p-2.5 rounded-xl border transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 hover:scale-110 cursor-pointer ${
                                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:text-black"
                              }`}
                              title="Copy URL"
                            >
                              {copiedId === item._id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-xl bg-indigo-650 border border-indigo-500/30 text-white transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 delay-75 hover:scale-110 cursor-pointer"
                              title="Open Media"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* File Details */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-sm font-bold truncate flex-1 transition-colors ${
                            isDarkMode ? "text-slate-100 group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-600"
                          }`}>
                            {item.name}
                          </h3>
                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className={`flex-shrink-0 p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                              isDarkMode
                                ? "bg-red-500/8 border-red-500/15 text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
                                : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 hover:border-red-300"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title="Delete record"
                          >
                            {deletingId === item._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Email Row */}
                        {item.email && (
                          <div className={`flex items-center gap-1.5 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </div>
                        )}

                        {/* Tags Row */}
                        {item.tags && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {item.tags.split(",").map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md border font-bold ${
                                  isDarkMode 
                                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/10" 
                                    : "bg-indigo-500/8 text-indigo-700 border-indigo-500/10"
                                }`}
                              >
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Video Row Buttons */}
                      {isVideo && (
                        <div className={`grid grid-cols-2 gap-2 mt-2 pt-2 border-t ${
                          isDarkMode ? "border-slate-900/60" : "border-slate-200"
                        }`}>
                          <button
                            onClick={() => handleCopyLink(item.imageUrl, item._id)}
                            className={`flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDarkMode 
                                ? "bg-slate-900 hover:bg-slate-850 hover:text-slate-100 text-slate-400 border-slate-800" 
                                : "bg-slate-200/50 hover:bg-slate-200/90 text-slate-700 border-slate-300/80"
                            }`}
                          >
                            {copiedId === item._id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy URL</span>
                          </button>
                          
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all cursor-pointer ${
                              isDarkMode 
                                ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/15" 
                                : "bg-indigo-500/8 hover:bg-indigo-500/15 text-indigo-700 border-indigo-500/20"
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Video</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={`border-t pt-12 pb-8 mt-12 relative z-10 ${isDarkMode ? "border-slate-800/80 bg-slate-950/20" : "border-slate-200/80 bg-slate-50/50"} backdrop-blur-md rounded-t-3xl px-6 md:px-12`}>
        {/* Decorative subtle glow element in footer */}
        <div className="absolute -top-[1px] left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col gap-3 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkMode ? "from-white via-indigo-200 to-purple-400" : "from-slate-950 via-indigo-850 to-purple-800"
              }`}>
                CloudVibe
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                v2.1
              </span>
            </div>
            <p className={`text-xs max-w-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              A premium, secure media asset storage solution built for high-performance file management, live notifications, and instant content distribution.
            </p>
          </div>

          {/* Tech stack badge Col */}
          <div className="md:col-span-4 flex flex-col gap-3 items-center md:items-start text-center md:text-left">
            <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-550"}`}>
              Core Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
              {[
                { name: "React 19", color: "hover:text-sky-400 hover:border-sky-500/30" },
                { name: "Node.js", color: "hover:text-emerald-400 hover:border-emerald-500/30" },
                { name: "Express", color: "hover:text-gray-300 hover:border-gray-500/30" },
                { name: "MongoDB", color: "hover:text-green-400 hover:border-green-500/30" },
                { name: "Cloudinary", color: "hover:text-indigo-400 hover:border-indigo-500/30" },
                { name: "Nodemailer", color: "hover:text-amber-400 hover:border-amber-500/30" }
              ].map((tech) => (
                <span
                  key={tech.name}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl border transition-all duration-300 ${tech.color} ${
                    isDarkMode
                      ? "bg-slate-900/50 border-slate-800/80 text-slate-400"
                      : "bg-white border-slate-200 text-slate-550"
                  }`}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </div>

          {/* System metrics/Status Col */}
          <div className="md:col-span-3 flex flex-col gap-3 items-center md:items-start text-center md:text-left">
            <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-550"}`}>
              System Integrity
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>Secure Cloud Storage</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>Automated Node Mailer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div className={`h-[1px] w-full mb-6 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-200/60"}`}></div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className={`text-[11px] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            © 2026 CloudVibe. All rights reserved. Registered Asset Manager.
          </p>
          
          {/* Scroll to top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`p-2 rounded-xl border hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase ${
              isDarkMode
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                : "bg-white border-slate-200 text-slate-600 hover:text-black hover:border-slate-300"
            }`}
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </footer>
    </div>
  );
}
