# annotation_tools

## Start Up

### 1) install dependencies
Node version 16.20.2
```
yarn
```

### 2) start the project
```
yarn start
```
Open [http://localhost:3000/](http://localhost:3000/) to view all available annotation tools. Click the link to any specific annotation tool.

### 3) build the project
```
yarn build
```

## Develop

### HOC: `withConnect`
```
/src/components/withConnect
```
This HOC helps you to enable your annotation tool to connect with the parent iframe and run in a standalone mode. Refer to `/src/tools/video-track-v2.tsx`.
```javascript
// /src/tools/video-track-v2.tsx
const VideoTrackingComp: React.FC = withConnect({
  type: AnnotationType.VIDEO_TRACK_V2,
  samplePayload: payload,
})(VideoTracking);
```

* `type`: annotation tool type.
* `methods`: a list of function names provided by the tool. see [Supported Methods](#supported-methods) below.
* `samplePayload`: used when run in a standalone mode, that the tool can't get payload from parent iframe.

Then in your annotation tool, you will receive props like:
```javascript
{
  loadContent,
  saveContent,
  jobProxy,
  ...payload, // payload get from parent
}
```

* `loadContent`, `saveContent`: functions to get / save data. be careful of these two functions in standalone mode because they are only provided by the parent iframe.
* `jobProxy`: instance to handle all reviews related things. see [Job Proxy](#job-proxy) below.

#### <a name="supported-methods"></a>Supported Methods
Currently `onSubmit`, `cleanData`, `isModified`, `getStatistics`, `getReviews`, `submitReviews` are supported by the platform. You can use `methods` props to define each function's actual name in the tool. If not provided, default function name will be used.
* `onSubmit`: called before the task submitted to get the annotation result. should return a string.
* `cleanData` (deprecated): called after the task submitted successfully to clean data in any storage. should not return anything.
* `isModified`: called before a QA_RW task submitted to check whether annotation data has been modified. should return `true` or `false`.
* `getStatistics`: called before a QA_RO, QA_RW or AUDIT task submitted to get reviews statistics, including approved count, rejected count and so on. should return a value that platform supports (need do integration with the platform)
* `getReviews`: called before a QA_RO, QA_RW task submitted to get the reviews, which will be passed in `_reviews` to the payload next time. should return a string.
* `submitReviews`: called before an AUDIT task submitted to get audit reviews. should not return anything.

### <a name="job-proxy"></a>JobProxy
```
/src/libs/JobProxy
```
An instance has been passed from `withConnect`. Annotation tools can access the instance from `props.jobProxy`. You can also create your own `reviewProcessor` if necessary.

```javascript
// get saved auditId on your own
// or not passed, an auditId will be generated
jobProxy.setAuditId(auditId);
```
```javascript
// get _reviews from payload
// load reviews
jobProxy.loadReviews();
```
```javascript
// save reviews, a saved url will be returned
jobProxy.saveReviews(data);
```
```javascript
// load annotation result
jobProxy.loadResult();
```
```javascript
// save annotation result, a saved url will be returned
jobProxy.saveResult(data);
```

### Tools Folder
Make sure your annotation tool has an entry file `/src/tools/{tool}.tsx`. All the files in `/src/tools/` will be catched to generate different tool html files when built. The entry file's filename should be the same as `AnnotationType` enum value you defined in `/src/types/index.ts`.
