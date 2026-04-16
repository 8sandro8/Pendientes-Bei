import { useState, useRef, useCallback, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useToast } from './Toast';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function GalleryManager({
  principalUrl,
  galleryUrls = [],
  onChange,
  onDeleteImage,
  onUploadComplete,
  maxImages = 10,
}) {
  const { authFetch } = useAdmin();
  const { addToast } = useToast();
  const [images, setImages] = useState(() => buildImageList(principalUrl, galleryUrls));
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [deletingUrls, setDeletingUrls] = useState(new Set());
  const fileInputRef = useRef(null);

  function buildImageList(principal, gallery) {
    const list = [];
    if (principal) {
      list.push({
        id: `existing-${principal}`,
        url: principal,
        isNew: false,
        isPrincipal: true,
      });
    }
    (gallery || []).forEach((url) => {
      if (url !== principal) {
        list.push({
          id: `existing-${url}`,
          url,
          isNew: false,
          isPrincipal: false,
        });
      }
    });
    return list;
  }

  useEffect(() => {
    setImages(buildImageList(principalUrl, galleryUrls));
  }, [principalUrl, galleryUrls]);

  const emitChange = useCallback(
    (newImages) => {
      const principal = newImages[0]?.url || null;
      const gallery = newImages.slice(1).map((img) => img.url);
      onChange?.(principal, gallery);
    },
    [onChange]
  );

  const validateFiles = (files) => {
    const fileArray = Array.from(files);
    const errors = [];

    if (images.length + fileArray.length > maxImages) {
      errors.push(`Máximo ${maxImages} imágenes`);
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

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    e.target.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (draggedIndex !== null) {
      emitChange(images);
    }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesAdded(files);
    }
  };

  const handleFilesAdded = async (files) => {
    setError('');
    const validationErrors = validateFiles(files);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    const fileArray = Array.from(files);
    const newImages = fileArray.map((file) => ({
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      file,
      isNew: true,
      isPrincipal: false,
    }));

    setImages((prev) => {
      const updated = [...prev, ...newImages];
      // Auto-upload inmediato al añadir archivos (pasamos las nuevas imágenes directamente)
      handleUploadDirect(newImages);
      return updated;
    });
  };

  // Upload directo con imágenes específicas (evita race condition)
  const handleUploadDirect = async (imagesToUpload) => {
    if (imagesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    imagesToUpload.forEach((img) => formData.append('files[]', img.file));

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
      const uploadedUrls = uploaded.map((u) => u.url);

      // Actualizar estado: convertir imágenes nuevas a subidas
      setImages((prev) => {
        const existingImages = prev.filter((img) => !img.isNew);
        const uploadedImages = uploadedUrls.map((url, idx) => ({
          id: `uploaded-${url}`,
          url,
          isNew: false,
          isPrincipal: existingImages.length === 0 && idx === 0,
        }));
        const finalImages = [...existingImages, ...uploadedImages];
        emitChange(finalImages);
        return finalImages;
      });
      
      onUploadComplete?.(uploadedUrls);
      setUploadProgress(100);
      addToast('Imágenes subidas correctamente', 'success');
    } catch (err) {
      setError(err.message || 'Error al subir imágenes');
      setUploadProgress(0);
      addToast(err.message || 'Error al subir imágenes', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    const newImages = images.filter((img) => img.isNew && img.file);
    if (newImages.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    newImages.forEach((img) => formData.append('files[]', img.file));

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
      const uploadedUrls = uploaded.map((u) => u.url);

      const existingImages = images.filter((img) => !img.isNew);
      const uploadedImages = uploadedUrls.map((url) => ({
        id: `uploaded-${url}`,
        url,
        isNew: false,
        isPrincipal: false,
      }));

      const finalImages = [...existingImages, ...uploadedImages];
      setImages(finalImages);
      emitChange(finalImages);
      onUploadComplete?.(uploadedUrls);
      setUploadProgress(100);
      addToast('Imágenes subidas correctamente', 'success');
    } catch (err) {
      setError(err.message || 'Error al subir imágenes');
      setUploadProgress(0);
      addToast(err.message || 'Error al subir imágenes', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed?.isNew) {
        URL.revokeObjectURL(removed.url);
      }
      const newImages = prev.filter((img) => img.id !== id);
      emitChange(newImages);
      return newImages;
    });
  };

  const handleDeleteExisting = async (url) => {
    if (deletingUrls.has(url)) return;

    const filename = url.split('/').pop().split('?')[0];

    setDeletingUrls((prev) => new Set([...prev, url]));
    addToast('Eliminando imagen...', 'loading');

    try {
      const res = await authFetch(`/api/images/${filename}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        let message = 'Error al eliminar imagen';
        try {
          const data = await res.json();
          message = data.message || message;
        } catch {}
        throw new Error(message);
      }

      addToast('Imagen eliminada', 'success');
      onDeleteImage?.(url);
      setImages((prev) => {
        const newImages = prev.filter((img) => img.url !== url);
        emitChange(newImages);
        return newImages;
      });
    } catch (err) {
      addToast(err.message || 'Error al eliminar imagen', 'error');
    } finally {
      setDeletingUrls((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const handleSetPrincipal = (index) => {
    if (index === 0) return;

    setImages((prev) => {
      const newImages = [...prev];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected);
      emitChange(newImages);
      return newImages;
    });
    addToast('Imagen marcada como principal', 'success');
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFilesAdded(files);
    }
    e.target.value = '';
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

  // Mostrar indicador de subida cuando hay imágenes pendientes O cuando se está subiendo
  const pendingImages = images.filter((img) => img.isNew);
  const canAddMore = images.length < maxImages;
  const hasPendingUploads = pendingImages.length > 0 || isUploading;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📷 Galería de imágenes
      </label>

      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imágenes"
        onClick={canAddMore ? handleClickZone : undefined}
        onKeyDown={canAddMore ? handleKeyDown : undefined}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all mb-4
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

        <div className="flex flex-col items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 text-sm font-medium">
            {isDragging ? 'Suelta aquí' : 'Arrastra imágenes o haz clic'}
          </p>
          <p className="text-gray-400 text-xs">
            JPEG, PNG, GIF, WebP · Máx. {MAX_SIZE_MB}MB · {images.length}/{maxImages}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-error text-sm whitespace-pre-line">{error}</p>
        </div>
      )}

{hasPendingUploads && isUploading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <p className="text-blue-700 text-sm">
            Subiendo {pendingImages.length} imagen{pendingImages.length !== 1 ? 'es' : ''}...
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-2">
            Arrastra para reordenar · Primera imagen = principal
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((image, index) => {
              const isPrincipal = index === 0;
              const isDeleting = deletingUrls.has(image.url);
              const isDraggingThis = draggedIndex === index;

              return (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  className={`
                    relative group rounded-lg overflow-hidden border-2 transition-all
                    ${isPrincipal ? 'border-yellow-500' : 'border-gray-200'}
                    ${isDraggingThis ? 'opacity-50 scale-95' : ''}
                    ${isDeleting ? 'opacity-50' : ''}
                  `}
                >
                  <img
                    src={image.url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full aspect-square object-cover"
                    onError={(e) => (e.target.style.display = 'none')}
                  />

                  {isPrincipal && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      ⭐ Principal
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!isPrincipal && (
                      <button
                        type="button"
                        onClick={() => handleSetPrincipal(index)}
                        className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-colors"
                        title="Marcar como principal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )}

                    {!image.isNew && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExisting(image.url)}
                        disabled={isDeleting}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                        title="Eliminar imagen"
                      >
                        {isDeleting ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}

                    {image.isNew && (
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        title="Quitar de la lista"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {image.isNew && (
                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Pendiente
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <p>No hay imágenes. Añade la primera imagen arriba.</p>
        </div>
      )}
    </div>
  );
}
