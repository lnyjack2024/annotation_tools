import type { Job } from '@/types/job';
import { JobType } from '@/types/job';
import JobBasicInfo from '@/pages/project/workflow/JobOverview/JobBasicInfo';
import JobDataset from '@/pages/project/workflow/JobOverview/JobDataset';
import JobQaRule from '@/pages/project/workflow/JobOverview/JobQaRule';
import JobDescription from '@/pages/project/workflow/JobOverview/JobDescription';

interface Props {
  job: Job;
  readonly: boolean;
  updating: boolean;
  onUpdateJob: (params: any, callback: () => void) => void;
}

function JobOverview({ job, readonly, updating, onUpdateJob }: Props) {
  return (
    <div>
      <JobBasicInfo
        job={job}
        readonly={readonly}
        updating={updating}
        onUpdateJob={onUpdateJob}
      />
      <JobDataset
        job={job}
        readonly={readonly}
        updating={updating}
        onUpdateJob={onUpdateJob}
      />
      {job?.jobType === JobType.QA && (
        <JobQaRule
          job={job}
          readonly={readonly}
          updating={updating}
          onUpdateJob={onUpdateJob}
        />
      )}
      <JobDescription
        job={job}
        readonly={readonly}
        updating={updating}
        onUpdateJob={onUpdateJob}
      />
    </div>
  );
}

export default JobOverview;
