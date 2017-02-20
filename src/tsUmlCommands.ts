import * as fs from "fs";
import * as path from "path";
import { Dictionary } from "typescript-collections";
import * as tsUml from "typescript-uml";
import * as vscode from "vscode";

export class TsUmlCommands {

    private static commandIds = {
        generateClassDiagram: "vscode-tsuml.generateClassDiagram"
    };

    private commands: Dictionary<string, vscode.Disposable>;

    constructor() {
        this.commands = new Dictionary<string, vscode.Disposable>();
    }

    public activate(subscriptions: vscode.Disposable[]) {
        this.commands.setValue(
            TsUmlCommands.commandIds.generateClassDiagram,
            vscode.commands.registerTextEditorCommand(
                TsUmlCommands.commandIds.generateClassDiagram,
                this.generateClassDiagram,
                this)
        );
        subscriptions.push(this);
    }

    public dispose(): void {
        this.commands.forEach((key, value) => {
            value.dispose();
        });
    }

    private generateClassDiagram(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]): any {
        const fileName = textEditor.document.fileName;

        const umlProgram = tsUml.TypeScriptUml.parseUmlProgram([fileName]);
        const yuml = tsUml.TypeScriptUml.generateClassDiagram(umlProgram, { formatter: "yuml" });

        const basename = path.basename(fileName, path.extname(fileName));
        const defaultPath = path.join(path.dirname(fileName), basename + ".yuml");
        const outputPath = vscode.window.showInputBox({
            placeHolder: defaultPath
        }).then(
            (value) => {
                if (value === "") {
                    value = defaultPath;
                }
                fs.writeFile(value, yuml, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(`Failed to write class diagram to "${value}": ${err.message}`);
                    } else {
                        vscode.workspace.openTextDocument(vscode.Uri.file(value)).then((doc) => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            },
            (reason) => {
                vscode.window.showErrorMessage("Error: " + JSON.stringify(reason, null, 4));
            });
    }
}
