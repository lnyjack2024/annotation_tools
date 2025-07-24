import TeamHeader from '@/pages/project/workflow/JobWorkforce/TeamHeader';
import WorkforceList from '@/pages/project/workflow/JobWorkforce/WorkforceList';

function JobWorkforce({ readonly }: { readonly: boolean }) {
  return (
    <div>
      <TeamHeader readonly={readonly} />
      <WorkforceList readonly={readonly} />
    </div>
  );
}

export default JobWorkforce;
