# AMPScript syntax highlighting, code snippets and more

This extension enables syntax highlighting for AMPScript. It also adds code snippets for some language elements and for all avaialble functions. Each snippet includes a detailed description of the function and its parameters. Snippets also show up when you hover a function name.

This extensions can also connect Visual Studio Code directly to your Salesforce Marketing Cloud account. This allows you to easily change content in MC without leaving the text editor and helps you to save time and avoid frequent copy-pasting. It also helps you to better control the content of your emails, content blocks and cloud pages by exposing additional content attributes that are not available in the UI of MC; it allows you to use "Super Content" in almost all supported content types.

AMPScript is the language used to program emails, content blocks, webpages and script activities in the Salesforce Marketing Cloud. It is not a simple task to write code directly in the UI of MC. This extensions helps you solve this problem.


### How to connect to Marketing Cloud

* In your MC accout, create a new installed package and add a 'Server-to-Server' API integration Component
* Add the following permissions:
* * CHANNELS: Email (Read and Write)
* * CHANNELS: Web (Read, Write, Publish)
* * ASSETS: Saved Content (Read and Write)
* Grant access to all required BUs
* Provide package details in the connection manager below, save it and connect
* You'll find the entire Content Builder library in your File Explorer tab
* To open Connection Manager next time press 'CMD+Shift+P' (Mac) or 'CTRL+Shift+P' (Windows) and start typing 'MCFS'. Then hit Enter


### How to enable syntax highlighting

You have two options on how to enable syntax highlighting:

* Open a file that has an ".amp" or an ".ampscript" file extension
* Manually set the language of the file to "AMPscript" (check the video below)

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_video_howto.gif)


### How it looks and works

#### Demo

![Demo](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_video.gif)

#### Function snippets 

![Function snippets](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_snippets.png)

#### Syntax highlighting

![Syntax highlighting](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot.png)
