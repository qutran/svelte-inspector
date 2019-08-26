type EditorType =
  | 'sublime'
  | 'atom'
  | 'code'
  | 'webstorm'
  | 'phpstorm'
  | 'idea14ce'
  | 'vim'
  | 'emacs'
  | 'visualstudio';

interface IConfig {
  activateKeyCode: number;
  openFileKeyCode: number;
  editor: EditorType;
  color: string;
}

export default function startSvelteInspector(config?: IConfig) {}
