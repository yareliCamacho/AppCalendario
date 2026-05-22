import { useState } from 'react';
import { photoUploadService } from '../services/PhotoUploadService';

export function usePhotoUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = async (params: Parameters<typeof photoUploadService.uploadEventPhoto>[0]) => {
    setUploading(true);
    setProgress(0);
    try {
      return await photoUploadService.uploadEventPhoto({
        ...params,
        onProgress: setProgress,
      });
    } finally {
      setUploading(false);
    }
  };

  return { upload, progress, uploading };
}
