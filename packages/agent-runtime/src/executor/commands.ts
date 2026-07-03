export interface ExecutionCommands {
  install?: {
    command: string;
    args: string[];
  };

  build?: {
    command: string;
    args: string[];
  };

  run?: {
    command: string;
    args: string[];
  };
}
