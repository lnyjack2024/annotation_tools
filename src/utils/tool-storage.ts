import { getStorage, setStorage } from './storage';

export enum CacheType {
  // for all projects
  GLOBAL = 'global',
  // for all projects, but only affect current session
  SESSION = 'session',
  // for one project
  BY_PROJECT = 'by-project',

  // for one job
  BY_JOB = 'by-job',
}

const splitKey = '-pid-';
const cachedProjectsCount = 10;
const cachedJobsCount = 20;

function getNamespaceForProject(toolName: string, projectId: string) {
  return `${toolName}${splitKey}${projectId}`;
}

function getNamespaceForJob(toolName: string, jobId: string) {
  return `${toolName}${splitKey}${jobId}`;
}

function getCache(type: CacheType.GLOBAL | CacheType.SESSION, key: string) {
  const storage = type === 'session' ? sessionStorage : localStorage;
  const value = storage.getItem(key);
  if (typeof value === 'string') {
    try {
      const parsedValue = JSON.parse(value);
      return parsedValue;
    } catch (e) {
      return value;
    }
  }
  return undefined;
}
function setCache(type: CacheType.GLOBAL | CacheType.SESSION, key: string, value: unknown) {
  const storage = type === 'session' ? sessionStorage : localStorage;
  try {
    storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.log(`set ${type} storage error: `, e);
  }
}
function removeCache(type: CacheType.GLOBAL | CacheType.SESSION, key: string) {
  const storage = type === 'session' ? sessionStorage : localStorage;
  storage.removeItem(key);
}

export default class ToolStorage {
  toolName: string;

  currentProject: string;

  currentJob: string;

  getCacheTypeByKey: (key: string) => CacheType | undefined;

  get currentProjectNamespace() {
    return getNamespaceForProject(this.toolName, this.currentProject);
  }

  get cachedProjectsNamespace() {
    return `${this.toolName}-cached-proejcts`;
  }

  get currentJobNamespace() {
    return getNamespaceForJob(this.toolName, this.currentJob);
  }

  get cachedJobsNamespace() {
    return `${this.toolName}-cached-jobs`;
  }

  constructor({ toolName, currentProject, currentJob, getCacheTypeByKey }: {
    toolName: string;
    currentProject?: string;
    currentJob?: string;

    getCacheTypeByKey: (key: string) => CacheType | undefined;
  }) {
    this.toolName = toolName;
    this.currentProject = currentProject || 'projectId-default';
    this.currentJob = currentJob || 'jobId-default';

    this.getCacheTypeByKey = getCacheTypeByKey;
  }

  setCurrentProject(projectId?: string, jobId?: string) {
    if (projectId) {
      this.currentProject = projectId;
    }
    if (jobId) {
      this.currentJob = jobId;
    }
  }

  get(key: string) {
    const cacheType = this.getCacheTypeByKey(key);
    switch (cacheType) {
      case CacheType.GLOBAL:
      case CacheType.SESSION:
        return getCache(cacheType, key);
      case CacheType.BY_PROJECT:
        return this.getCacheByProject(key);
      case CacheType.BY_JOB:
        return this.getCacheByJob(key);
      default:
        return undefined;
    }
  }

  set(key: string, value: unknown) {
    const cacheType = this.getCacheTypeByKey(key);
    switch (cacheType) {
      case CacheType.GLOBAL:
      case CacheType.SESSION:
        setCache(cacheType, key, value);
        break;
      case CacheType.BY_PROJECT:
        this.setCacheByProject(key, value);
        break;
      case CacheType.BY_JOB:
        this.setCacheByJob(key, value);
        break;
      default:
    }
  }

  remove(key: string) {
    const cacheType = this.getCacheTypeByKey(key);
    switch (cacheType) {
      case CacheType.GLOBAL:
      case CacheType.SESSION:
        removeCache(cacheType, key);
        break;
      case CacheType.BY_PROJECT:
        this.removeCacheByProject(key);
        break;
      case CacheType.BY_JOB:
        this.removeCacheByJob(key);
        break;
      default:
    }
  }

  getCacheByProject(key: string) {
    return getStorage(this.currentProjectNamespace, key);
  }

  setCacheByProject(key: string, value: unknown) {
    this.updateCachedProjects();
    setStorage(this.currentProjectNamespace, key, value);
  }

  removeCacheByProject(key: string) {
    const store = this.getCacheByProject(key);
    if (store) {
      delete store[key];
      this.updateCachedProjects();
      try {
        localStorage.setItem(this.currentProjectNamespace, JSON.stringify(store));
      } catch (e) {
        console.log('update storage error: ', e);
      }
    }
  }

  updateCachedProjects() {
    let store: Record<string, number>;
    try {
      store = JSON.parse(localStorage.getItem(this.cachedProjectsNamespace) || '{}');
    } catch (e) {
      store = {};
    }

    const cachedProjects = Object.keys(store);
    if (!cachedProjects.includes(this.currentProject) && cachedProjects.length >= cachedProjectsCount) {
      // cached projects full, remove oldest projects
      cachedProjects.sort((a, b) => store[a] - store[b]); // asc
      const deleteCount = cachedProjects.length - cachedProjectsCount + 1;
      for (let i = 0; i < deleteCount; i += 1) {
        const deleteProject = cachedProjects[i];
        delete store[deleteProject];
        localStorage.removeItem(getNamespaceForProject(this.toolName, deleteProject));
      }
    }

    store[this.currentProject] = Date.now();

    try {
      localStorage.setItem(this.cachedProjectsNamespace, JSON.stringify(store));
    } catch (e) {
      console.log('update cahced projects error: ', e);
    }
  }

  getCacheByJob<K>(key: string): K | undefined {
    return getStorage(this.currentJobNamespace, key);
  }

  setCacheByJob<K>(key: string, value: K) {
    this.updateCachedJobs();
    setStorage(this.currentJobNamespace, key, value);
  }

  removeCacheByJob(key: string) {
    const store = this.getCacheByJob(key);
    if (store) {
      delete (store as { [key: string]: unknown })[key];
      this.updateCachedJobs();
      try {
        localStorage.setItem(this.currentJobNamespace, JSON.stringify(store));
      } catch (e) {
        console.info('update storage error: ', e);
      }
    }
  }

  updateCachedJobs() {
    let store: Record<string, number>;
    try {
      store = JSON.parse(localStorage.getItem(this.cachedJobsNamespace) || '{}');
    } catch (e) {
      store = {};
    }

    const cachedJobs = Object.keys(store);
    if (!cachedJobs.includes(this.currentJob) && cachedJobs.length >= cachedJobsCount) {
      // cached projects full, remove oldest projects
      cachedJobs.sort((a, b) => store[a] - store[b]); // asc
      const deleteCount = cachedJobs.length - cachedJobsCount + 1;
      for (let i = 0; i < deleteCount; i += 1) {
        const deleteJob = cachedJobs[i];
        delete store[deleteJob];
        localStorage.removeItem(getNamespaceForJob(this.toolName, deleteJob));
      }
    }
    store[this.currentJob] = Date.now();

    try {
      localStorage.setItem(this.cachedJobsNamespace, JSON.stringify(store));
    } catch (e) {
      console.info('update cahced jobs error: ', e);
    }
  }
}
