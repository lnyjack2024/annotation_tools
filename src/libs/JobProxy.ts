import { Base64 } from 'js-base64';
import { cloneDeep } from 'lodash';
import { AnnotationType } from '../types';
import { ToolMode, isAnnotationReadonly, isQA, isTemplatePreview } from '../utils/tool-mode';
import { fetchResultByUrl, getLocale } from '../utils';
import { Language } from '../utils/constants';

interface JobProxyParams {
  locale?: string;
  toolName: AnnotationType;
  toolMode?: string;
  projectId?: string;
  flowId?: string;
  jobId?: string;
  taskId?: string;
  recordId?: string;
  auditId?: string;
  reviewUrl?: string;
  reviewFrom?: any;
  flowData?: any;
  templateConfig: any;
  saveContent?: (binary: string, filetype: string, filename: string, directory: string, jobId: string, projectId: string, recordId: string, toolFileType: ToolFileType, flowId: string) => Promise<string>;
  loadContent?: (filename: string, directory: string) => Promise<string>;
}

enum ToolFileType {
  LABEL_RESULT = 'LABEL_RESULT', // annotation result
  QA_RESULT = 'QA_RESULT', // review result
  TEMP_LABEL_RESULT = 'LABEL_TEMP_RESULT', // temp saved annotation result
  TEMP_QA_RESULT = 'QA_TEMP_RESULT', // temp saved review result
  STAT_RESULT = 'STAT_RESULT', // statistics result
  AUDIT_RESULT = 'AUDIT_RESULT', // audit result
  UNKNOWN = 'UNKNOWN', // unknown
}

enum FileType {
  TEXT = 'text/plain',
}

const AUDIT_DIRECTORY = 'audit';
const ErrMsg = {
  RESULT_LOAD_ERROR: {
    [Language.EN_US]: 'Failed to load annotation result. Submit is denied. Please refresh page and try again.',
    [Language.ZH_CN]: '标注结果加载失败，禁止提交数据，请刷新后重试。',
    [Language.JA_JP]: 'アノテーション結果の読み込みに失敗しました。提出は拒否されました。ページを更新して、もう一度お試しください。',
    [Language.KO_KR]: '주석 결과를 로드하지 못했습니다. 제출이 거부되었습니다. 페이지를 새로고침하고 다시 시도하십시오.',
  },
  LOAD_CONTENT_NOT_DEFINED: {
    [Language.EN_US]: 'No loadContent function defined.',
    [Language.ZH_CN]: '未定义 loadContent 方法。',
    [Language.JA_JP]: 'loadContent 関数が定義されていません。',
    [Language.KO_KR]: 'loadContent 함수가 정의되지 않았습니다.',
  },
  SAVE_CONTENT_NOT_DEFINED: {
    [Language.EN_US]: 'No saveContent function defined.',
    [Language.ZH_CN]: '未定义 saveContent 方法。',
    [Language.JA_JP]: 'saveContent 関数が定義されていません。',
    [Language.KO_KR]: 'saveContent 함수가 정의되지 않았습니다.',
  },
};

export default class JobProxy {
  locale: Language;

  toolName: AnnotationType;

  toolMode = ToolMode.TEMPLATE_PREVIEW;

  projectId = '';

  flowId = '';

  jobId = '';

  taskId = '';

  recordId = '';

  auditId = '';

  reviewUrl = '';

  reviewFrom: any;

  reviewFromLoadError = false;

  templateConfig: any;

  flowData?: string;

  saveContent?: (binary: string, filetype: string, filename: string, directory: string, jobId: string, projectId: string, recordId: string, toolFileType: ToolFileType, flowId: string) => Promise<string>;

  loadContent?: (filename: string, directory: string) => Promise<string>;

  get resultId() {
    return `${this.jobId}.${this.taskId}.${this.recordId}.result`;
  }

  get reviewId() {
    return `${this.jobId}.${this.taskId}.${this.recordId}.review`;
  }

  get resultFileName() {
    return `${this.resultId}.json`;
  }

  get reviewFileName() {
    return `${this.reviewId}.json`;
  }

  get auditFileName() {
    return `${this.auditId}.json`;
  }

  get resultStatFileName() {
    return `${this.resultId}.stat.json`;
  }

