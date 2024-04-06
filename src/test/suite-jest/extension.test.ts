import * as vscode from 'vscode';

test('Sample test', () => {
  // Mock vscode.window.showInformationMessage
  const mock = jest.spyOn(vscode.window, 'showInformationMessage');
  mock.mockImplementation(() => Promise.resolve(undefined));

  // Call the showInformationMessage function
  vscode.window.showInformationMessage('hello');

  // Check that showInformationMessage was called
  expect(mock).toHaveBeenCalledWith('hello');

  // Restore the original function
  mock.mockRestore();
});
