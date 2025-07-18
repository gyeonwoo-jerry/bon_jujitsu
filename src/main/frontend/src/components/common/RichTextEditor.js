import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = '내용을 입력해주세요...',
  disabled = false,
  height = '400px'
}) => {

  // 무료 버전에서 사용 가능한 기본 설정
  const editorConfiguration = {
    // 무료 버전 기본 툴바
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'outdent',
      'indent',
      '|',
      'imageUpload',
      'blockQuote',
      'insertTable',
      'mediaEmbed',
      '|',
      'undo',
      'redo'
    ],
    placeholder,

    // 제목 설정
    heading: {
      options: [
        { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' }
      ]
    },

    // 이미지 업로드는 base64로 처리 (무료 버전)
    // 실제 서버 업로드를 원한다면 백엔드 구현 필요

    // 표 설정
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    },

    // 미디어 임베드 (YouTube, Vimeo 등)
    mediaEmbed: {
      previewsInData: true
    },

    // 언어 설정 (한국어)
    language: 'ko'
  };

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    if (onChange) {
      onChange(data);
    }
  };

  const handleEditorReady = (editor) => {
    // 에디터 높이 설정
    if (height) {
      editor.editing.view.change(writer => {
        writer.setStyle('min-height', height, editor.editing.view.document.getRoot());
      });
    }

    // 이미지 업로드 어댑터 설정 (base64 방식)
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return new Base64UploadAdapter(loader);
    };
  };

  const handleEditorError = (error, { willEditorRestart }) => {
    console.error('CKEditor 오류:', error);

    if (willEditorRestart) {
      console.log('에디터가 재시작됩니다...');
    }
  };

  return (
      <div className="rich-text-editor">
        <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={value}
            disabled={disabled}
            onChange={handleEditorChange}
            onReady={handleEditorReady}
            onError={handleEditorError}
        />

        {/* 도움말 텍스트 */}
        <div className="editor-help-text">
          <small>
            💡 <strong>사용법:</strong>
            텍스트를 선택하여 서식을 적용하거나, 이미지를 드래그해서 업로드할 수 있습니다.
            표 삽입, 링크 추가, YouTube 동영상 임베드 등이 가능합니다.
          </small>
        </div>
      </div>
  );
};

// Base64 이미지 업로드 어댑터 (무료 버전용)
class Base64UploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file
    .then(file => new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          default: reader.result
        });
      };

      reader.onerror = () => {
        reject(new Error('이미지를 읽을 수 없습니다.'));
      };

      reader.onabort = () => {
        reject(new Error('이미지 업로드가 중단되었습니다.'));
      };

      // 파일 크기 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('이미지 크기는 10MB 이하여야 합니다.'));
        return;
      }

      reader.readAsDataURL(file);
    }));
  }

  abort() {
    // 업로드 중단 처리
  }
}

export default RichTextEditor;