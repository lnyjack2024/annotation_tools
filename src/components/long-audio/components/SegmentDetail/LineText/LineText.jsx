/* eslint-disable react/no-array-index-key */
/* eslint-disable no-bitwise */
/* eslint-disable no-undef */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import './LineText.scss';
import { Input, Tooltip, notification } from 'antd';
import { setLineText } from '../../../redux/action';
import { translate, tagType, shortText } from '../../../constants';
import { isAnnotationReadonly } from '../../../../../utils/tool-mode';
import TagIcon from '../../common/Icons/TagIcon';
import StandaloneTagIcon from '../../common/Icons/StandaloneTagIcon';
import {containsRTLLanguage, escapeRegExp } from '../../../../../utils';

notification.config({ top: 60 });

const LineText = (props) => {
  const textareaRef = useRef();
  const [translation, setTranslation] = useState('');
  const [isSelectedTag, setIsSelectedTag] = useState(false);
  const { text, lineIndex, tagGroup } = props;

  useEffect(() => {
    if (text !== translation) {
      setTranslation(text);
    }
  }, [text]);

  const handleTextChange = (value) => {
    setTranslation(value);
    props.setLineText({
      text: value,
      videoIndex: null,
      segmentIndex: null,
      lineIndex,
    });
  };

  const handleTagClick = (group, tag) => {
    if (isAnnotationReadonly(props.toolMode) || props.annotateDisabled) {
      return;
    }
    const domTextArea = textareaRef.current.resizableTextArea.textArea;
    const txt = domTextArea.value;
    const before = txt.substring(0, domTextArea.selectionStart);
    const selected = txt.substring(domTextArea.selectionStart, domTextArea.selectionEnd);
    const after = txt.substring(domTextArea.selectionEnd);
    let newTxt = domTextArea.value;
    let newSelection = before?.length;
    if (group.type === tagType.standalone) {
      newSelection += tag.text?.length;
      newTxt = `${before}${tag.text}${after}`;
    } else if (group.type === tagType.tag) {
      newSelection += tag.prefix?.length + selected?.length + (selected.length === 0 ? 0 : tag.suffix?.length);
      newTxt = `${before}${tag.prefix}${selected}${tag.suffix}${after}`;
    }
    domTextArea.value = newTxt;
    handleTextChange(newTxt);
    domTextArea.focus();
    domTextArea.setSelectionRange(newSelection, newSelection);
  };

  const handleTagShortcut = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key) {
      e.preventDefault();
      tagGroup.forEach((group) => {
        group.tags.forEach((tag) => {
          if (e.key.toUpperCase() === tag.shortcut?.toUpperCase()) {
            handleTagClick(group, tag);
          }
        });
      });
    }
  };

  const textTags = useMemo(() => {
    /**
     *  {
     *    "text": "#4"
     *    "name": "#4"
     *  },
     */
    const standaloneTags = tagGroup?.find((t) => t.type === tagType.standalone)?.tags || [];
    /**
     *  {
     *    "prefix": "【",
     *    "suffix": "】",
     *    "name": "【】"
     *  },
     */
    const tags = tagGroup?.find((t) => t.type === tagType.tag)?.tags || [];
    const tagArray = [];
    if (!!translation && (standaloneTags.length > 0 || tags.length > 0)) {
      for (let i = 0; i < standaloneTags.length; i += 1) {
        const tag = standaloneTags[i].text;
        const regexp = new RegExp(escapeRegExp(tag), 'g');
        const list = [...translation.matchAll(regexp)];
        tagArray.push(...list.map((m) => ({
          text: tag,
          start: m.index,
          end: m.index + tag.length
        })));
      }

      for (let i = 0; i < tags.length; i += 1) {
        const { prefix, suffix, name } = tags[i];
        const prefixRegexp = new RegExp(escapeRegExp(prefix), 'g');
        const suffixRegexp = new RegExp(escapeRegExp(suffix), 'g');
        const prefixs = [...translation.matchAll(prefixRegexp)];
        const suffixs = [...translation.matchAll(suffixRegexp)];
        const prefixList = prefixs.map((m) => ({
          text: name,
          start: m.index,
          end: m.index + prefix.length
        }));
        const suffixList = suffixs.map((m) => ({
          text: name,
          start: m.index,
          end: m.index + suffix.length
        }));
        for (let n = prefixList.length - 1; n >= 0; n -= 1) {
          const prefixTag = prefixList[n];
          const suffixTagIndex = suffixList.findIndex((s) => prefixTag.start < s.start);
          if (suffixTagIndex >= 0) {
            const suffixTag = suffixList[suffixTagIndex];
            tagArray.push({
              ...prefixTag,
              end: suffixTag.end
            });
            suffixList.splice(suffixTagIndex, 1);
          } else {
            tagArray.push(prefixTag);
          }
        }
        if (suffixList.length > 0) {
          tagArray.push(...suffixList);
        }
      }
    }
    return tagArray.sort((a, b) => b.start - a.start);
  }, [translation, tagGroup]);

  const handleClick = () => {
    if (isSelectedTag) {
      setIsSelectedTag(false);
      return;
    }
    const domTextArea = textareaRef.current.resizableTextArea.textArea;
    const { selectionStart, selectionEnd, value } = domTextArea;
    if (selectionStart === selectionEnd && selectionStart > 0 && selectionEnd < value.length) {
      const selectedTag = textTags.find((s) => selectionStart >= s.start && selectionEnd < s.end);
      if (selectedTag) {
        domTextArea.setSelectionRange(selectedTag.start, selectedTag.end);
      }
    }
  };

  return (
    <div className="line-text-container">
      <div className="line-text-head">
        <div className="line-text-content-title">{`${translate('content')}:`}</div>
      </div>
      <Input.TextArea
        ref={textareaRef}
        className="line-text"
        value={translation}
        autoSize={{ minRows: 6 }}
        onChange={(e) => handleTextChange(e.target.value)}
        autoComplete="off"
        disabled={isAnnotationReadonly(props.toolMode) || props.annotateDisabled}
        onFocus={() => { window.disableLongAudioHotKeys = true; }}
        onBlur={() => { window.disableLongAudioHotKeys = false; setIsSelectedTag(false); }}
        onKeyDown={(e) => { handleTagShortcut(e); }}
        dir={containsRTLLanguage(translation) ? 'rtl' : 'ltr'}
        onClick={handleClick}
      />
      <div>
        {
          tagGroup.length > 0 && (
            <div className="tags-group-shortcut">
              {translate('TAG_SHORTCUT')}
              : ctrl+shift+[key]
            </div>
          )
        }
        {
          tagGroup.map((group) => (
            <div key={`tags-group-${group.name}`} className="tags-group">
              <Tooltip
                title={group.name}
              >
                <div className="tags-group-tag-icon">
                  {
                    group.type === tagType.tag && <TagIcon size={16} viewBox="0 0 16 16" />
                  }
                  {
                    group.type === tagType.standalone && <StandaloneTagIcon size={16} viewBox="0 0 16 16" />
                  }
                </div>
              </Tooltip>
              <div className="tags-group-tags">
                {
                group.tags.map((tag, idx) => (
                  <Tooltip
                    overlayClassName="tooltip"
                    key={`tags-group-tag-${group.name}-${tag.name}-${idx}`}
                    title={`${translate('TAG')}: ${tag.prefix ? tag.prefix : ''}${tag.suffix ? tag.suffix : ''}${tag.text ? tag.text : ''} ${tag.shortcut ? `${translate('TAG_SHORTCUT')}: ctrl+shift+${tag.shortcut}` : ''}`}
                  >
                    <span
                      className={`tags-group-tag tags-group-tag-${group.type} tags-group-tag-${isAnnotationReadonly(props.toolMode) || props.annotateDisabled ? 'disabled' : 'enabled'}`}
                      key={`tags-group-tag-${group.name}-${tag.name}-${idx}`}
                      onClick={() => handleTagClick(group, tag)}
                    >
                      {`${shortText(tag.name, 50)}${tag.shortcut ? ` [${tag.shortcut}]` : ''}`}
                    </span>
                  </Tooltip>
                ))
              }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

LineText.propTypes = {
  setLineText: PropTypes.func,
  text: PropTypes.string,
  lineIndex: PropTypes.number,
};
const mapStateToProps = (state) => ({
  toolMode: state.toolMode,
  tagGroup: state.tagGroup,
  wavesurfers: state.wavesurfers,
  autoTranscription: state.autoTranscription,
  autoTranscriptionLanguage: state.autoTranscriptionLanguage,
  autoTranscriptionEndpoint: state.autoTranscriptionEndpoint,
  jobId: state.jobId,
  videos: state.videos,
  currentVideo: state.currentVideo,
  wordTimestamps: state.wordTimestamps,
  annotateDisabled: state.annotateDisabled,
  jobProxy: state.jobProxy,
});
const mapDispatchToProps = {
  setLineText,
};
export default connect(mapStateToProps, mapDispatchToProps)(LineText);
