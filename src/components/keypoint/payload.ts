export const methods = {
  onSubmit: 'onSave',
  submitReviews: 'saveReviews',
  getReviews: 'saveReviews',
  getStatistics: 'getStatistics',
};
export const samplePayload = {
  job_id: 'landmark_job',
  task_id: 'landmark_task',
  record_id: 'landmark_record',
  worker_id: 'landmark_worker',
  tool_mode: 'LABELING',
  image: 'https://appen-tool-test.oss-cn-zhangjiakou.aliyuncs.com/sample-data/image-2D/dog.jpg, https://appen-tool-test.oss-cn-zhangjiakou.aliyuncs.com/sample-data/image-2D/dog.jpg', // '',
  ontology: [
    {
      class_name: 'Ontology',
      children: [
        {
          name: 'default',
          count: 224,
          type: 'keypoint',
          categories: [
            {
              name: '脸部轮廓',
              range: [0, 32],
              keys: [0, 8, 16, 24, 32],
            },
            {
              name: '左眉',
              range: [33, 46],
              keys: [33, 40],
            },
            {
              name: '右眉',
              range: [47, 61],
              keys: [47, 55],
            },
            {
              name: '左眼',
              range: [62, 83],
              keys: [62, 73],
            },
            {
              name: '右眼',
              range: [84, 105],
              keys: [84, 95],
            },
            {
              name: '左眼球',
              range: [106, 111],
              keys: [111],
            },
            {
              name: '右眼球',
              range: [112, 117],
              keys: [117],
            },
            {
              name: '鼻子',
              range: [118, 145],
              keys: [118, 121, 124, 125, 135, 145],
            },
            {
              name: '上嘴唇',
              range: [146, 179],
              keys: [146, 152, 154, 156, 162, 171],
            },
            {
              name: '下嘴唇',
              range: [180, 209],
              keys: [187, 195, 202, 209],
            },
            {
              name: '左法令纹',
              range: [210, 216],
              keys: [210, 213, 216],
            },
            {
              name: '右法令纹',
              range: [217, 223],
              keys: [217, 220, 223],
            }
          ],
          reference: '',
        }
      ]
    }
  ],
  check_missing_point: true
};
