export const workspacePaths = ['/dashboard', '/ideas', '/projects/new', '/activity', '/settings/voice', '/settings/instagram'] as const;
export type WorkspacePath = typeof workspacePaths[number];

export function returnPath(input: unknown): WorkspacePath {
  return workspacePaths.find(path => path === input) ?? '/dashboard';
}
