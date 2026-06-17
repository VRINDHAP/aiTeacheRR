import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFileText, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';
import { GlassCard } from './GlassCard';

export interface DocumentData {
  id: string;
  filename: string;
  size: number;
  text_len: number;
  upload_time: string;
}

interface DocManagerProps {
  documents: DocumentData[];
  selectedDocIds: string[];
  onToggleDocSelect: (docId: string) => void;
  onUploadSuccess: () => void;
  onDeleteSuccess: () => void;
  backendUrl: string;
  apiKey: string;
}

export const DocManager: React.FC<DocManagerProps> = ({
  documents,
  selectedDocIds,
  onToggleDocSelect,
  onUploadSuccess,
  onDeleteSuccess,
  backendUrl,
  apiKey
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'X-Gemini-API-Key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid toggling selection when deleting
    
    if (!window.confirm('Are you sure you want to delete this study document?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/documents/${docId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      onDeleteSuccess();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="doc-manager">
      <style>{`
        .doc-manager {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }

        .section-title {
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .upload-zone {
          border: 2px dashed var(--border-glass);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          background: hsla(223, 30%, 10%, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .upload-zone:hover, .upload-zone.dragging {
          border-color: var(--secondary);
          background: hsla(190, 95%, 50%, 0.05);
          box-shadow: 0 0 15px var(--secondary-glow);
        }

        .upload-icon {
          font-size: 2rem;
          color: var(--secondary);
          margin-bottom: 4px;
        }

        .upload-text {
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .upload-subtext {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .doc-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          flex-grow: 1;
          max-height: calc(100vh - 420px);
          padding-right: 4px;
        }

        .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 8px;
          background: hsla(223, 20%, 15%, 0.4);
          border: 1px solid var(--border-glass);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .doc-item:hover {
          background: hsla(223, 20%, 20%, 0.6);
          border-color: hsla(223, 20%, 30%, 0.6);
        }

        .doc-item.selected {
          border-color: var(--secondary);
          background: hsla(190, 95%, 50%, 0.05);
        }

        .doc-info {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
          flex-grow: 1;
        }

        .doc-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-icon {
          font-size: 1.25rem;
          color: var(--text-muted);
        }

        .selected .doc-icon {
          color: var(--secondary);
        }

        .checkbox-overlay {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: var(--secondary);
          border-radius: 50%;
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dark);
          font-size: 8px;
          font-weight: bold;
        }

        .doc-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .doc-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .delete-btn:hover {
          color: var(--danger);
          background: hsla(355, 85%, 60%, 0.1);
        }

        .error-message {
          color: var(--danger);
          font-size: 0.8rem;
          margin-top: 4px;
          padding: 8px;
          border-radius: 6px;
          background: hsla(355, 85%, 60%, 0.05);
          border: 1px dashed hsla(355, 85%, 60%, 0.2);
        }

        .no-docs {
          text-align: center;
          padding: 24px;
          color: var(--text-muted);
          font-size: 0.85rem;
          border: 1px dashed var(--border-glass);
          border-radius: 8px;
        }

        .upload-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--secondary);
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <h3 className="section-title">Study Materials</h3>

      {/* Upload Box */}
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.md,.markdown"
          style={{ display: 'none' }}
        />
        {isUploading ? (
          <div className="upload-loading">
            <div className="spinner" />
            <span>Processing study material...</span>
          </div>
        ) : (
          <>
            <FiUploadCloud className="upload-icon" />
            <span className="upload-text">Upload PDF or Text File</span>
            <span className="upload-subtext">Drag & drop or browse</span>
          </>
        )}
      </div>

      {uploadError && <div className="error-message">{uploadError}</div>}

      {/* Document List */}
      <div className="doc-list">
        {documents.length === 0 ? (
          <div className="no-docs">
            No study materials uploaded. The avatar will teach from general knowledge.
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                className={`doc-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleDocSelect(doc.id)}
              >
                <div className="doc-info">
                  <div className="doc-icon-wrapper">
                    <FiFileText className="doc-icon" />
                    {isSelected && (
                      <div className="checkbox-overlay">
                        <FiCheck />
                      </div>
                    )}
                  </div>
                  <div className="doc-details">
                    <span className="doc-name" title={doc.filename}>{doc.filename}</span>
                    <span className="doc-meta">
                      {formatSize(doc.size)} • {doc.text_len} chars
                    </span>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDelete(doc.id, e)}
                  title="Delete document"
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
