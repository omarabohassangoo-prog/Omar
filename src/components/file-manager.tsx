import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Save, 
  Loader2, 
  Home, 
  ChevronRight, 
  RefreshCw, 
  FileCode, 
  X,
  FileText,
  Check
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
}

interface FileManagerProps {
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ showToast }) => {
  const [currentDir, setCurrentDir] = useState<string>('.');
  const [items, setItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isBinaryFile, setIsBinaryFile] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [isSavingFile, setIsSavingFile] = useState<boolean>(false);
  
  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemIsDirectory, setNewItemIsDirectory] = useState<boolean>(false);
  const [isCreatingItem, setIsCreatingItem] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch items in current directory
  const fetchItems = async (dirPath: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/files/list?dir=${encodeURIComponent(dirPath)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
        setCurrentDir(data.currentDir);
      } else {
        throw new Error(data.error || 'Failed to list directory');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل تحميل الملفات: ${err.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentDir);
  }, []);

  // Navigate to folder
  const handleNavigate = (path: string) => {
    fetchItems(path);
    setSelectedFile(null);
  };

  // Navigate back to parent folder
  const handleNavigateUp = () => {
    if (currentDir === '.' || currentDir === '') return;
    const parts = currentDir.split('/');
    parts.pop();
    const parentPath = parts.join('/') || '.';
    handleNavigate(parentPath);
  };

  // Read file content
  const handleReadFile = async (filePath: string) => {
    setIsReadingFile(true);
    setSelectedFile(filePath);
    try {
      const response = await fetch(`/api/admin/files/read?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (data.success) {
        setIsBinaryFile(data.isBinary);
        if (data.isBinary) {
          setFileContent(data.content); // Base64 encoding
        } else {
          setFileContent(data.content);
        }
      } else {
        throw new Error(data.error || 'Failed to read file');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل قراءة الملف: ${err.message}`, 'error');
      }
      setSelectedFile(null);
    } finally {
      setIsReadingFile(false);
    }
  };

  // Save file content
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    try {
      const response = await fetch('/api/admin/files/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: selectedFile,
          content: fileContent,
          isBase64: isBinaryFile
        })
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (data.success) {
        if (showToast) {
          showToast('✅ تم حفظ تعديلات الملف بنجاح!', 'success');
        }
        // Refresh item sizes
        fetchItems(currentDir);
      } else {
        throw new Error(data.error || 'Failed to save file');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل حفظ الملف: ${err.message}`, 'error');
      }
    } finally {
      setIsSavingFile(false);
    }
  };

  // Create empty file or folder
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setIsCreatingItem(true);
    
    const targetPath = currentDir === '.' || currentDir === '' 
      ? newItemName.trim() 
      : `${currentDir}/${newItemName.trim()}`;

    try {
      const response = await fetch('/api/admin/files/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: targetPath,
          isDirectory: newItemIsDirectory
        })
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (data.success) {
        if (showToast) {
          showToast(`✅ تم إنشاء ${newItemIsDirectory ? 'المجلد' : 'الملف'} بنجاح!`, 'success');
        }
        setNewItemName('');
        setShowCreateModal(false);
        fetchItems(currentDir);
      } else {
        throw new Error(data.error || 'Failed to create item');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل إنشاء العنصر: ${err.message}`, 'error');
      }
    } finally {
      setIsCreatingItem(false);
    }
  };

  // Delete file or folder
  const handleDeleteItem = async (itemPath: string, isDir: boolean) => {
    const confirmation = window.confirm(`هل أنت متأكد من رغبتك في حذف ${isDir ? 'المجلد ومحتوياته' : 'الملف'} نهائياً؟\n\nالمسار: ${itemPath}`);
    if (!confirmation) return;

    try {
      const response = await fetch('/api/admin/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: itemPath
        })
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (data.success) {
        if (showToast) {
          showToast('🗑️ تم حذف العنصر بنجاح!', 'success');
        }
        if (selectedFile === itemPath) {
          setSelectedFile(null);
        }
        fetchItems(currentDir);
      } else {
        throw new Error(data.error || 'Failed to delete item');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل الحذف: ${err.message}`, 'error');
      }
    }
  };

  // Download file
  const handleDownloadFile = async (item: FileItem) => {
    try {
      const response = await fetch(`/api/admin/files/read?path=${encodeURIComponent(item.path)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      if (data.success) {
        let blob: Blob;
        if (data.isBinary) {
          const byteCharacters = atob(data.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: 'application/octet-stream' });
        } else {
          blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(data.error || 'Failed to download file');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل تنزيل الملف: ${err.message}`, 'error');
      }
    }
  };

  // Upload file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!event.target?.result) return;
      
      const resultString = event.target.result as string;
      // Get base64 string
      const base64Content = resultString.split(',')[1];
      const targetPath = currentDir === '.' || currentDir === '' 
        ? file.name 
        : `${currentDir}/${file.name}`;

      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/files/write', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: targetPath,
            content: base64Content,
            isBase64: true
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          if (showToast) {
            showToast(`📤 تم رفع الملف "${file.name}" بنجاح!`, 'success');
          }
          fetchItems(currentDir);
        } else {
          throw new Error(data.error || 'Failed to upload file');
        }
      } catch (err: any) {
        console.error(err);
        if (showToast) {
          showToast(`❌ فشل رفع الملف: ${err.message}`, 'error');
        }
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // Helpers for file sizing and breadcrumbs
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderBreadcrumbs = () => {
    const parts = currentDir === '.' || currentDir === '' ? [] : currentDir.split('/');
    return (
      <div className="flex items-center gap-1 text-xs text-slate-400 font-sans tracking-wide overflow-x-auto pb-2" dir="ltr">
        <button 
          onClick={() => handleNavigate('.')}
          className="hover:text-emerald-400 flex items-center gap-1 font-semibold transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-slate-500" /> workspace
        </button>
        {parts.map((part, index) => {
          const pathTillNow = parts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={index}>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                onClick={() => handleNavigate(pathTillNow)}
                className="hover:text-emerald-400 font-semibold transition-colors max-w-[120px] truncate shrink-0"
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* شريط الأدوات العلوي */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">المسار الحالي للعمل</span>
          {renderBreadcrumbs()}
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => fetchItems(currentDir)}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white rounded-xl transition-all"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              setNewItemIsDirectory(false);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:text-white text-xs font-bold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> ملف جديد
          </button>

          <button
            onClick={() => {
              setNewItemIsDirectory(true);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:text-white text-xs font-bold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" /> مجلد جديد
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 transition-all select-none">
            <Upload className="w-4 h-4" /> رفع ملف
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* المحتوى الرئيسي: تصفح + محرر ملفات */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* قائمة الملفات */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-400" /> مستكشف الملفات ومجلدات النظام
            </span>
            <span className="text-[10px] font-sans text-slate-500">{items.length} عنصر</span>
          </div>

          <div className="divide-y divide-slate-900 max-h-[500px] overflow-y-auto">
            {/* العودة للمجلد الأب */}
            {currentDir !== '.' && currentDir !== '' && (
              <div 
                onClick={handleNavigateUp}
                className="p-3 hover:bg-slate-900/60 flex items-center gap-3 cursor-pointer text-xs text-slate-400 hover:text-white select-none transition-colors"
              >
                <Folder className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-bold">.. (مجلد أعلى)</span>
              </div>
            )}

            {items.length === 0 && !isLoading && (
              <div className="p-8 text-center text-xs text-slate-500">
                <Folder className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                المجلد الحالي فارغ
              </div>
            )}

            {isLoading && items.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                جاري فحص المجلد...
              </div>
            )}

            {items.map((item) => {
              const isSelected = selectedFile === item.path;
              const isSensitive = ['node_modules', '.git', 'dist', '.next', '.env', '.env.example', 'package-lock.json'].includes(item.name) || item.name.startsWith('.');
              return (
                <div 
                  key={item.path}
                  className={`p-3 flex items-center justify-between group transition-colors cursor-pointer select-none ${isSelected ? 'bg-emerald-950/20 border-r-2 border-emerald-500' : 'hover:bg-slate-900/40'}`}
                >
                  <div 
                    onClick={() => item.isDirectory ? handleNavigate(item.path) : handleReadFile(item.path)}
                    className="flex items-center gap-3 min-w-0 flex-grow py-1"
                  >
                    {item.isDirectory ? (
                      <Folder className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${isSensitive ? 'text-amber-500/80' : 'text-indigo-400'}`} />
                    ) : (
                      <FileCode className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${isSensitive ? 'text-amber-500/80' : 'text-emerald-400'}`} />
                    )}
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5 justify-start flex-row-reverse">
                        <p className={`text-xs font-mono font-bold truncate ltr-dir ${isSensitive ? 'text-amber-400/90' : 'text-slate-200'}`} dir="ltr">{item.name}</p>
                        {isSensitive && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950/30 border border-amber-900/30 text-amber-500 font-bold shrink-0">حساس</span>
                        )}
                      </div>
                      {!item.isDirectory && (
                        <p className="text-[10px] text-slate-500 font-sans font-medium">{formatSize(item.size)}</p>
                      )}
                    </div>
                  </div>

                  {/* إجراءات سريعة */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                    {!item.isDirectory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(item);
                        }}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="تنزيل الملف"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.path, item.isDirectory);
                      }}
                      className="p-1.5 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                      title="حذف نهائياً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* محرر الملفات أو لوحة العرض */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[450px] flex flex-col">
          {selectedFile ? (
            <div className="flex flex-col flex-grow">
              {/* ترويسة المحرر */}
              <div className="p-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
                <div className="min-w-0 text-right">
                  <span className="text-[10px] uppercase font-sans font-bold text-emerald-500">محرر الويب المدمج</span>
                  <p className="text-xs font-mono font-bold text-slate-200 truncate" dir="ltr">{selectedFile}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!isBinaryFile && (
                    <button
                      onClick={handleSaveFile}
                      disabled={isSavingFile}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg disabled:opacity-50 transition-all cursor-pointer shadow-md"
                    >
                      {isSavingFile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      حفظ التعديلات
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="إغلاق المحرر"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* متن المحرر */}
              <div className="flex-grow flex flex-col relative min-h-[350px]">
                {isReadingFile ? (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center gap-2 text-slate-400 text-xs z-10">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    جاري استدعاء وقراءة محتويات الملف...
                  </div>
                ) : null}

                {isBinaryFile ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                    <FileText className="w-12 h-12 text-slate-700" />
                    <div>
                      <p className="text-sm font-bold text-white">ملف ثنائي أو غير مدعوم للتحرير المباشر</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">هذا ملف ثنائي (صورة، مستند، أو خط)، لا يمكن تحريره كمحرر نصوص. لكن يمكنك تنزيله بالكامل إلى جهازك.</p>
                    </div>
                    <button
                      onClick={() => {
                        const itm = items.find(i => i.path === selectedFile);
                        if (itm) handleDownloadFile(itm);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <Download className="w-4 h-4" /> تنزيل هذا الملف
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    dir="ltr"
                    className="flex-grow p-4 bg-slate-950 font-mono text-xs text-slate-300 border-0 focus:ring-0 focus:outline-none resize-none min-h-[380px] w-full"
                    placeholder="اكتب هنا محتويات الملف..."
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-slate-400 min-h-[400px]">
              <FileCode className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
              <p className="text-sm font-bold text-slate-300">لم يتم اختيار أي ملف للتحرير</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">اضغط على أي ملف في مستكشف الملفات الجانبي لفتحه هنا وتعديله أو عرضه وحفظه مباشرة في بيئة النظام.</p>
            </div>
          )}
        </div>
      </div>

      {/* نافذة إنشاء ملف أو مجلد جديد */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-right">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                {newItemIsDirectory ? 'إنشاء مجلد جديد' : 'إنشاء ملف جديد'}
              </span>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">المسار الأب الحالي:</label>
                <code className="block p-2 rounded-lg bg-slate-950 text-xs font-mono text-slate-400 truncate text-left" dir="ltr">
                  {currentDir || '.'}
                </code>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">اسم العنصر الجديد:</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={newItemIsDirectory ? "مثال: src/components" : "مثال: custom-style.css"}
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-mono text-white text-left"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingItem}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 transition-all shadow-md"
                >
                  {isCreatingItem ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  إنشاء وتطبيق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
