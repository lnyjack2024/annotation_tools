import { getLocale } from "umi";

import type { TemplateAttribute } from "@/types/template";
import { TemplateAttributeType, TemplateType } from "@/types/template";

/**
 * Lidar Cuboid Annotation
 */
const LidarAttributes: TemplateAttribute[] = [
  {
    name: "manifest_url",
    label: {
      "en-US": "Manifest URL",
      "zh-CN": "数据地址",
      "ja-JP": "データアドレス",
      "ko-KR": "데이터 주소",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "",
  },
  {
    name: "label_config",
    label: {
      "en-US": "3D Cuboid Attributes",
      "zh-CN": "3D框属性",
      "ja-JP": "3Dボックスのプロパティ",
      "ko-KR": "3D 프레임 속성",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "label_config_2d",
    label: {
      "en-US": "2D Shape Attributes",
      "zh-CN": "2D框属性",
      "ja-JP": "2Dボックスのプロパティ",
      "ko-KR": "2D 상자 속성",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "frame_label_config",
    label: {
      "en-US": "Frame Attributes",
      "zh-CN": "帧属性",
      "ja-JP": "フレームプロパティ",
      "ko-KR": "프레임 속성",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "default_add_mode",
    label: {
      "en-US": "Default Add Tool",
      "zh-CN": "默认添加工具",
      "ja-JP": "デフォルトで追加されたツール",
      "ko-KR": "기본적으로 추가된 도구",
    },
    type: TemplateAttributeType.RADIO,
    defaultValue: "DRAG",
    options: [
      {
        name: "DRAG",
        label: {
          "en-US": "Drag",
          "zh-CN": "拖拽",
          "ja-JP": "ドラッグアンドドロップ",
          "ko-KR": "드래그",
        },
      },
      {
        name: "CLICK",
        label: {
          "en-US": "Click",
          "zh-CN": "点击",
          "ja-JP": "クリック",
          "ko-KR": "클릭",
        },
      },
    ],
  },
  {
    name: "color_mode",
    label: {
      "en-US": "Color Mode",
      "zh-CN": "着色模式",
      "ja-JP": "シェーディングモード",
      "ko-KR": "음영 모드",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US":
        "Example: speed / elevation / reflection / elevation:[x, y][z, w] / reflection:[x, y][z, w]",
      "zh-CN":
        "填写示例：speed、elevation、reflection、elevation:[x, y][z, w]、reflection:[x, y][z, w]",
      "ja-JP":
        "例を記入してください：speed、elevation、reflection、elevation:[x, y][z, w]、reflection:[x, y][z, w]",
      "ko-KR":
        "예를 입력하세요: speed、elevation、reflection、elevation:[x, y][z, w]、reflection:[x, y][z, w]",
    },
  },
  {
    name: "view_mode",
    label: {
      "en-US": "View Mode",
      "zh-CN": "视图模式",
      "ja-JP": "表示モード",
      "ko-KR": "보기 모드",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "united",
        label: {
          "en-US": "United",
          "zh-CN": "联合标注",
          "ja-JP": "ジョイントアノテーション",
          "ko-KR": "Joint Callout",
        },
      },
      {
        name: "pcd",
        label: {
          "en-US": "PCD First",
          "zh-CN": "点云优先",
          "ja-JP": "ポイントクラウドファースト",
          "ko-KR": "포인트 클라우드 우선",
        },
      },
    ],
    defaultValue: "pcd",
  },
  {
    name: "united_mode",
    label: {
      "en-US": "United Annotation Mode",
      "zh-CN": "联合标注模式",
      "ja-JP": "ジョイントアノテーションモード",
      "ko-KR": "공동 주석 모드",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "UNITED_ADDING",
        label: {
          "en-US": "United Annotation. Auto Project to 2D when add new cube.",
          "zh-CN": "联合标注，首次自动投影2D",
          "ja-JP": "ジョイントアノテーション,最初の自動投影2D",
          "ko-KR": "조인트 주석, 최초의 2D 자동 투영",
        },
      },
      {
        name: "UNITED_MANUAL",
        label: {
          "en-US": "United Annotation. Project to 2D by manual.",
          "zh-CN": "联合标注，手动投影2D",
          "ja-JP": "ジョイントアノテーション,手動プロジェクション2D",
          "ko-KR": "조인트 주석, 수동 투영 2D",
        },
      },
      {
        name: "UNUNITED_ALWAYS",
        label: {
          "en-US": "Non-united Annotation. Auto projection real-time",
          "zh-CN": "非联合标注，实时自动投影",
          "ja-JP":
            "非ジョイントアノテーション,リアルタイム自動プロジェクション",
          "ko-KR": "비조인트 주석, 실시간 자동 투영",
        },
      },
    ],
  },
  {
    name: "project_type",
    label: {
      "en-US": "Project Shape Type",
      "zh-CN": "投影图形类型",
      "ja-JP": "投影グラフィックタイプ",
      "ko-KR": "돌출 형상 유형",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "RECT",
        label: {
          "en-US": "Rectangle",
          "zh-CN": "矩形框",
          "ja-JP": "長方形フレーム",
          "ko-KR": "직사각형 프레임",
        },
      },
      {
        name: "RECT_CUBE",
        label: {
          "en-US": "Cube with Two Rectangles",
          "zh-CN": "前后矩形立体框",
          "ja-JP": "前後の長方形立体フレーム",
          "ko-KR": "전후방 사각 입체 프레임",
        },
      },
    ],
  },
  {
    name: "measurement_box",
    label: {
      "en-US": "Measurement Box",
      "zh-CN": "尺寸辅助框",
      "ja-JP": "サイズアシストフレーム",
      "ko-KR": "크기 보조 프레임",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US": "Example: [[5,5],[3,3]]",
      "zh-CN": "填写示例：[[5,5],[3,3]]",
      "ja-JP": "例を記入してください：[[5,5],[3,3]]",
      "ko-KR": "예를 입력하세요: [[5,5],[3,3]]",
    },
  },
  {
    name: "range_indicators",
    label: {
      "en-US": "Range Indicators",
      "zh-CN": "距离指示圈",
      "ja-JP": "距離インジケーターサークル",
      "ko-KR": "거리 표시기 원",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US": "Example: 5,10,20 / 5:#FF0000,10:#FFFF00,20:#0000FF",
      "zh-CN": "填写示例：5,10,20，或5:#FF0000,10:#FFFF00,20:#0000FF",
      "ja-JP":
        "例を記入してください：5,10,20 / 5:#FF0000,10:#FFFF00,20:#0000FF",
      "ko-KR": "예를 입력하세요: 5,10,20 / 5:#FF0000,10:#FFFF00,20:#0000FF",
    },
  },
  {
    name: "show_grid",
    label: {
      "en-US": "Show Checkerboard on Ground",
      "zh-CN": "显示地面棋盘格",
      "ja-JP": "グラウンドチェッカーボードを表示",
      "ko-KR": "그라운드 바둑판 표시",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "overflow",
    label: {
      "en-US": "Outside Image",
      "zh-CN": "可超出图片边界",
      "ja-JP": "画像の境界を超える可能性があります",
      "ko-KR": "그림 경계를 초과할 수 있음",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },

  {
    name: "axes_transform_matrix",
    label: {
      "en-US": "Axes Transform Matrix",
      "zh-CN": "坐标转换矩阵",
      "ja-JP": "座標変換行列",
      "ko-KR": "좌표 변환 행렬",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "UPPER_Z_RIGHT",
        label: {
          "en-US": "Z-Axis Up Right Hand",
          "zh-CN": "Z轴朝上右手坐标系",
          "ja-JP": "Z軸上右手座標系",
          "ko-KR": "Z축 위쪽 오른쪽 좌표계",
        },
      },
      {
        name: "UPPER_Z_LEFT",
        label: {
          "en-US": "Z-Axis Up Left Hand",
          "zh-CN": "Z轴朝上左手坐标系",
          "ja-JP": "Z軸上左手座標系",
          "ko-KR": "Z축 위쪽 왼쪽 좌표계",
        },
      },
      {
        name: "UPPER_Y_RIGHT",
        label: {
          "en-US": "Y-Axis Up Right Hand",
          "zh-CN": "Y轴朝上右手坐标系",
          "ja-JP": "Y軸上右手座標系",
          "ko-KR": "Y축 위쪽 오른쪽 좌표계",
        },
      },
      {
        name: "UPPER_Y_LEFT",
        label: {
          "en-US": "Y-Axis Up Left Hand",
          "zh-CN": "Y轴朝上左手坐标系",
          "ja-JP": "Y軸上左手座標系",
          "ko-KR": "Y축 위쪽 왼쪽 좌표계",
        },
      },
      {
        name: "UPPER_X_RIGHT",
        label: {
          "en-US": "X-Axis Up Right Hand",
          "zh-CN": "X轴朝上右手坐标系",
          "ja-JP": "X軸右上座標系",
          "ko-KR": "X축 위쪽 오른쪽 좌표계",
        },
      },
      {
        name: "UPPER_X_LEFT",
        label: {
          "en-US": "X-Axis Up Left Hand",
          "zh-CN": "X轴朝上左手坐标系",
          "ja-JP": "X軸上左手座標系",
          "ko-KR": "X축 위쪽 왼쪽 좌표계",
        },
      },
    ],
  },
  {
    name: "revert_x",
    label: {
      "en-US": "Invert X-Axis",
      "zh-CN": "反转X轴",
      "ja-JP": "X軸を反転",
      "ko-KR": "X축 반전",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "revert_y",
    label: {
      "en-US": "Invert Y-Axis",
      "zh-CN": "反转Y轴",
      "ja-JP": "Y軸を反転",
      "ko-KR": "Y축 반전",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "revert_z",
    label: {
      "en-US": "Invert Z-Axis",
      "zh-CN": "反转Z轴",
      "ja-JP": "逆Z軸",
      "ko-KR": "Z축 반전",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "show_truncation_cast",
    label: {
      "en-US": "Display Truncated 2D Cast",
      "zh-CN": "显示被截断的2D框",
      "ja-JP": "切り捨てられた2Dボックスを表示する",
      "ko-KR": "잘린 2D 상자 표시",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "front_side",
    label: {
      "en-US": "Front Side Of Cuboid",
      "zh-CN": "立体框前面方向",
      "ja-JP": "ソリッドフレームの正面方向",
      "ko-KR": "솔리드 프레임의 전면 방향",
    },
    type: TemplateAttributeType.RADIO,
    defaultValue: "0",
    options: [
      {
        name: "0",
        label: {
          "en-US": "positive x-axis",
          "zh-CN": "x轴正向",
          "ja-JP": "正のx軸",
          "ko-KR": "양의 x축",
        },
      },
      {
        name: "1",
        label: {
          "en-US": "positive y-axis",
          "zh-CN": "y轴正向",
          "ja-JP": "正のy軸",
          "ko-KR": "양의 y축",
        },
      },
      {
        name: "2",
        label: {
          "en-US": "negative x-axis",
          "zh-CN": "x轴负向",
          "ja-JP": "負のx軸",
          "ko-KR": "음의 x축",
        },
      },
      {
        name: "3",
        label: {
          "en-US": "negative y-axis",
          "zh-CN": "y轴负向",
          "ja-JP": "負のy軸",
          "ko-KR": "음의 y축",
        },
      },
    ],
  },
];

/**
 * Lidar Segmentation
 */
const LidarSegmentAttributes: TemplateAttribute[] = [
  {
    name: "manifest_url",
    label: {
      "en-US": "Manifest URL",
      "zh-CN": "数据地址",
      "ja-JP": "データアドレス",
      "ko-KR": "데이터 주소",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "",
  },
  {
    name: "label_config",
    label: {
      "en-US": "Instance Attributes",
      "zh-CN": "实例属性",
      "ja-JP": "インスタンスのプロパティ",
      "ko-KR": "인스턴스 속성",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "frame_label_config",
    label: {
      "en-US": "Frame Attributes",
      "zh-CN": "帧属性",
      "ja-JP": "フレームプロパティ",
      "ko-KR": "프레임 속성",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "show_grid",
    label: {
      "en-US": "Show Checkerboard on Ground",
      "zh-CN": "显示地面棋盘格",
      "ja-JP": "グラウンドチェッカーボードを表示",
      "ko-KR": "그라운드 바둑판 표시",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "color_mode",
    label: {
      "en-US": "Color Mode",
      "zh-CN": "着色模式",
      "ja-JP": "シェーディングモード",
      "ko-KR": "음영 모드",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US":
        "Example: Intensity:0.00:#0000FF,0.25:#00FFFF,0.75:#FFFF00,1.00:#FF0000 / Elevation:0.00:#0000FF,1:#00FFFF",
      "zh-CN":
        "填写示例：Intensity:0.00:#0000FF,0.25:#00FFFF,0.75:#FFFF00,1.00:#FF0000、Elevation:0.00:#0000FF,1:#00FFFF",
      "ja-JP":
        "例を記入してください：Intensity:0.00:#0000FF,0.25:#00FFFF,0.75:#FFFF00,1.00:#FF0000、Elevation:0.00:#0000FF,1:#00FFFF",
      "ko-KR":
        "예를 입력하세요: Intensity:0.00:#0000FF,0.25:#00FFFF,0.75:#FFFF00,1.00:#FF0000、Elevation:0.00:#0000FF,1:#00FFFF",
    },
  },
  {
    name: "segmentation_tools",
    label: {
      "en-US": "Tools",
      "zh-CN": "工具",
      "ja-JP": "ツール",
      "ko-KR": "도구",
    },
    type: TemplateAttributeType.CHECKBOX,
    options: [
      {
        name: "POLYGON",
        label: {
          "en-US": "Polygon",
          "zh-CN": "多边形",
          "ja-JP": "ポリゴン",
          "ko-KR": "다각형",
        },
      },
      {
        name: "PAINT",
        label: {
          "en-US": "Paint Brush",
          "zh-CN": "笔刷",
          "ja-JP": "ブラシ",
          "ko-KR": "브러시",
        },
      },
      {
        name: "SINGLE",
        label: {
          "en-US": "Single Point",
          "zh-CN": "单点",
          "ja-JP": "シングルポイント",
          "ko-KR": "싱글 포인트",
        },
      },
    ],
    defaultValue: "POLYGON,PAINT,SINGLE",
  },
  {
    name: "segmentation_qa_type",
    label: {
      "en-US": "QA Type",
      "zh-CN": "质检方式",
      "ja-JP": "品質検査方法",
      "ko-KR": "품질 검사 방법",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "points",
        label: {
          "en-US": "By Points",
          "zh-CN": "按点质检",
          "ja-JP": "ポイントによる品質検査",
          "ko-KR": "포인트별 품질검사",
        },
      },
      {
        name: "instance",
        label: {
          "en-US": "By Instance",
          "zh-CN": "按物体质检",
          "ja-JP": "オブジェクトによる品質検査",
          "ko-KR": "대상별 품질검사",
        },
      },
    ],
    defaultValue: "points",
  },
  {
    name: "range_indicators",
    label: {
      "en-US": "Range Indicators",
      "zh-CN": "距离指示圈",
      "ja-JP": "距離インジケーターサークル",
      "ko-KR": "거리 표시기 원",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US": "Example: 5,10,20 / 5:#FF0000,10:#FFFF00,20:#0000FF",
      "zh-CN": "填写示例：5,10,20，或5:#FF0000,10:#FFFF00,20:#0000FF",
      "ja-JP":
        "例を記入してください：5,10,20 / 5:#FF0000,10:#FFFF00,20:#0000FF",
      "ko-KR": "예를 입력하세요: 5,10,20 / 5:#FF0000,10:#FFFF00,20:#0000FF",
    },
  },

  {
    name: "axes_transform_matrix",
    label: {
      "en-US": "Axes Transform Matrix",
      "zh-CN": "坐标转换矩阵",
      "ja-JP": "座標変換行列",
      "ko-KR": "좌표 변환 행렬",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "UPPER_Z_RIGHT",
        label: {
          "en-US": "Z-Axis Up Right Hand",
          "zh-CN": "Z轴朝上右手坐标系",
          "ja-JP": "Z軸上右手座標系",
          "ko-KR": "Z축 위쪽 오른쪽 좌표계",
        },
      },
      {
        name: "UPPER_Z_LEFT",
        label: {
          "en-US": "Z-Axis Up Left Hand",
          "zh-CN": "Z轴朝上左手坐标系",
          "ja-JP": "Z軸上左手座標系",
          "ko-KR": "Z축 위쪽 왼쪽 좌표계",
        },
      },
      {
        name: "UPPER_Y_RIGHT",
        label: {
          "en-US": "Y-Axis Up Right Hand",
          "zh-CN": "Y轴朝上右手坐标系",
          "ja-JP": "Y軸上右手座標系",
          "ko-KR": "Y축 위쪽 오른쪽 좌표계",
        },
      },
      {
        name: "UPPER_Y_LEFT",
        label: {
          "en-US": "Y-Axis Up Left Hand",
          "zh-CN": "Y轴朝上左手坐标系",
          "ja-JP": "Y軸上左手座標系",
          "ko-KR": "Y축 위쪽 왼쪽 좌표계",
        },
      },
      {
        name: "UPPER_X_RIGHT",
        label: {
          "en-US": "X-Axis Up Right Hand",
          "zh-CN": "X轴朝上右手坐标系",
          "ja-JP": "X軸右上座標系",
          "ko-KR": "X축 위쪽 오른쪽 좌표계",
        },
      },
      {
        name: "UPPER_X_LEFT",
        label: {
          "en-US": "X-Axis Up Left Hand",
          "zh-CN": "X轴朝上左手坐标系",
          "ja-JP": "X軸上左手座標系",
          "ko-KR": "X축 위쪽 왼쪽 좌표계",
        },
      },
    ],
  },
  {
    name: "revert_x",
    label: {
      "en-US": "Invert X-Axis",
      "zh-CN": "反转X轴",
      "ja-JP": "X軸を反転",
      "ko-KR": "X축 반전",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "revert_y",
    label: {
      "en-US": "Invert Y-Axis",
      "zh-CN": "反转Y轴",
      "ja-JP": "Y軸を反転",
      "ko-KR": "Y축 반전",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "revert_z",
    label: {
      "en-US": "Invert Z-Axis",
      "zh-CN": "反转Z轴",
      "ja-JP": "逆Z軸",
      "ko-KR": "Z축 반전",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
];

/**
 * Long Audio
 */
const TranscriptionAttributes: TemplateAttribute[] = [
  {
    name: "audio_url",
    label: {
      "en-US": "Audio URL",
      "zh-CN": "音频地址",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "{{{audio_url}}}",
  },
  {
    name: "word_timestamps",
    label: {
      "en-US": "Word Timestamp URL",
      "zh-CN": "字符时间数据地址",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "",
  },
  {
    name: "label_config_segment",
    label: {
      "en-US": "Segment Attributes",
      "zh-CN": "段属性",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "label_config",
    label: {
      "en-US": "Line Attributes",
      "zh-CN": "行属性",
    },
    type: TemplateAttributeType.FORM,
  },
  {
    name: "global_config",
    label: {
      "en-US": "Global Attributes",
      "zh-CN": "全局属性",
    },
    type: TemplateAttributeType.FORM,
    tips: {
      "en-US":
        "Field is_valid (options: valid & invalid) can be added as audio validity mark",
      "zh-CN":
        "可添加属性字段 is_valid（值为 valid 和 invalid）作为音频有效性标记",
    },
  },
  {
    name: "invalid_annotatable",
    label: {
      "en-US": "Annotatable when Invalid",
      "zh-CN": "无效情况是否允许标注",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "true",
  },
  {
    name: "valid_duration",
    label: {
      "en-US": "Valid Duration",
      "zh-CN": "有效时长",
      "ja-JP": "有効期間",
      "ko-KR": "유효 기간",
    },
    type: TemplateAttributeType.RADIO,
    defaultValue: "attributes",
    options: [
      {
        name: "attributes",
        label: {
          "en-US": "Statistics by key attributes",
          "zh-CN": "按关键属性统计",
          "ja-JP": "キー属性別統計",
          "ko-KR": "주요 속성별 통계",
        },
      },
      {
        name: "translations",
        label: {
          "en-US": "Statistics by translations",
          "zh-CN": "按是否有译文统计",
          "ja-JP": "翻訳の有無による統計",
          "ko-KR": "번역 여부에 따른 통계",
        },
      },
    ],
  },
  {
    name: "key_attribute",
    label: {
      "en-US": "Key Attribute",
      "zh-CN": "关键属性",
    },
    type: TemplateAttributeType.INPUT,
  },
  {
    name: "tag_group",
    label: {
      "en-US": "Tags",
      "zh-CN": "文本标签",
    },
    type: TemplateAttributeType.INPUT,
  },
  {
    name: "overlap",
    label: {
      "en-US": "Multiple Roles",
      "zh-CN": "单段多行",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "true",
  },
  {
    name: "min_length",
    label: {
      "en-US": "Minimum Segment Length",
      "zh-CN": "段最短长度",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "",
    tips: {
      "en-US": "Unit In Seconds",
      "zh-CN": "单位为秒",
    },
  },
  {
    name: "segment_mode",
    label: {
      "en-US": "Segmentation Mode",
      "zh-CN": "分段模式",
    },
    type: TemplateAttributeType.RADIO,
    defaultValue: "continuous",
    options: [
      {
        name: "continuous",
        label: {
          "en-US": "Continuous",
          "zh-CN": "连续分段",
        },
      },
      {
        name: "individual",
        label: {
          "en-US": "Individual",
          "zh-CN": "独立分段",
        },
      },
    ],
  },
  {
    name: "segment_overlap",
    label: {
      "en-US": "Segmentation Overlap",
      "zh-CN": "可重叠分段",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "true",
  },
  {
    name: "space_line",
    label: {
      "en-US": "Space Line (seconds)",
      "zh-CN": "分段首尾辅助线（单位：秒）",
    },
    type: TemplateAttributeType.INPUT,
    validator: (value: string) => {
      if (value === "") {
        return true;
      }
      const num = Number(value);
      if (Number.isNaN(num)) {
        return false;
      }
      return num > 0;
    },
  },
  {
    name: "measurement_box",
    label: {
      "en-US": "Measurement Box",
      "zh-CN": "时间辅助框",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US": "Use comma as delimitation",
      "zh-CN": "多个时间辅助框尺寸（单位：秒）之间以英文逗号分割，例如：1,5,10",
    },
  },
];

/**
 * general image
 */
const GeneralImageAttributes: TemplateAttribute[] = [
  {
    name: "frames",
    label: {
      "en-US": "Frame Image URLs",
      "zh-CN": "图片地址列表",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "{{{frames}}}",
  },
  {
    name: "base_url",
    label: {
      "en-US": "Data URL",
      "zh-CN": "数据地址",
    },
    type: TemplateAttributeType.INPUT,
  },
  // {
  //   name: 'review_from',
  //   label: {
  //     'en-US': 'Initial Data',
  //     'zh-CN': '初始数据地址',
  //   },
  //   type: TemplateAttributeType.INPUT,
  // },
  // {
  //   name: 'label_item',
  //   label: {
  //     'en-US': 'Displayed Items',
  //     'zh-CN': '标签显示内容',
  //   },
  //   type: TemplateAttributeType.CHECKBOX,
  //   options: [
  //     {
  //       name: 'category',
  //       label: {
  //         'en-US': 'Category',
  //         'zh-CN': '类别',
  //       },
  //     },
  //     {
  //       name: 'number',
  //       label: {
  //         'en-US': 'Number',
  //         'zh-CN': '编号',
  //       },
  //     },
  //     {
  //       name: 'tool-name',
  //       label: {
  //         'en-US': 'Shape',
  //         'zh-CN': '图形',
  //       },
  //     },
  //     {
  //       name: 'attribute-keys',
  //       label: {
  //         'en-US': 'Instance Attribute Keys',
  //         'zh-CN': '物体属性名',
  //       },
  //     },
  //     {
  //       name: 'attribute-values',
  //       label: {
  //         'en-US': 'Instance Attribute Values',
  //         'zh-CN': '物体属性值',
  //       },
  //     },
  //     {
  //       name: 'item-name',
  //       label: {
  //         'en-US': 'Item Name',
  //         'zh-CN': '组件名',
  //       },
  //     },
  //     {
  //       name: 'item-number',
  //       label: {
  //         'en-US': 'Item Number',
  //         'zh-CN': '组件编号',
  //       },
  //     },
  //     {
  //       name: 'item-attribute-keys',
  //       label: {
  //         'en-US': 'Item Attribute Keys',
  //         'zh-CN': '组件属性名',
  //       },
  //     },
  //     {
  //       name: 'item-attribute-values',
  //       label: {
  //         'en-US': 'Item Attribute Values',
  //         'zh-CN': '组件属性值',
  //       },
  //     },
  //   ],
  //   defaultValue:
  //     'category,number,attribute-keys,attribute-values,item-name,item-number,item-attribute-keys,item-attribute-values',
  // },
  // {
  //   name: 'point_label_item',
  //   label: {
  //     'en-US': 'Displayed Point Items',
  //     'zh-CN': '标签显示内容（顶点）',
  //   },
  //   type: TemplateAttributeType.CHECKBOX,
  //   options: [
  //     {
  //       name: 'attribute-keys',
  //       label: {
  //         'en-US': 'Attribute Keys',
  //         'zh-CN': '属性名',
  //       },
  //     },
  //     {
  //       name: 'attribute-values',
  //       label: {
  //         'en-US': 'Attribute Values',
  //         'zh-CN': '属性值',
  //       },
  //     },
  //   ],
  //   defaultValue: 'attribute-keys,attribute-values',
  // },
  // {
  //   name: 'label_style',
  //   label: {
  //     'en-US': 'Label Style',
  //     'zh-CN': '标签样式',
  //   },
  //   type: TemplateAttributeType.RADIO,
  //   options: [
  //     {
  //       name: 'default',
  //       label: {
  //         'en-US': 'Default',
  //         'zh-CN': '默认',
  //       },
  //     },
  //     {
  //       name: 'transparent',
  //       label: {
  //         'en-US': 'Transparent Background',
  //         'zh-CN': '透明背景',
  //       },
  //     },
  //   ],
  //   defaultValue: 'default',
  // },
  // {
  //   name: 'label_format',
  //   label: {
  //     'en-US': 'Label Format',
  //     'zh-CN': '标签排列模式',
  //   },
  //   type: TemplateAttributeType.RADIO,
  //   options: [
  //     {
  //       name: 'default',
  //       label: {
  //         'en-US': 'Default',
  //         'zh-CN': '默认',
  //       },
  //     },
  //     {
  //       name: 'compressed',
  //       label: {
  //         'en-US': 'Compressed',
  //         'zh-CN': '极简',
  //       },
  //     },
  //   ],
  //   defaultValue: 'default',
  // },
  // {
  //   name: 'label_mode',
  //   label: {
  //     'en-US': 'Label Display Mode',
  //     'zh-CN': '标签显示模式',
  //   },
  //   type: TemplateAttributeType.RADIO,
  //   options: [
  //     {
  //       name: 'hide',
  //       label: {
  //         'en-US': 'Hide',
  //         'zh-CN': '隐藏',
  //       },
  //     },
  //     {
  //       name: 'hover',
  //       label: {
  //         'en-US': 'Hover',
  //         'zh-CN': '悬浮显示',
  //       },
  //     },
  //     {
  //       name: 'always',
  //       label: {
  //         'en-US': 'Always',
  //         'zh-CN': '一直显示',
  //       },
  //     },
  //   ],
  //   defaultValue: 'hide',
  // },
  // {
  //   name: 'point_label_mode',
  //   label: {
  //     'en-US': 'Point Label Display Mode',
  //     'zh-CN': '标签显示模式（顶点）',
  //   },
  //   type: TemplateAttributeType.RADIO,
  //   options: [
  //     {
  //       name: 'hide',
  //       label: {
  //         'en-US': 'Hide',
  //         'zh-CN': '隐藏',
  //       },
  //     },
  //     {
  //       name: 'hover',
  //       label: {
  //         'en-US': 'Hover',
  //         'zh-CN': '悬浮显示',
  //       },
  //     },
  //     {
  //       name: 'always',
  //       label: {
  //         'en-US': 'Always',
  //         'zh-CN': '一直显示',
  //       },
  //     },
  //   ],
  //   defaultValue: 'always',
  // },
  // {
  //   name: 'shape_info_item',
  //   label: {
  //     'en-US': 'Shape Info Items',
  //     'zh-CN': '图形信息显示内容',
  //   },
  //   type: TemplateAttributeType.CHECKBOX,
  //   options: [
  //     {
  //       name: 'area',
  //       label: {
  //         'en-US': 'Area',
  //         'zh-CN': '面积',
  //       },
  //     },
  //   ],
  //   defaultValue: '',
  // },
  {
    name: "is_fill",
    label: {
      "en-US": "Shape Fill",
      "zh-CN": "图形填充",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "true",
  },
  {
    name: "fill_opacity",
    label: {
      "en-US": "Shape Fill Opacity",
      "zh-CN": "图形填充的不透明度",
    },
    type: TemplateAttributeType.INPUT,
    defaultValue: "0.2",
  },
  // {
  //   name: 'border_opacity',
  //   label: {
  //     'en-US': 'Line Opacity',
  //     'zh-CN': '线的不透明度',
  //   },
  //   type: TemplateAttributeType.INPUT,
  //   defaultValue: '1',
  // },
  // {
  //   name: 'border_width',
  //   label: {
  //     'en-US': 'Line Size',
  //     'zh-CN': '线宽',
  //   },
  //   type: TemplateAttributeType.INPUT,
  //   defaultValue: '1',
  // },
  // {
  //   name: 'dot_size',
  //   label: {
  //     'en-US': 'Dot Radius',
  //     'zh-CN': '点的半径',
  //   },
  //   type: TemplateAttributeType.INPUT,
  //   defaultValue: '5',
  // },
  {
    name: "show_vertex",
    label: {
      "en-US": "Show Vertexes (Polygons/lines)",
      "zh-CN": "显示多边形/线顶点",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  {
    name: "show_vertex_order",
    label: {
      "en-US": "Show Vertex Order (Polygons/lines)",
      "zh-CN": "显示多边形/线顶点序号",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  // {
  //   name: 'vertex_size',
  //   label: {
  //     'en-US': 'Vertex Radius',
  //     'zh-CN': '顶点半径',
  //   },
  //   type: TemplateAttributeType.INPUT,
  //   defaultValue: '4',
  // },
  // {
  //   name: 'vertex_start',
  //   label: {
  //     'en-US': 'Vertex Start Number',
  //     'zh-CN': '顶点起始序号',
  //   },
  //   type: TemplateAttributeType.INPUT,
  //   defaultValue: '1',
  // },
  {
    name: "measurement_box",
    label: {
      "en-US": "Measurement Box",
      "zh-CN": "尺寸辅助框",
    },
    type: TemplateAttributeType.INPUT,
    tips: {
      "en-US": "Example: [[5,5],[3,3]]",
      "zh-CN": "填写示例：[[5,5],[3,3]]",
    },
  },
  // {
  //   name: 'auto_tracking',
  //   label: {
  //     'en-US': 'Auto Tracking',
  //     'zh-CN': '物体跟踪',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'true',
  // },
  // {
  //   name: 'auto_interpolation',
  //   label: {
  //     'en-US': 'Auto Interpolation',
  //     'zh-CN': '自动补全/调整',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'true',
  // },
  // {
  //   name: 'auto_ocr',
  //   label: {
  //     'en-US': 'Auto OCR',
  //     'zh-CN': '自动OCR识别',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'true',
  // },
  // {
  //   name: 'ocr_tag_group',
  //   label: {
  //     'en-US': 'OCR Text Tags',
  //     'zh-CN': 'OCR文本标签',
  //   },
  //   type: TemplateAttributeType.INPUT,
  // },
  // {
  //   name: 'hotkeys',
  //   label: {
  //     'en-US': 'Hotkeys',
  //     'zh-CN': '属性快捷键',
  //   },
  //   type: TemplateAttributeType.INPUT,
  // },
  // {
  //   name: 'empty_area_check',
  //   label: {
  //     'en-US': 'Unlabeled Area Check',
  //     'zh-CN': '空白未标注区域检查',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'false',
  // },
  // {
  //   name: 'fully_covered_check',
  //   label: {
  //     'en-US': 'Fully Covered Check',
  //     'zh-CN': '完全被覆盖图形检查',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'false',
  // },
  // {
  //   name: 'custom_check',
  //   label: {
  //     'en-US': 'Customized Check Scripts',
  //     'zh-CN': '自定义校验脚本编号',
  //   },
  //   type: TemplateAttributeType.INPUT,
  //   tips: {
  //     'en-US': 'Use comma as delimitation.',
  //     'zh-CN': '多个脚本编号之间以英文逗号分割',
  //   },
  // },
  // {
  //   name: 'submit_check',
  //   label: {
  //     'en-US': 'Check before Submit',
  //     'zh-CN': '任务提交检查',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'false',
  // },
  // {
  //   name: 'boundary_check',
  //   label: {
  //     'en-US': 'Boundary check',
  //     'zh-CN': '边界检查',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'false',
  // },
  // {
  //   name: 'view_rotatable',
  //   label: {
  //     'en-US': 'View Rotatable',
  //     'zh-CN': '允许视图旋转',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'false',
  // },
  {
    name: "rotatable",
    label: {
      "en-US": "Shape Rotatable",
      "zh-CN": "允许图形旋转",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "false",
  },
  // {
  //   name: 'draggable',
  //   label: {
  //     'en-US': 'Shape Draggable',
  //     'zh-CN': '允许图形拖拽移动',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'true',
  // },
  // {
  //   name: 'auto_snap',
  //   label: {
  //     'en-US': 'Auto Snap to Rectangle Edges',
  //     'zh-CN': '长方形自动吸附',
  //   },
  //   type: TemplateAttributeType.SWITCH,
  //   defaultValue: 'false',
  // },
  {
    name: "auto_snap_point",
    label: {
      "en-US": "Auto Snap to Vertexes",
      "zh-CN": "顶点自动吸附",
      "ja-JP": "頂点オートスナップ",
      "ko-KR": "정점 자동 스냅",
    },
    type: TemplateAttributeType.SWITCH,
    defaultValue: "true",
  },
  // {
  //   name: 'min_area',
  //   label: {
  //     'en-US': 'Minimal Area',
  //     'zh-CN': '最小图形面积',
  //   },
  //   type: TemplateAttributeType.INPUT,
  // },
  {
    name: "frame_config",
    label: {
      "en-US": "Image Attributes",
      "zh-CN": "图片属性",
    },
    type: TemplateAttributeType.FORM,
  },
];

/**
 * Landmark
 */
const LandmarkAttributes: TemplateAttribute[] = [
  {
    name: "label_item",
    label: {
      "en-US": "Displayed Items",
      "zh-CN": "标签显示内容",
    },
    type: TemplateAttributeType.CHECKBOX,
    options: [
      {
        name: "category",
        label: {
          "en-US": "Category",
          "zh-CN": "类别",
        },
      },
      {
        name: "attribute-keys",
        label: {
          "en-US": "Attribute Keys",
          "zh-CN": "属性名",
        },
      },
      {
        name: "attribute-values",
        label: {
          "en-US": "Attribute Values",
          "zh-CN": "属性值",
        },
      },
    ],
    defaultValue: "category,attribute-keys,attribute-values",
  },
  {
    name: "point_label_item",
    label: {
      "en-US": "Displayed Point Items",
      "zh-CN": "标签显示内容（点）",
    },
    type: TemplateAttributeType.CHECKBOX,
    options: [
      {
        name: "number",
        label: {
          "en-US": "Number",
          "zh-CN": "编号",
        },
      },
      {
        name: "attribute-keys",
        label: {
          "en-US": "Attribute Keys",
          "zh-CN": "属性名",
        },
      },
      {
        name: "attribute-values",
        label: {
          "en-US": "Attribute Values",
          "zh-CN": "属性值",
        },
      },
    ],
    defaultValue: "number,attribute-keys,attribute-values",
  },
  {
    name: "label_style",
    label: {
      "en-US": "Label Style",
      "zh-CN": "标签样式",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "default",
        label: {
          "en-US": "Default",
          "zh-CN": "默认",
        },
      },
      // {
      //   name: 'transparent',
      //   label: {
      //     'en-US': 'Transparent Background',
      //     'zh-CN': '透明背景',
      //   },
      // },
    ],
    defaultValue: "default",
  },
  {
    name: "label_format",
    label: {
      "en-US": "Label Format",
      "zh-CN": "标签排列模式",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "default",
        label: {
          "en-US": "Default",
          "zh-CN": "默认",
        },
      },
      // {
      //   name: 'compressed',
      //   label: {
      //     'en-US': 'Compressed',
      //     'zh-CN': '极简',
      //   },
      // },
    ],
    defaultValue: "default",
  },
  {
    name: "label_mode",
    label: {
      "en-US": "Label Display Mode",
      "zh-CN": "标签显示模式",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "hide",
        label: {
          "en-US": "Hide",
          "zh-CN": "隐藏",
        },
      },
      {
        name: "hover",
        label: {
          "en-US": "Hover",
          "zh-CN": "悬浮显示",
        },
      },
      {
        name: "always",
        label: {
          "en-US": "Always",
          "zh-CN": "一直显示",
        },
      },
    ],
    defaultValue: "hide",
  },
  {
    name: "point_label_mode",
    label: {
      "en-US": "Point Label Display Mode",
      "zh-CN": "标签显示模式（点）",
    },
    type: TemplateAttributeType.RADIO,
    options: [
      {
        name: "hide",
        label: {
          "en-US": "Hide",
          "zh-CN": "隐藏",
        },
      },
      {
        name: "hover",
        label: {
          "en-US": "Hover",
          "zh-CN": "悬浮显示",
        },
      },
      {
        name: "always",
        label: {
          "en-US": "Always",
          "zh-CN": "一直显示",
        },
      },
    ],
    defaultValue: "always",
  },
];

export const SupportedAttributes: Record<string, TemplateAttribute[]> = {
  [TemplateType.LIDAR]: LidarAttributes,
  [TemplateType.LIDAR_SSE]: LidarSegmentAttributes,
  [TemplateType.TRANSCRIPTION]: TranscriptionAttributes,
  [TemplateType.LANDMARK]: LandmarkAttributes,
  [TemplateType.GENERAL_IMAGE]: GeneralImageAttributes,
};

export const OntologySyncSupportedTemplates = [
  TemplateType.LIDAR,
  TemplateType.LIDAR_SSE,
];

export const TemplateTag = {
  [TemplateType.LIDAR]: "lidar",
  [TemplateType.LIDAR_SSE]: "lidar-segmentation",
  [TemplateType.TEXT]: "text-annotation",
  [TemplateType.TRANSCRIPTION]: "audio-annotation",
  [TemplateType.LANDMARK]: "landmark-annotation",
  [TemplateType.GENERAL_IMAGE]: "general-image",
};

export const getLocalLabel = (label: Record<string, string>) => {
  const locale = getLocale();
  return label[locale] || label["en-US"];
};
