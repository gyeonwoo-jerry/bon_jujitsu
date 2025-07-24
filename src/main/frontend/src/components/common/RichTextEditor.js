import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import API from '../../utils/api';

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
            텍스트를 선택하여 서식을 적용할 수 있습니다.
            표 삽입, 링크 추가, YouTube 동영상 임베드 등이 가능합니다.
            이미지는 하단의 '미디어 업로드' 섹션을 이용해주세요.
          </small>
        </div>
      </div>
  );
};

export default RichTextEditor;