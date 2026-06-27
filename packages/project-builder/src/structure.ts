export interface ProjectStructure {
  folders: string[];
  files: {
    path: string;
    content: string;
  }[];
}
