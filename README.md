# AMPScript syntax highlighting, code snippets and more

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/mcfs.gif)

AMPScript is the language used to program emails, content blocks, webpages and script activities in the Salesforce Marketing Cloud. It is not a simple task to write code directly in the UI of MC. This extensions helps you solve this problem.

This extension enables syntax highlighting for AMPScript, allows you to connect Visual Studio Code directly to your MC Account, has built-in documentation for all AMPScript functions and also adds code snippets for language elements and functions. Each snippet includes a detailed description of the function and its parameters. Snippets also show up when you hover a function name.

With direct connection to MC you can: easily change content in MC without leaving your text editor, save time and avoid frequent copy-pasting. It also helps you to better control the content of your emails, content blocks and cloud pages by exposing additional content attributes that are not available in the UI of MC.

### How to enable syntax highlighting

You have two options on how to enable syntax highlighting:

* Open a file that has an ".amp" or an ".ampscript" file extension
* Manually set the language of the file to "AMPscript" (check the video below)

![AMPScript](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_video_howto.gif)


### How to connect to Marketing Cloud

* In your MC accout, create a new installed package and add a 'Server-to-Server' API integration Component
* Add the following permissions:
	* CHANNELS: Email (Read and Write)
	* CHANNELS: Web (Read, Write, Publish)
	* ASSETS: Saved Content (Read and Write)
* Grant access to all required BUs
* Provide package details in the connection manager below, save it and connect
* You'll find the entire Content Builder library in your File Explorer tab
* To open Connection Manager next time press F1 (or 'CMD+Shift+P' on Mac and 'CTRL+Shift+P' on Windows) and start typing 'MCFS'. Find 'MCFS Connecton Manager' and then hit Enter


### How to edit Content Builder assets directly from Visual Studio Code

Each asset is presented as a folder that starts with an 'Ω' symbol. You can easily distinguish different asset types based on the colored square that goes after 'Ω':
* 🟥 blocks
* 🟦 emails
* 🟨 templates
* 🟩 cloudpages
* 🟪 mobile messages


### How it looks and works

#### Demo

![Demo](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_video.gif)

#### Hover snippets 

![Hover snippets](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_hoversnippets.jpg)

#### Code snippets 

![Function snippets](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot_snippets.png)

#### Syntax highlighting

![Syntax highlighting](https://raw.githubusercontent.com/Bizcuit/vscode-ampscript/master/images/screenshot.png)
