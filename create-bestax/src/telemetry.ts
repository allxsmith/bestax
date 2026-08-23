import { detectPackageManager } from './package-manager.js';
import { getToolVersion, reportRun } from './telemetry-core.js';
import type { ReportRunOptions } from './telemetry-core.js';

/**
 * create-bestax payload + reporter. The kernel lives in telemetry-core.ts
 * (copied into bestax-migrate; see that file). Envelope and props are closed
 * enums, a version string, or a bounded integer — never paths, project names,
 * or free text.
 */

export interface ScaffoldChoices {
  template: string;
  bulmaFlavor: string;
  iconLibrary: string;
  skills: boolean;
}

export interface ScaffoldPayload {
  v: 1;
  tool: 'create-bestax';
  event: 'scaffold';
  toolVersion: string;
  nodeMajor: number;
  platform: string;
  props: {
    template: string;
    bulmaFlavor: string;
    iconLibrary: string;
    skills: boolean;
    packageManager: string;
  };
}

export function buildScaffoldPayload(
  choices: ScaffoldChoices
): ScaffoldPayload {
  return {
    v: 1,
    tool: 'create-bestax',
    event: 'scaffold',
    toolVersion: getToolVersion(),
    nodeMajor: Number(process.versions.node.split('.')[0]),
    platform: process.platform,
    props: {
      template: choices.template,
      bulmaFlavor: choices.bulmaFlavor,
      iconLibrary: choices.iconLibrary,
      skills: choices.skills,
      packageManager: detectPackageManager(),
    },
  };
}

export async function reportScaffold(
  choices: ScaffoldChoices,
  flag: boolean | undefined,
  options: ReportRunOptions
): Promise<void> {
  await reportRun(
    flag,
    'create-bestax',
    options,
    buildScaffoldPayload(choices)
  );
}
