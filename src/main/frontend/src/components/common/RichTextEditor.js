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

  const editorConfiguration = {
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

    heading: {
      options: [
        { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' }
      ]
    },

    image: {
      toolbar: [
        'imageTextAlternative',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side'
      ]
    },

    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    },

    mediaEmbed: {
      previewsInData: true
    },

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

    // ✅ Base64 업로드 어댑터 설정 (원래대로)
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

// ✅ Base64 이미지 업로드 어댑터 (원래대로)
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

      // 파일 크기 체크 (3MB 제한) - Base64로 인한 용량 증가 고려
      if (file.size > 3 * 1024 * 1024) {
        reject(new Error('이미지 크기는 3MB 이하여야 합니다. (Base64 변환으로 용량이 증가합니다)'));
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