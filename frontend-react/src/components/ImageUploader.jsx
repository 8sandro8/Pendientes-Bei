import { useState, useRef, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ImageUploader({ onUploadComplete, maxFiles = MAX_FILES, label = 'Imágenes', existingImages = [] }) {
  const { authFetch } = useAdmin();
  const [previews, setPreviews] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFiles = (files) => {
    const fileArray = Array.from(files);
    const errors = [];

    if (previews.length + uploadedUrls.length + fileArray.length > maxFiles) {
      errors.push(`Máximo ${maxFiles} imágenes`);
    }

    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: tipo no permitido (solo jpeg, png, gif, webp)`);
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`${file.name}: excede ${MAX_SIZE_MB}MB`);
      }
    }

    return errors;
  };

  const addFiles = useCallback((files) => {
    setError('');
    const fileArray = Array.from(files);
    const validationErrors = validateFiles(files);

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    const newPreviews = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file)
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
  }, [previews.length, uploadedUrls.length]);

  const removePreview = (id) => {
    setPreviews(prev => {
      const removed = prev.find(p => p.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const removeUploaded = (url) => {
    setUploadedUrls(prev => prev.filter(u => u !== url));
    onUploadComplete(uploadedUrls.filter(u => u !== url));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      addFiles(files);
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    previews.forEach(p => formData.append('files[]', p.file));

    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let message = 'Error al subir imágenes';
        try {
          const data = await res.json();
          message = data.message || message;
        } catch {}
        throw new Error(message);
      }

      const uploaded = await res.json();
      const urls = uploaded.map(u => u.url);

      setUploadedUrls(prev => [...prev, ...urls]);
      setPreviews([]);
      setUploadProgress(100);

      const allUrls = [...uploadedUrls, ...urls];
      onUploadComplete(allUrls);
    } catch (err) {
      setError(err.message || 'Error al subir imágenes');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClickZone = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClickZone();
    }
  };

  const totalImages = previews.length + uploadedUrls.length + existingImages.length;
  const canAddMore = totalImages < maxFiles;
  const hasPendingUploads = previews.length > 0;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imágenes"
        onClick={canAddMore ? handleClickZone : undefined}
        onKeyDown={canAddMore ? handleKeyDown : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-primary bg-pink-50'
            : canAddMore
              ? 'border-gray-300 hover:border-primary hover:bg-gray-50'
              : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-sm font-medium">
            {isDragging ? 'Suelta aquí' : 'Arrastra imágenes o haz clic'}
          </p>
          <p className="text-gray-400 text-xs">
            JPEG, PNG, GIF, WebP · Máx. {MAX_SIZE_MB}MB por archivo · {maxFiles} archivos máx.
          </p>
          <p className="text-gray-400 text-xs">
            {totalImages} / {maxFiles} imágenes
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-error text-sm whitespace-pre-line">{error}</p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              {previews.length} imagen{previews.length !== 1 ? 'es' : ''} pendiente{previews.length !== 1 ? 's' : ''} de subir
            </p>
            <button
              type="button"
              onClick={() => setPreviews([])}
              className="text-xs text-gray-500 hover:text-error"
            >
              Cancelar todo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {previews.map((p) => (
              <div key={p.id} className="relative group">
                <img
                  src={p.preview}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePreview(p.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasPendingUploads && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-accent transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isUploading ? `Subiendo... ${uploadProgress}%` : `Subir ${previews.length} imagen${previews.length !== 1 ? 'es' : ''}`}
          </button>
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {uploadedUrls.length} imagen{uploadedUrls.length !== 1 ? 'es' : ''} subida{uploadedUrls.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {uploadedUrls.map((url, index) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt={`Subida ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border-2 border-primary"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <button
                  type="button"
                  onClick={() => removeUploaded(url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 mb-2">
            Imágenes existentes
          </p>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((url, index) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt={`Existente ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
