import React from 'react';
import './SmallDataPreview.css';

export default function SmallDataPreviewView({ data, trevType }) {
  const output = [];
  let outputKey = 1;

  function recurse(current, classes = '', top = false) {
    if (current === undefined) {
      return;
    } else if (current === null) {
      output.push(<span key={outputKey++} className={`preview-null ${classes}`}>null</span>);
      return;
    }
  
    switch (typeof current) {
      case 'number':
        output.push(<span key={outputKey++} className={`preview-number ${classes}`}>{current}</span>);
        return;
      case 'boolean':
        output.push(<span key={outputKey++} className={`preview-boolean ${classes}`}>{current.toString()}</span>);
        return;
      case 'string':
        output.push(<span key={outputKey++} className={`preview-string ${classes}`}>{JSON.stringify(current)}</span>);
        return;
      case 'object':
        switch (current.type) {
          case 'array':
            {
              const keys = Object.keys(current);
              output.push(<span key={outputKey++} className="preview-array-start">[</span>);
              let count = 0;
              let fixedWidth = top;
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === 'type' || key === 'id') {
                  continue;
                }
                if (count > 0) {
                  output.push(<span key={outputKey++} className="preview-array-comma">,</span>);
                }
                if (count > 4 || key !== `.${count}`) {
                  output.push(<span key={outputKey++} className="preview-array-more">...</span>);
                  break;
                }
                fixedWidth = fixedWidth
                              && (current[key] === null
                                  || typeof current[key] === 'boolean'
                                  || typeof current[key] === 'number');
                count++;
                recurse(current[key], fixedWidth ? 'preview-array-fixed-element' : '');
              }
              output.push(<span key={outputKey++} className="preview-array-end">]</span>);
              return;
            }
          case 'bigint':
            output.push(<span key={outputKey++} className={`preview-bigint ${classes}`}>{current.string}</span>);
            return;
          case 'builtin':
            output.push(<span key={outputKey++} className={`preview-builtin ${classes}`}>{current.name}</span>);
            return;
          case 'function':
            if (current['.name'] && current['.name'].value) {
              output.push(<span key={outputKey++} className={`preview-function ${classes}`}>{current['.name'].value}</span>);
            } else {
              let truncated = current.source.slice(0, 20);
              if (truncated.length < current.source.length) {
                truncated += '...';
              }
              output.push(<span key={outputKey++} className={`preview-function ${classes}`}>{truncated}</span>);
            }
            return;
          case 'object':
            {
              output.push(<span key={outputKey++} className="preview-object-start">{'{'}</span>);
              let more = false;
              const keys = Object.keys(current);
              let count = 0;
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === 'type' || key === 'id') {
                  continue;
                }
                if (top && (key === '.arguments' || key === '.this') && trevType === 'fn-start') {
                  more = true;
                  continue;
                }
                if (key === 'prototype') {
                  more = true;
                  continue;
                }
                if (count > 4 || !key.startsWith('.')) {
                  more = true;
                  break;
                }
                if (count > 0) {
                  output.push(<span key={outputKey++} className="preview-object-comma">,</span>);
                }
                count++;
                output.push(<span key={outputKey++} className="preview-object-key">{key.slice(1)}</span>);
                output.push(<span key={outputKey++} className="preview-object-colon">:</span>);
                recurse(current[key]);
              }
              if (more) {
                if (count > 0) {
                  output.push(<span key={outputKey++} className="preview-object-comma">,</span>);
                }
                output.push(<span key={outputKey++} className="preview-object-more">...</span>);
              }
              output.push(<span key={outputKey++} className="preview-object-end">{'}'}</span>);
              return;
            }
          case 'symbol':
            if (current.description) {
              output.push(<span key={outputKey++} className={`preview-symbol ${classes}`}>~{current.description}</span>);
            } else {
              output.push(<span key={outputKey++} className={`preview-symbol ${classes}`}>~{current.id}</span>);
            }
            return;
          default:
            output.push(JSON.stringify(current));
            return;
        }
      default:
        output.push('???');
        return;
    }
  }

  recurse(data, '', true);

  return output;
}
