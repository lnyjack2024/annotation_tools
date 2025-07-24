export enum AnnotationType {

  VIDEO_TRACK_V2 = 'video-track-v2',
  LONG_AUDIO = 'long-audio',
  KEYPOINT = 'keypoint',
  EDITABLE_TEXT = 'editable-text',
  ADVERTISEMENT = 'advertisement',

  QUESTION_ANSWERING = 'question-answering',
  DIALOGUE = 'dialogue',
};

export enum RunningMode {
  STANDALONE,
  IFRAME,
};

export enum SubmitChannel {
  Label = 'label',
  Qa = 'qa',
  Audit = 'audit',
}

enum LabelSubmitChannel {
  Submit = 'S',
  Next = 'X',
}

enum QaSubmitChannel {
  Approve = 'A',
  Reject = 'R',
}

enum AuditChannel {
  Approve = 'A',
  Reject = 'R',
  Submit = 'S',
}

export const SubmitChannelPayload = {
  ...LabelSubmitChannel,
  ...QaSubmitChannel,
  ...AuditChannel,
};

export type SubmitChannelPayloadType = typeof SubmitChannelPayload;