  get reviewStatFileName() {
    if (this.toolMode === ToolMode.AUDIT) {
      // for audit task, no job id provieded, so use audit id instead
      return `${this.auditId}.stat.json`;
    }
    return `${this.reviewId}.stat.json`;
  }

  get fileDirectory() {
    if (this.toolMode === ToolMode.AUDIT) {
      // for audit task, no job id provieded, so use a constant
      return AUDIT_DIRECTORY;
    }
    return this.jobId;
  }

  constructor({
    locale,
    toolName,
    toolMode,
    projectId,
    flowId,
    jobId,
    taskId,
    recordId,
    auditId,
    reviewUrl,
    reviewFrom,
    flowData,
    templateConfig,
    saveContent,
    loadContent,
  }: JobProxyParams) {
    // set locale
    this.locale = getLocale(locale);
    // annotation type, unique key for the processor
    this.toolName = toolName;

    this.setMode(toolMode);
    this.setJobInfo(projectId, flowId, jobId, taskId, recordId);
    this.setAuditId(auditId);
    this.setReviewUrl(reviewUrl);
    this.reviewFrom = reviewFrom;
    this.flowData = JSON.stringify(flowData);
    this.templateConfig = cloneDeep(templateConfig);

    // saveContent & loadContent is provided by the platform
    // if no these two functions, load & save reviews should be implemented by each tool self
    this.saveContent = saveContent;
    this.loadContent = loadContent;
  }

  setMode(toolMode?: string) {
    if (Object.values(ToolMode).includes(toolMode as ToolMode)) {
      this.toolMode = toolMode as ToolMode;
    } else {
      // default is a template preview job
      this.toolMode = ToolMode.TEMPLATE_PREVIEW;
    }
  }

  setJobInfo(projectId?: string, flowId?: string, jobId?: string, taskId?: string, recordId?: string) {
    this.projectId = projectId || '';
    this.flowId = flowId || '';
    this.jobId = jobId || '';
    this.taskId = taskId || '';
    this.recordId = recordId || '';
  }

  setAuditId(auditId?: string) {
    this.auditId = auditId || `${this.jobId}.${this.recordId}.audit`;
  }

  setReviewUrl(reviewUrl?: string) {
    this.reviewUrl = reviewUrl || '';
  }

  /**
   * load data by loadContent
   * @param filename
   * @param directory
   */
  private async load(filename: string, directory = this.fileDirectory) {
    if (!this.loadContent || {}.toString.call(this.loadContent) !== '[object Function]') {
      throw new Error(ErrMsg.LOAD_CONTENT_NOT_DEFINED[this.locale]);
    }

    let data;
    try {
      const res = await this.loadContent(filename, directory);
      data = JSON.parse(res);
    } catch (e) {
      // load error
    }
    return data;
  }

  /**
   * save data by saveContent
   * @param base64
   * @param filetype
   * @param filename
   * @param toolFileType
   */
  private async save(base64: string, filetype: string, filename: string, toolFileType = ToolFileType.UNKNOWN) {
    if (!this.saveContent || {}.toString.call(this.saveContent) !== '[object Function]') {
      throw new Error(ErrMsg.SAVE_CONTENT_NOT_DEFINED[this.locale]);
    }

    let type = toolFileType;
    if (isTemplatePreview(this.toolMode)) {
      // for template preview mode, all save func should be unknown type
      type = ToolFileType.UNKNOWN;
    }
    return this.saveContent(
      base64,
      filetype,
      filename,
      this.fileDirectory,
      this.jobId,
      this.projectId,
      this.recordId,
      type,
      this.flowId,
    );
  }

  /**
   * load temp save annotation result
   */
  async loadSavedResult() {
    if (isAnnotationReadonly(this.toolMode)) {
      // not load temp saved annotation when is readonly
      return undefined;
    }
    return this.load(this.resultFileName);
  }

  /**
   * load annotation result from last task
   */
  async loadReviewFrom() {
    this.reviewFromLoadError = false;
    let result;
    if (typeof this.reviewFrom === 'object') {
      result = this.reviewFrom;
    } else if (typeof this.reviewFrom === 'string' && this.reviewFrom !== '') {
      if (this.reviewFrom.startsWith('http')) {
        try {
          result = await fetchResultByUrl(this.reviewFrom);
        } catch (e) {
          this.reviewFromLoadError = true;
          throw e;
        }
      } else {
        result = JSON.parse(this.reviewFrom);
      }
    }
    return result;
  }

