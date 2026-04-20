import { MutationCommand } from './CommandManager';

export class ASTCommand implements MutationCommand {
  public payload: string;

  constructor(payload: string) {
    this.payload = payload;
  }

  public execute(): void {
    // In actual implementation, interfaces with Monaco editor model proxy
    // applying the payload regex/string edits against the source index
  }

  public undo(): void {
    // Reverese text block mutation mathematically
  }
}
