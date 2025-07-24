/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import classnames from 'classnames';
import { Table, Button, Select, Input, Card, Radio, Tag } from 'antd';
import { formatTime, simpleClone } from './util';
import { UNDEFINED_COLOR } from './AnnotationForm';
import { isReviewEditable } from '../../utils/tool-mode';

class AnnotationResults extends React.Component {
  constructor() {
    super();
    this.state = {
      qaIndex: null,
    };
    // this.typeFilter = [];
    this.snapshotPlaceholder = null;
  }

  componentDidMount() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = '1px';
    const h = '1px';
    ctx.fillStyle = '#ddddddff';
    ctx.fillRect(0, 0, w, h);
    this.snapshotPlaceholder = canvas.toDataURL('image/png');
  }

  getColumns() {
    const { results, advertisementNameMap } = this.props;

    const adNames = new Set();
    const adTypes = new Set();
    results.forEach((result) => {
      const adName = result.name;
      const adType = result.type;
      if (adName) {
        adNames.add(adName);
      }
      if (adType && adType.length > 0) {
        adTypes.add(adType[adType.length - 1]);
      }
    });

    return [
      {
        title: 'ID',
        key: 'id',
        width: 50,
        dataIndex: 'id',
        render: (text, record) => {
          let i = -1;
          results.some((result, index) => {
            if (result.key === record.key) {
              i = result.key;
              return true;
            };
            return false;
          });
          return i;
        },
        sorter: (a, b) => (a.key - b.key),
      },
      {
        title: '识别结果',
        key: 'name',
        width: 150,
        dataIndex: 'name',
        render: (text, record) => (
          <Tag color={advertisementNameMap.get(text) || UNDEFINED_COLOR}>
            {text || '未识别'}
          </Tag>
        ),
        filters: [...adNames].map((item) => ({
          text: item || '',
          value: item || '',
        })).concat({ text: '未识别', value: '未识别' }),
        onFilter: (value, record) => {
          if (record.name == null) return value === '未识别';
          return record.name.indexOf(value) === 0;
        },
      },
      {
        title: '广告形式',
        key: 'type',
        dataIndex: 'type',
        render: (text, record) => (
          text.join(' / ') || (
          <span>
            未选择
          </span>
          )
        ),
        filters: [...adTypes].map((item) => ({
          text: item || '',
          value: item || '',
        })).concat({ text: '未选择', value: '未选择' }),
        onFilter: (value, record) => {
          if (record.type.length === 0) return value === '未选择';
          return record.type[record.type.length - 1] === value;
        }
      },
      {
        title: '开始时间',
        key: 'start',
        width: 100,
        dataIndex: 'start',
        render: (text, record) => formatTime(text),
        sorter: (a, b) => (a.start - b.start),
      },
      {
        title: '结束时间',
        key: 'end',
        width: 100,
        dataIndex: 'end',
        render: (text, record) => formatTime(text),
        sorter: (a, b) => (a.end - b.end),
      },
      {
        title: '视频截图',
        key: 'snapshot',
        width: 150,
        dataIndex: 'snapshot',
        render: (text, record, index) => {
          if (!text) {
            return <span>-</span>;
          }
          return <img src={text} height="100" width="178" alt="snapshot" />;
        },
      },
      {
        title: '质检结果',
        width: 100,
        key: 'qaState',
        render: (text, record) => {
          if (this.isUnfinished(record)) {
            return (
              <Tag
                onClick={(e) => this.handleTagClick(e, record.key)}
                style={{
                  backgroundColor: `${UNDEFINED_COLOR}40`,
                  borderColor: UNDEFINED_COLOR,
                }}
              >
                未完成
              </Tag>
            );
          };
          switch (record.qaState) {
            case 'accepted':
              return <Tag color="green" onClick={(e) => this.handleTagClick(e, record.key)}>已通过</Tag>;
            case 'rejected':
              return <Tag color="red" onClick={(e) => this.handleTagClick(e, record.key)}>被驳回</Tag>;
            default:
              return <Tag color="gold" onClick={(e) => this.handleTagClick(e, record.key)}>待质检</Tag>;
          };
        },
        filters: [{ text: '通过', value: 'accepted' }, { text: '驳回', value: 'rejected' }, { text: '未质检', value: 'unchecked' }, { text: '未完成', value: 'unfinished' }],
        onFilter: (value, record) => {
          if (value !== 'unfinished') return value === record.qaState;
          return (record.name == null || !record.type.length || record.end == null || record.start == null);
        }
      }
    ];
  }

  isUnfinished = (item) => (item.name == null || !item.type?.length || item.end == null || item.start == null || !item.position?.length);

  handleTagClick(e, index) {
    e.preventDefault();
    e.stopPropagation();
    const { qaIndex } = this.state;
    this.setState({
      qaIndex: qaIndex === index ? null : index,
      clientX: this.container.offsetLeft + 400, // e.clientX - document.getElementById('advertisement-annotation-app').offsetLeft,
      clientY: this.container.offsetTop - 150, // e.clientY - document.getElementById('advertisement-annotation-app').offsetTop,
    });
  }

  handleRowClick(record) {
    const { canvas, results } = this.props;
    if (!canvas || !canvas.video) return;
    const key = record.key;
    // this.props.playVideo(record);
    canvas.video.pause();
    if (record.start || record.start === 0) {
      canvas.video.currentTime = record.start;
    }
    this.props.setCurrentIndex(key);
    this.props.focusItemInRightSide(key);
  }

  handleButtonClick(e, type) {
    this.setState({
      qaIndex: null,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getResult(results, key) {
    return results.find((r) => r.key === key);
  }

  handleSelectChange(e, type) {
    const { results } = this.props;
    const { qaIndex } = this.state;
    if (!this.getResult(results, qaIndex)) return;
    const resultsCopy = simpleClone(results);
    const copyItem = this.getResult(resultsCopy, qaIndex);
    copyItem.qaReason = e;
    this.props.handleResultsChange(resultsCopy);
  }

  handleInputChange(e, type) {
    const { results } = this.props;
    const { qaIndex } = this.state;
    if (!this.getResult(results, qaIndex)) return;
    const resultsCopy = simpleClone(results);
    const copyItem = this.getResult(resultsCopy, qaIndex);
    copyItem.qaComment = e.target.value;
    this.props.handleResultsChange(resultsCopy);
  }

  handleRadioChange(e, type) {
    const { results } = this.props;
    const { qaIndex } = this.state;
    if (!this.getResult(results, qaIndex)) return;
    const resultsCopy = simpleClone(results);
    const copyItem = this.getResult(resultsCopy, qaIndex);
    copyItem.qaState = e.target.value;
    this.props.handleResultsChange(resultsCopy);
  }

  render() {
    const { results, currentIndex, issueTypes, toolMode } = this.props;
    const issueTypesList = (issueTypes || '广告形式错误,开始时间不准确,结束时间不准确,识别结果错误,其他').split(',');
    const { qaIndex, clientX, clientY } = this.state;
    const qaItem = this.getResult(results, qaIndex);
    const qaDisabled = (qaItem && this.isUnfinished(qaItem)) || !isReviewEditable(toolMode);
    return (
      <div
        className="annotation-results-container"
        ref={(r) => { this.container = r; }}
      >
        <Table
          columns={this.getColumns()}
          dataSource={results}
          size="middle"
          pagination={{ position: ['bottomRight'] }}
          // scroll={{ y: 300 }}
          onRow={(record, rowkey) => ({
            onClick: this.handleRowClick.bind(this, record), // 有点击事件的时候鼠标应该变成手指
          })}
          rowClassName={(record, index) => classnames({
            'annotation-results-row-focus': record.key === currentIndex,
            'annotation-results-row-fail': this.isUnfinished(record),
          })}
          rowKey={(record) => record.key}
        />
        {
          qaIndex != null && qaItem
            ? (
              <Card
                style={{
                  position: 'absolute',
                  left: clientX,
                  top: clientY,
                  width: '400px',
                  height: '200px',
                  zIndex: '3',
                  backgroundColor: 'whitesmoke'
                }}
              >
                {`ID: ${qaIndex}`}
                <Radio.Group
                  value={this.qaState}
                  size="small"
                  className="qa-state-radio"
                  onChange={(e) => this.handleRadioChange(e, 'qaState')}
                  disabled={qaDisabled}
                >
                  <Radio.Button value="accepted">通过</Radio.Button>
                  <Radio.Button value="rejected">驳回</Radio.Button>
                </Radio.Group>
                <Select
                  size="small"
                  value={qaItem.qaReason}
                  className="qa-reason-select"
                  onChange={(e) => this.handleSelectChange(e, 'qaReason')}
                  getPopupContainer={() => document.getElementById('root')}
                  disabled={qaDisabled || qaItem.qaState === 'accepted'}
                >
                  {issueTypesList.map((value, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Select.Option value={value} key={index}>{value}</Select.Option>
                  ))}
                </Select>
                <label style={{ float: 'right' }}>原因</label>
                <Input.TextArea
                  rows={4}
                  className="qa-comment-textarea"
                  value={qaItem.qaComment}
                  onChange={(e) => this.handleInputChange(e, 'qaComment')}
                  disabled={qaDisabled || qaItem.qaState === 'accepted'}
                />
                <Button
                  size="small"

                  style={{ float: 'right' }}
                  onClick={(e) => this.handleButtonClick(e, 'qaClose')}
                >
                  关闭
                </Button>
              </Card>
            )
            : null
        }
      </div>
    );
  }
}

export default AnnotationResults;