  /**
   * simply to load annotation result
   */
  async loadResult() {
    // get temp saved annotations
    let result = await this.loadSavedResult();

    // get result from review_from
    if (!result) {
      result = await this.loadReviewFrom();
    }

    return result;
  }

  /**
   * load temp saved reviews
   */
  async loadSavedReviews() {
    if (!isQA(this.toolMode)) {
      // not load temp saved reviews when is not a qa job
      return undefined;
    }
    return this.load(this.reviewFileName);
  }

  /**
   * load reviews from last task by link
   * @param reviewUrl
   */
  async loadReviewsFromReview(reviewUrl: string) {
    let reviews;
    if (this.toolMode !== ToolMode.AUDIT) {
      try {
        reviews = await fetchResultByUrl(reviewUrl);
      } catch (e) {
        // get from review url error
      }
    }
    return reviews;
  }

  /**
   * load audit reviews
   */
  async loadReviewsFromAudit() {
    return this.load(this.auditFileName, AUDIT_DIRECTORY);
  }

  /**
   * simply to load reviews
   * @param reviewUrl
   */
  async loadReviews(reviewUrl?: string) {
    // get temp saved reviews
    let reviews = await this.loadSavedReviews();
    const url = reviewUrl || this.reviewUrl;
    if (!reviews && url) {
      // get from review url first
      reviews = await this.loadReviewsFromReview(url);
    }
    if (!reviews) {
      // then get from audit if necessary
      reviews = await this.loadReviewsFromAudit();
    }
    return reviews;
  }

  /**
   * save annotation result
   * @param data
   * @param isSubmit
   */
  async saveResult(data: unknown, isSubmit = false) {
    if (this.reviewFromLoadError) {
      throw new Error(ErrMsg.RESULT_LOAD_ERROR[this.locale]);
    }
    const base64 = Base64.encode(JSON.stringify(data));
    const filename = `${isSubmit ? `R.${new Date().getTime()}.` : ''}${this.resultFileName}`;
    const toolFileType = isSubmit ? ToolFileType.LABEL_RESULT : ToolFileType.TEMP_LABEL_RESULT;
    return this.save(base64, FileType.TEXT, filename, toolFileType);
  }

  /**
   * save reviews
   * @param data
   * @param isSubmit
   */
  async saveReviews(data: unknown, isSubmit = false) {
    if (this.toolMode === ToolMode.AUDIT) {
      return this.saveAudit(data);
    }
    const base64 = Base64.encode(JSON.stringify(data));
    const toolFileType = isSubmit ? ToolFileType.QA_RESULT : ToolFileType.TEMP_QA_RESULT;
    return this.save(base64, FileType.TEXT, this.reviewFileName, toolFileType);
  }

  /**
   * save audit reviews
   * @param data
   */
  async saveAudit(data: unknown) {
    const base64 = Base64.encode(JSON.stringify(data));
    return this.save(base64, FileType.TEXT, this.auditFileName, ToolFileType.AUDIT_RESULT);
  }

  /**
   * save annotation statistics
   * @param data
   */
  async saveResultStat(data: unknown) {
    const base64 = Base64.encode(JSON.stringify(data));
    return this.save(base64, FileType.TEXT, this.resultStatFileName, ToolFileType.STAT_RESULT);
  }

  /**
   * save review statistics (including statistics for audit task)
   * @param data
   */
  async saveReviewStat(data: unknown) {
    const base64 = Base64.encode(JSON.stringify(data));
    return this.save(base64, FileType.TEXT, this.reviewStatFileName, ToolFileType.STAT_RESULT);
  }

  /**
   * save file
   * @param file
   * @param toolFileType
   */
  saveFile = (file: File, toolFileType = ToolFileType.UNKNOWN) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Str = reader.result as string;
      const url = await this.save(base64Str, file.type, `${Date.now()}.${file.name}`, toolFileType);
      if (url) {
        resolve(url);
      } else {
        reject();
      }
    };
    reader.onerror = (e) => reject(e);
  });
}
