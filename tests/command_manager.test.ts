import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandManager, MutationCommand } from '../src/commands/CommandManager';

describe('TDB-510: Immutable Command Architecture (Undo/Redo)', () => {
  let manager: CommandManager;

  beforeEach(() => {
    manager = new CommandManager();
  });

  it('executes a command and pushes it to the undo stack', () => {
    const cmd: MutationCommand = { execute: vi.fn(), undo: vi.fn() };
    manager.executeCommand(cmd);

    expect(cmd.execute).toHaveBeenCalled();
    expect(manager.getUndoDepth()).toBe(1);
    expect(manager.getRedoDepth()).toBe(0);
  });

  it('undoes a command, moving it to the redo stack', () => {
    const cmd: MutationCommand = { execute: vi.fn(), undo: vi.fn() };
    manager.executeCommand(cmd);
    manager.undo();

    expect(cmd.undo).toHaveBeenCalled();
    expect(manager.getUndoDepth()).toBe(0);
    expect(manager.getRedoDepth()).toBe(1);
  });

  it('redoes a command, moving it back to the undo stack', () => {
    const cmd: MutationCommand = { execute: vi.fn(), undo: vi.fn() };
    manager.executeCommand(cmd);
    manager.undo();
    manager.redo();

    expect(cmd.execute).toHaveBeenCalledTimes(2);
    expect(manager.getUndoDepth()).toBe(1);
    expect(manager.getRedoDepth()).toBe(0);
  });

  it('clears the redo stack when a new command is executed', () => {
    const cmd1: MutationCommand = { execute: vi.fn(), undo: vi.fn() };
    const cmd2: MutationCommand = { execute: vi.fn(), undo: vi.fn() };

    manager.executeCommand(cmd1);
    manager.undo(); // cmd1 is now in redo stack
    manager.executeCommand(cmd2); // executes new command

    expect(manager.getUndoDepth()).toBe(1); // only cmd2 is in history
    expect(manager.getRedoDepth()).toBe(0); // redo stack is successfully cleared
  });
});
