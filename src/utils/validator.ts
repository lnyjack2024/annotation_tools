import { PASSWORD_PATTERN } from '@/utils/constants';

export const NoPureSpaceRegex = /^(?!(\s+$))/;

export const bpoCodeRegex = /^[0-9a-z]{4,32}$/;

export const nameRegex = /^[0-9a-z\-_]{1,32}$/;

export const emailRegex =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

export function WorkerNumValidator(
  rule: any,
  value: string,
  callback: (error?: string) => void,
) {
  if (value && +value > 10) {
    callback(
      formatMessage({
        id: 'labeling-job-create.wizard.overview.form.worker-number-per-task-error',
      }),
    );
  } else {
    callback();
  }
}

export function JobTimeoutValidator(
  rule: any,
  value: string,
  callback: (error?: string) => void,
) {
  if (value && (+value > 1600000 || +value < 1)) {
    callback(
      formatMessage({
        id: 'labeling-job-create.wizard.overview.form.timeout-error',
      }),
    );
  } else {
    callback();
  }
}

export function NoPureSpaceValidator(
  rule: any,
  value: string,
  callback: (error?: string) => void,
) {
  if (value && !NoPureSpaceRegex.test(value)) {
    callback(formatMessage({ id: 'common.pure-word-space.error' }));
  } else {
    callback();
  }
}

export function PasswordValidator(rule: any, value: string, callback: any) {
  if (value) {
    // const filteredVal = value.replace(/\s+/g, '');
    if (value && !PASSWORD_PATTERN.test(value)) {
      callback(formatMessage({ id: 'common.password' }));
    }
  }
  callback();
}

export function EmailValidator(rule: any, value: string, callback: any) {
  if (value && !emailRegex.test(value)) {
    callback(formatMessage({ id: 'common.email.invalid' }));
  } else {
    callback();
  }
}
